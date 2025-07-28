
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
      
      if (trimmedLine === '') return true;
      if (trimmedLine.startsWith('function ') && trimmedLine.includes('(')) return false;
      if (trimmedLine === '}' || /^}\s*\/\//.test(trimmedLine)) return false;
      if (trimmedLine.startsWith('// Function:') || 
          trimmedLine.startsWith('// Start of') || 
          trimmedLine.startsWith('// End of') || 
          trimmedLine.startsWith('// Vulnerable function') ||
          trimmedLine.startsWith('// This function') ||
          trimmedLine.startsWith('// The following')) return false;
      
      return true;
    });
    
    while (cleanedLines.length > 0 && cleanedLines[0].trim() === '') {
      cleanedLines.shift();
    }
    while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
      cleanedLines.pop();
    }
    
    return cleanedLines.join('\n');
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
    currentSessionId: string,
    messages: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    saveMessage: (message: Message) => Promise<void>,
    updateSessionTitle: (sessionId: string, title: string) => Promise<void>,
    fileName?: string,
    fileCount?: number
  ) => {
    setIsLoading(true);
    
    // Create user message
    let codeDisplay;
    if (fileName && fileCount && fileCount > 1) {
      codeDisplay = `**Uploaded Files:** ${fileName}\n\n**Smart Contract Code:**\n\`\`\`solidity\n${code}\n\`\`\``;
    } else if (fileName) {
      codeDisplay = `**Uploaded File:** \`${fileName}\`\n\n**Smart Contract Code:**\n\`\`\`solidity\n${code}\n\`\`\``;
    } else {
      codeDisplay = `**Smart Contract Code:**\n\`\`\`solidity\n${code}\n\`\`\``;
    }
    
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
      const apiKey = import.meta.env.VITE_SHIPABLE_API_KEY || '707c6f07-3426-4674-b885-55bdc9eb3549';
      
      if (!apiKey) {
        throw new Error('Shipable AI API key is not configured. Please set VITE_SHIPABLE_API_KEY in your .env file.');
      }

      const userMessage = `${description ? `Contract Description: ${description}\n\n` : ''}Please audit this smart contract:\n\n\`\`\`solidity\n${code}\n\`\`\``;
      
      const response = await fetch('https://api.shipable.ai/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'o1',
          messages: [
            { role: 'user', content: userMessage }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to get audit response`);
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Shipable AI API');
      }
      
      const auditResult = data.choices[0].message.content || 'Unable to complete audit analysis.';
      
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
        content: `❌ **Audit Failed** - ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check your configuration and try again.`,
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