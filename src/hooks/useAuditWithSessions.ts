import { Project } from './useProjects';

interface Finding {
  vulnerabilityName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  impact: string;
  vulnerableCode: string;
  explanation: string;
  proofOfConcept: string;
  remediation: string;
  references?: string;
  cveId?: string;
  swcId?: string;
}

interface AuditSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  informationalCount: number;
  riskScore: number;
  overallRisk: 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal';
  contractName?: string;
  additionalObservations?: string[];
  conclusion?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  findings?: Finding[];
  summary?: AuditSummary;
  timestamp: Date;
}

export function useAuditWithSessions() {
  // Helper function to extract code blocks
  const extractCodeBlocks = (text: string): string[] => {
    const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return codeBlocks;
  };

  // Helper function to clean code snippets
  const cleanCodeSnippet = (code: string): string => {
    if (!code || code.trim().length === 0) return code;
    
    const lines = code.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines at start/end but keep internal empty lines for structure
      if (trimmedLine === '') return true;
      
      // Remove markdown list prefixes and clean up line formatting
      let cleanLine = trimmedLine;
      
      // Remove common markdown list prefixes (-, *, +, numbers)
      cleanLine = cleanLine.replace(/^[-*+]\s*/, '');
      cleanLine = cleanLine.replace(/^\d+\.\s*/, '');
      cleanLine = cleanLine.replace(/^[-*+]\s*/, ''); // Double check for nested prefixes
      
      // Update trimmedLine to use cleaned version for further checks
      const finalTrimmedLine = cleanLine.trim();
      
      // Remove function declarations
      if (finalTrimmedLine.startsWith('function ') && finalTrimmedLine.includes('(')) return false;
      
      // Remove standalone closing braces (but keep braces that are part of code blocks)
      if (finalTrimmedLine === '}' || /^}\s*\/\//.test(finalTrimmedLine)) return false;
      
      // Remove descriptive comments
      if (finalTrimmedLine.startsWith('// Function:') || 
          finalTrimmedLine.startsWith('// Start of') || 
          finalTrimmedLine.startsWith('// End of') || 
          finalTrimmedLine.startsWith('// Vulnerable function') ||
          finalTrimmedLine.startsWith('// This function') ||
          finalTrimmedLine.startsWith('// The following')) return false;
      
      // Return the cleaned line instead of original
      return cleanLine;
    }).map(line => {
      // Clean each line that passes the filter
      let cleanLine = line.trim();
      
      // Remove markdown list prefixes
      cleanLine = cleanLine.replace(/^[-*+]\s*/, '');
      cleanLine = cleanLine.replace(/^\d+\.\s*/, '');
      cleanLine = cleanLine.replace(/^[-*+]\s*/, ''); // Double check
      
      // Preserve original indentation structure but use cleaned content
      const originalIndent = line.match(/^\s*/)?.[0] || '';
      return originalIndent + cleanLine;
    });
    
    // Filter out any lines that became empty after cleaning
    const finalLines = cleanedLines.filter(line => {
      const trimmed = line.trim();
      return trimmed !== '' && trimmed !== '-' && trimmed !== '*' && trimmed !== '+';
    });
    
    // Remove leading and trailing empty lines
    while (finalLines.length > 0 && finalLines[0].trim() === '') {
      finalLines.shift();
    }
    while (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') {
      finalLines.pop();
    }
    
    return finalLines.join('\n');
  };

  // Helper function to extract severity from text
  const extractSeverity = (text: string): Finding['severity'] => {
    const severityMatch = text.match(/(?:severity|risk\s*level|priority):\s*([^\n]+)/i);
    if (severityMatch) {
      const severityText = severityMatch[1].toLowerCase().trim();
      if (severityText.includes('critical')) return 'Critical';
      if (severityText.includes('high')) return 'High';
      if (severityText.includes('medium')) return 'Medium';
      if (severityText.includes('low')) return 'Low';
      if (severityText.includes('info')) return 'Informational';
    }

    const textLower = text.toLowerCase();
    if (textLower.includes('- **severity**: critical') || textLower.includes('**severity**: critical')) return 'Critical';
    if (textLower.includes('- **severity**: high') || textLower.includes('**severity**: high')) return 'High';
    if (textLower.includes('- **severity**: medium') || textLower.includes('**severity**: medium')) return 'Medium';
    if (textLower.includes('- **severity**: low') || textLower.includes('**severity**: low')) return 'Low';
    if (textLower.includes('- **severity**: informational') || textLower.includes('**severity**: informational')) return 'Informational';

    return 'Medium';
  };

  // Helper function to extract bullet point content
  const extractBulletContent = (text: string, bulletName: string): string => {
    const regex = new RegExp(`-\\s*\\*\\*${bulletName}\\*\\*:?\\s*([\\s\\S]*?)(?=\\n-\\s*\\*\\*|\\n###|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary; findings: Finding[] } => {
    let cleanContent = response.trim();
    const findings: Finding[] = [];

    const contractMatch = cleanContent.match(/####\s*Contract:\s*`([^`]+)`/);
    const contractName = contractMatch ? contractMatch[1] : 'Smart Contract';

    const vulnerabilityMatches = cleanContent.match(/###\s*Vulnerability\s*\d*:?\s*([^\n]+)([\s\S]*?)(?=###\s*(?:Vulnerability|Additional|Conclusion)|$)/gi);

    if (vulnerabilityMatches) {
      vulnerabilityMatches.forEach((vulnSection) => {
        const nameMatch = vulnSection.match(/###\s*Vulnerability\s*\d*:?\s*([^\n]+)/i);
        const vulnerabilityName = nameMatch ? nameMatch[1].trim() : 'Security Finding';

        const severity = extractSeverity(vulnSection);
        const codeBlocks = extractCodeBlocks(vulnSection);
        const vulnerableCode = codeBlocks.length > 0 ? cleanCodeSnippet(codeBlocks[0]) : '';

        const explanation = extractBulletContent(vulnSection, 'Detailed Explanation') || 
                          extractBulletContent(vulnSection, 'Technical Analysis') ||
                          extractBulletContent(vulnSection, 'Description');

        let proofOfConcept = extractBulletContent(vulnSection, 'Proof of Concept') ||
                             extractBulletContent(vulnSection, 'Evidence & Justification') ||
                             extractBulletContent(vulnSection, 'Attack Scenario');

        const remediation = extractBulletContent(vulnSection, 'Recommended Remediation') ||
                          extractBulletContent(vulnSection, 'Remediation') ||
                          extractBulletContent(vulnSection, 'Fix');

        const references = extractBulletContent(vulnSection, 'References') ||
                         extractBulletContent(vulnSection, 'Links');

        let impact = extractBulletContent(vulnSection, 'Impact') ||
                    extractBulletContent(vulnSection, 'Risk') ||
                    extractBulletContent(vulnSection, 'Consequence');

        if (!impact && explanation) {
          const sentences = explanation.split(/[.!?]+/);
          impact = sentences[0] ? sentences[0].trim() + '.' : 'Security vulnerability identified';
        }

        if (codeBlocks.length > 1) {
          const pocCode = cleanCodeSnippet(codeBlocks.slice(1).join('\n\n'));
          if (pocCode && !proofOfConcept.includes('```')) {
            proofOfConcept += pocCode ? `\n\n\`\`\`solidity\n${cleanCodeSnippet(pocCode)}\n\`\`\`` : '';
          }
        }

        findings.push({
          vulnerabilityName,
          severity,
          impact: impact || 'Security vulnerability that requires attention',
          vulnerableCode,
          explanation: explanation || 'Technical analysis required',
          proofOfConcept: proofOfConcept || '',
          remediation: remediation || 'Remediation steps needed',
          references: references || ''
        });
      });
    }

    const additionalObservations: string[] = [];
    const observationsMatch = cleanContent.match(/###\s*Additional\s*Observations([\s\S]*?)(?=###|$)/i);
    if (observationsMatch) {
      const observationsText = observationsMatch[1];
      const bulletPoints = observationsText.match(/^\s*[-*]\s*\*\*([^*]+)\*\*:\s*([^\n]+)/gm);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          const cleanPoint = point.trim();
          if (cleanPoint) additionalObservations.push(cleanPoint);
        });
      }
    }

    const conclusionMatch = cleanContent.match(/###\s*Conclusion([\s\S]*?)$/i);
    const conclusion = conclusionMatch ? conclusionMatch[1].trim() : '';

    if (findings.length === 0 && cleanContent.length > 50) {
      const severity = extractSeverity(cleanContent);
      const codeBlocks = extractCodeBlocks(cleanContent);
      
      findings.push({
        vulnerabilityName: 'Smart Contract Security Analysis',
        severity,
        impact: 'Comprehensive security assessment completed',
        vulnerableCode: cleanCodeSnippet(codeBlocks.join('\n\n')),
        explanation: cleanContent.replace(/```[\s\S]*?```/g, '').trim(),
        proofOfConcept: '',
        remediation: 'Review the analysis and implement recommended security measures',
        references: ''
      });
    }

    const summary: AuditSummary = {
      totalFindings: findings.length,
      criticalCount: findings.filter(f => f.severity === 'Critical').length,
      highCount: findings.filter(f => f.severity === 'High').length,
      mediumCount: findings.filter(f => f.severity === 'Medium').length,
      lowCount: findings.filter(f => f.severity === 'Low').length,
      informationalCount: findings.filter(f => f.severity === 'Informational').length,
      riskScore: findings.reduce((score, f) => {
        const weights = { Critical: 10, High: 7, Medium: 4, Low: 2, Informational: 1 };
        return score + weights[f.severity];
      }, 0),
      overallRisk: 'Minimal',
      contractName,
      additionalObservations,
      conclusion
    };

    if (summary.criticalCount > 0) summary.overallRisk = 'Critical';
    else if (summary.highCount > 0) summary.overallRisk = 'High';
    else if (summary.mediumCount > 2) summary.overallRisk = 'High';
    else if (summary.mediumCount > 0 || summary.lowCount > 3) summary.overallRisk = 'Medium';
    else if (summary.lowCount > 0) summary.overallRisk = 'Low';

    return {
      content: cleanContent,
      summary,
      findings
    };
  };

  const performAudit = async (
    code: string,
    description: string,
    currentProject: Project,
    currentSessionId: string,
    messages: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    saveMessage: (message: Message) => Promise<void>,
    updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  ) => {
    setIsLoading(true);
    
    // Create user message with code
    const codeDisplay = `**Smart Contract Code:**\n\`\`\`solidity\n${code}\n\`\`\``;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `${description ? `**Contract Description:** ${description}\n\n` : ''}${codeDisplay}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);

    // Update session title if this is the first message
    if (messages.length === 0) {
      const title = description || 'Smart Contract Audit';
      await updateSessionTitle(currentSessionId, title);
    }
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }
      
      console.log('Making audit request to edge function...');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/audit-contract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          description,
          projectContext: {
            contractLanguage: currentProject.contract_language,
            targetBlockchain: currentProject.target_blockchain,
            projectName: currentProject.name
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          codeLength: code.length
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Failed to parse error response' };
        }
        
        // Create more user-friendly error messages
        let userMessage = errorData.error || 'Failed to process audit request';
        
        if (errorData.suggestions && Array.isArray(errorData.suggestions)) {
          userMessage += '\n\nSuggestions:\n' + errorData.suggestions.map(s => `• ${s}`).join('\n');
        } else if (errorData.details) {
          userMessage += `\n\nDetails: ${errorData.details}`;
        }
        
        // Add specific guidance based on error type
        if (response.status === 400) {
          if (errorData.error?.includes('too large') || errorData.details?.includes('size')) {
            userMessage += '\n\n💡 Try reducing the code size or splitting into smaller files.';
          }
        } else if (response.status === 503 || response.status >= 500) {
          userMessage += '\n\n💡 This appears to be a temporary service issue. Please try again in a few minutes.';
        }
        
        throw new Error(userMessage);
      }
      
      const data = await response.json();
      console.log('Received audit response', {
        hasAudit: !!data.audit,
        auditLength: data.audit?.length || 0,
        metadata: data.metadata
      });
      
      if (!data.audit) {
        throw new Error('Invalid response format from audit service');
      }
      
      const auditResult = data.audit || 'Unable to complete audit analysis.';
      
      const { content, summary, findings } = parseAuditResponse(auditResult);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: content,
        findings: findings,
        summary: summary,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);
      
    } catch (error) {
      console.error('Audit error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ **Audit Failed** - ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    performAudit,
  };
}