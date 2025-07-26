import { useState } from 'react';

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
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  findings?: Finding[];
  summary?: AuditSummary;
  timestamp: Date;
}

export function useAudit() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to extract specific sections with precise boundaries
  const extractSpecificSection = (
    text: string, 
    sectionPatterns: string[], 
    nextSectionPatterns: string[] = []
  ): { content: string; remaining: string } => {
    for (const pattern of sectionPatterns) {
      // Create regex that matches the section header and captures content until next section or end
      const nextPattern = nextSectionPatterns.length > 0 
        ? `(?=(?:${nextSectionPatterns.join('|')}))`
        : '$';
      
      const regex = new RegExp(
        `(?:^|\\n)\\s*(?:\\*\\*|##?\\s*|###\\s*)?${pattern}\\s*(?:\\*\\*)?\\s*:?\\s*\\n?([\\s\\S]*?)(?=${nextPattern})`,
        'im'
      );
      
      const match = text.match(regex);
      if (match && match[1]) {
        const content = match[1].trim();
        const remaining = text.replace(match[0], '').trim();
        return { content, remaining };
      }
    }
    return { content: '', remaining: text };
  };

  // Helper function to extract all code blocks from text
  const extractCodeBlocks = (text: string): { code: string; remaining: string } => {
    const codeBlocks: string[] = [];
    let remaining = text;
    
    // Extract all code blocks (```...``` format)
    const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    // Remove code blocks from text
    remaining = text.replace(codeBlockRegex, '').trim();
    
    return {
      code: codeBlocks.join('\n\n'),
      remaining
    };
  };

  // Helper function to clean text content
  const cleanText = (text: string): string => {
    return text
      .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
      .replace(/^\s*#+\s*/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
  };

  // Helper function to extract severity from text
  const extractSeverity = (text: string): { severity: Finding['severity']; remaining: string } => {
    const severityPatterns = [
      'severity[:\\s]*([^\\n]+)',
      'risk\\s*level[:\\s]*([^\\n]+)',
      'priority[:\\s]*([^\\n]+)'
    ];

    for (const pattern of severityPatterns) {
      const regex = new RegExp(pattern, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const severityText = match[1].toLowerCase().trim();
        let severity: Finding['severity'] = 'Medium';
        
        if (severityText.includes('critical')) severity = 'Critical';
        else if (severityText.includes('high')) severity = 'High';
        else if (severityText.includes('medium')) severity = 'Medium';
        else if (severityText.includes('low')) severity = 'Low';
        else if (severityText.includes('info')) severity = 'Informational';
        
        const remaining = text.replace(match[0], '').trim();
        return { severity, remaining };
      }
    }

    // Fallback: scan entire text for severity keywords
    const textLower = text.toLowerCase();
    let severity: Finding['severity'] = 'Medium';
    if (textLower.includes('critical')) severity = 'Critical';
    else if (textLower.includes('high')) severity = 'High';
    else if (textLower.includes('low')) severity = 'Low';
    else if (textLower.includes('info')) severity = 'Informational';

    return { severity, remaining: text };
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary; findings: Finding[] } => {
    let cleanContent = response
      .replace(/^\s*```[\w]*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    const findings: Finding[] = [];

    // Enhanced patterns to find vulnerability sections
    const findingPatterns = [
      // Pattern 1: Standard finding headers with various formats
      /(?:##?\s*)?(?:FINDING|Finding|Vulnerability|Issue|Problem)\s*(?:\d+)?[:\-\s]*([^\n]+)([\s\S]*?)(?=(?:##?\s*(?:FINDING|Finding|Vulnerability|Issue|Problem)|\n##|\n#\s|$))/gi,
      // Pattern 2: Name/Type format
      /(?:Name\/Type|Title|Vulnerability\s*Name)[:\s]*([^\n]+)([\s\S]*?)(?=(?:Name\/Type|Title|Vulnerability\s*Name|\n##|\n#\s|$))/gi,
      // Pattern 3: Numbered findings
      /(\d+\.\s*[^#\n]+)([\s\S]*?)(?=(?:\d+\.\s*|\n##|\n#\s|$))/gi
    ];

    let foundFindings = false;

    for (const pattern of findingPatterns) {
      const matches = [...cleanContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        foundFindings = true;
        
        matches.forEach((match) => {
          const title = match[1]?.trim() || 'Security Finding';
          let sectionContent = match[2]?.trim() || '';

          // Step 1: Extract severity
          const { severity, remaining: afterSeverity } = extractSeverity(sectionContent);
          sectionContent = afterSeverity;

          // Step 2: Extract vulnerable code (before other sections to avoid contamination)
          const vulnerableCodeExtraction = extractSpecificSection(
            sectionContent,
            ['Vulnerable Code', 'Code Snippet', 'Affected Code', 'Code', 'Contract Code'],
            ['Technical Analysis', 'Explanation', 'Analysis', 'Proof of Concept', 'PoC', 'Remediation', 'Recommendation', 'References', 'Impact']
          );
          let vulnerableCode = vulnerableCodeExtraction.content;
          sectionContent = vulnerableCodeExtraction.remaining;

          // Extract code blocks from vulnerable code section
          if (vulnerableCode) {
            const codeExtraction = extractCodeBlocks(vulnerableCode);
            vulnerableCode = codeExtraction.code || cleanText(vulnerableCode);
          }

          // Step 3: Extract proof of concept
          const pocExtraction = extractSpecificSection(
            sectionContent,
            ['Proof of Concept', 'PoC', 'Exploit', 'Attack Scenario', 'Exploitation'],
            ['Remediation', 'Recommendation', 'Fix', 'Solution', 'References', 'Technical Analysis', 'Explanation', 'Analysis', 'Impact']
          );
          let proofOfConcept = pocExtraction.content;
          sectionContent = pocExtraction.remaining;

          // Clean PoC content
          if (proofOfConcept) {
            const pocCodeExtraction = extractCodeBlocks(proofOfConcept);
            if (pocCodeExtraction.code) {
              proofOfConcept = pocCodeExtraction.code + '\n\n' + cleanText(pocCodeExtraction.remaining);
            } else {
              proofOfConcept = cleanText(proofOfConcept);
            }
          }

          // Step 4: Extract remediation
          const remediationExtraction = extractSpecificSection(
            sectionContent,
            ['Remediation', 'Recommendation', 'Fix', 'Solution', 'Mitigation', 'Prevention'],
            ['References', 'Links', 'CVE', 'SWC', 'Technical Analysis', 'Explanation', 'Analysis', 'Impact']
          );
          let remediation = remediationExtraction.content;
          sectionContent = remediationExtraction.remaining;

          // Clean remediation content
          if (remediation) {
            const remCodeExtraction = extractCodeBlocks(remediation);
            if (remCodeExtraction.code) {
              remediation = cleanText(remCodeExtraction.remaining) + '\n\n```solidity\n' + remCodeExtraction.code + '\n```';
            } else {
              remediation = cleanText(remediation);
            }
          }

          // Step 5: Extract references
          const referencesExtraction = extractSpecificSection(
            sectionContent,
            ['References', 'Links', 'CVE', 'SWC', 'External Links', 'Documentation'],
            ['Technical Analysis', 'Explanation', 'Analysis', 'Impact']
          );
          const references = referencesExtraction.content ? cleanText(referencesExtraction.content) : '';
          sectionContent = referencesExtraction.remaining;

          // Step 6: Extract technical analysis/explanation
          const explanationExtraction = extractSpecificSection(
            sectionContent,
            ['Technical Analysis', 'Explanation', 'Analysis', 'Details', 'Description'],
            ['Impact']
          );
          let explanation = explanationExtraction.content;
          sectionContent = explanationExtraction.remaining;

          // Clean explanation content
          if (explanation) {
            const expCodeExtraction = extractCodeBlocks(explanation);
            if (expCodeExtraction.code) {
              explanation = cleanText(expCodeExtraction.remaining) + '\n\n```solidity\n' + expCodeExtraction.code + '\n```';
            } else {
              explanation = cleanText(explanation);
            }
          }

          // Step 7: Extract impact (use remaining content or look for specific impact section)
          const impactExtraction = extractSpecificSection(
            sectionContent,
            ['Impact', 'Effect', 'Consequence', 'Risk'],
            []
          );
          let impact = impactExtraction.content;
          
          // If no specific impact section found, use remaining content as impact
          if (!impact && sectionContent) {
            impact = cleanText(sectionContent);
          }
          
          // Fallback impact
          if (!impact) {
            impact = 'Security vulnerability identified - impact assessment needed';
          } else {
            impact = cleanText(impact);
          }

          // Ensure we have meaningful content for explanation
          if (!explanation && sectionContent) {
            explanation = cleanText(sectionContent);
          }
          if (!explanation) {
            explanation = 'Technical analysis needed for this vulnerability';
          }

          findings.push({
            vulnerabilityName: title,
            severity,
            impact,
            vulnerableCode: vulnerableCode || '',
            explanation,
            proofOfConcept: proofOfConcept || '',
            remediation: remediation || '',
            references: references || ''
          });
        });
        
        break; // Use the first pattern that finds matches
      }
    }

    // Fallback: create a general finding if no structured findings found
    if (!foundFindings && cleanContent.length > 50) {
      const { severity } = extractSeverity(cleanContent);
      const codeExtraction = extractCodeBlocks(cleanContent);
      
      findings.push({
        vulnerabilityName: 'Security Analysis Report',
        severity,
        impact: 'Comprehensive security assessment completed',
        vulnerableCode: codeExtraction.code,
        explanation: cleanText(codeExtraction.remaining) || cleanContent,
        proofOfConcept: '',
        remediation: 'Review the analysis and implement recommended security measures',
        references: ''
      });
    }

    // Calculate summary
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
      overallRisk: 'Minimal'
    };

    // Determine overall risk
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

  const performAudit = async (code: string, description: string, fileName?: string, fileCount?: number) => {
    setIsLoading(true);
    
    // Add user message
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
    
    try {
      // Check if environment variables are configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl.includes('your-project-ref') || 
          supabaseUrl.includes('your_supabase_project_url') ||
          supabaseAnonKey.includes('your_supabase_anon_key')) {
        throw new Error('🔧 **Supabase Setup Required**\n\nTo use the audit feature, you need to:\n\n1. Click the "Connect to Supabase" button in the top right corner\n2. Set up your Supabase project\n3. The environment variables will be configured automatically\n\nOnce connected, you can start auditing smart contracts!');
      }
      
      // Call Supabase edge function
      let response;
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/audit-contract`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            description
          })
        });
      } catch (fetchError) {
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          throw new Error('🌐 **Connection Error**\n\nUnable to connect to Supabase. This could be due to:\n\n• **Supabase not configured**: Click "Connect to Supabase" in the top right\n• **Network connectivity issues**: Check your internet connection\n• **Edge function not deployed**: The audit-contract function may not be available\n\nPlease try connecting to Supabase first, then retry the audit.');
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to get audit response`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `🚨 **Audit Service Error**\n\n${errorData.error}`;
            if (errorData.details) {
              errorMessage += `\n\n**Details:** ${errorData.details}`;
            }
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status-based message
          if (response.status === 404) {
            errorMessage = '🔍 **Edge Function Not Found**\n\nThe audit-contract function is not deployed. Please ensure your Supabase project has the edge function properly set up.';
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = '🔐 **Authentication Error**\n\nInvalid Supabase credentials. Please reconnect to Supabase using the button in the top right corner.';
          } else if (response.status >= 500) {
            errorMessage = '⚠️ **Server Error**\n\nThe audit service is temporarily unavailable. Please try again in a few moments.';
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Audit request failed');
      }
      
      const auditResult = data.audit || 'Unable to complete audit analysis.';
      
      // Parse findings from the response
      const { content, summary, findings } = parseAuditResponse(auditResult);
      
      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: content,
        findings: findings,
        summary: summary,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Audit error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ **Audit Failed** - ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check your configuration and try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    performAudit
  };
}