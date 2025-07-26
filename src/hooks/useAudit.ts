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

  // Enhanced helper function to extract and remove sections with multiple end patterns
  const extractAndRemoveSection = (
    text: string, 
    startPatterns: RegExp[], 
    endPatterns: RegExp[]
  ): { extracted: string; remaining: string } => {
    let bestMatch = null;
    let bestStartIndex = -1;
    let bestEndIndex = -1;
    let bestExtracted = '';

    // Find the best matching start pattern
    for (const startPattern of startPatterns) {
      const startMatch = text.match(startPattern);
      if (startMatch && startMatch.index !== undefined) {
        const startIndex = startMatch.index + startMatch[0].length;
        
        // Look for end patterns
        const remainingText = text.substring(startIndex);
        let endIndex = remainingText.length; // Default to end of text
        
        for (const endPattern of endPatterns) {
          const endMatch = remainingText.match(endPattern);
          if (endMatch && endMatch.index !== undefined && endMatch.index < endIndex) {
            endIndex = endMatch.index;
          }
        }
        
        const extracted = remainingText.substring(0, endIndex).trim();
        
        // Use the first valid match found
        if (extracted && (bestMatch === null || startMatch.index < bestStartIndex)) {
          bestMatch = startMatch;
          bestStartIndex = startMatch.index;
          bestEndIndex = startIndex + endIndex;
          bestExtracted = extracted;
        }
      }
    }

    if (bestMatch && bestStartIndex !== -1) {
      const remaining = text.substring(0, bestStartIndex) + text.substring(bestEndIndex);
      return { extracted: bestExtracted, remaining: remaining.trim() };
    }

    return { extracted: '', remaining: text };
  };

  // Helper function to extract code blocks
  const extractCodeBlocks = (text: string): string => {
    const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return codeBlocks.join('\n\n');
  };

  // Helper function to clean markdown formatting
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks temporarily for cleaning
      .replace(/^\s*[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/^\s*#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();
  };

  // Helper function to extract severity from text
  const extractSeverity = (text: string): Finding['severity'] => {
    const textLower = text.toLowerCase();
    
    // Look for explicit severity declarations
    const severityPatterns = [
      /(?:severity|risk\s*level|priority):\s*([^\n]+)/i,
      /\*\*severity\*\*:\s*([^\n]+)/i,
      /-\s*\*\*severity\*\*:\s*([^\n]+)/i,
      /severity\s*=\s*([^\n]+)/i
    ];
    
    for (const pattern of severityPatterns) {
      const match = text.match(pattern);
      if (match) {
        const severityText = match[1].toLowerCase().trim();
        if (severityText.includes('critical')) return 'Critical';
        if (severityText.includes('high')) return 'High';
        if (severityText.includes('medium')) return 'Medium';
        if (severityText.includes('low')) return 'Low';
        if (severityText.includes('info')) return 'Informational';
      }
    }

    // Fallback: scan for severity keywords anywhere in text
    if (textLower.includes('critical')) return 'Critical';
    if (textLower.includes('high')) return 'High';
    if (textLower.includes('low')) return 'Low';
    if (textLower.includes('info')) return 'Informational';

    return 'Medium'; // Default fallback
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary; findings: Finding[] } => {
    let cleanContent = response.trim();
    const findings: Finding[] = [];

    // Multiple patterns to identify finding headers
    const findingHeaderPatterns = [
      /(?:^|\n)#{1,4}\s*(?:finding|vulnerability|issue|problem)\s*\d*[:\-\s]*([^\n]+)/gi,
      /(?:^|\n)#{1,4}\s*\d+\.\s*([^\n]+)/gi,
      /(?:^|\n)\*\*(?:finding|vulnerability|issue)\s*\d*[:\-\s]*([^*\n]+)\*\*/gi,
      /(?:^|\n)(?:finding|vulnerability|issue)\s*\d*[:\-\s]*([^\n]+)/gi
    ];

    // Try to find structured findings
    let foundStructuredFindings = false;

    for (const headerPattern of findingHeaderPatterns) {
      const headerMatches = [...cleanContent.matchAll(headerPattern)];
      
      if (headerMatches.length > 0) {
        foundStructuredFindings = true;
        
        for (let i = 0; i < headerMatches.length; i++) {
          const currentMatch = headerMatches[i];
          const nextMatch = headerMatches[i + 1];
          
          const startIndex = currentMatch.index! + currentMatch[0].length;
          const endIndex = nextMatch ? nextMatch.index! : cleanContent.length;
          
          const findingText = cleanContent.substring(startIndex, endIndex).trim();
          const vulnerabilityName = cleanMarkdown(currentMatch[1] || `Security Finding ${i + 1}`);
          
          if (!findingText) continue;

          // Extract severity from the entire finding block
          const severity = extractSeverity(currentMatch[0] + '\n' + findingText);

          // Define end patterns for section extraction
          const sectionEndPatterns = [
            /(?:^|\n)(?:\*\*(?:impact|vulnerable|explanation|proof|remediation|reference)|#{1,4}\s*(?:impact|vulnerable|explanation|proof|remediation|reference))/i,
            /(?:^|\n)-\s*\*\*(?:impact|vulnerable|explanation|proof|remediation|reference)/i,
            /(?:^|\n)#{1,4}\s*\d+\./,
            /(?:^|\n)\*\*(?:finding|vulnerability|issue)/i
          ];

          let remainingText = findingText;

          // Extract Proof of Concept first (most specific)
          const pocResult = extractAndRemoveSection(
            remainingText,
            [
              /(?:^|\n)(?:\*\*)?(?:proof\s*of\s*concept|poc)(?:\*\*)?[:\-\s]*/i,
              /(?:^|\n)-\s*\*\*(?:proof\s*of\s*concept|poc)\*\*[:\-\s]*/i
            ],
            sectionEndPatterns
          );
          const proofOfConcept = cleanMarkdown(pocResult.extracted);
          remainingText = pocResult.remaining;

          // Extract Remediation
          const remediationResult = extractAndRemoveSection(
            remainingText,
            [
              /(?:^|\n)(?:\*\*)?(?:remediation|recommendation|fix|solution)(?:\*\*)?[:\-\s]*/i,
              /(?:^|\n)-\s*\*\*(?:remediation|recommendation|fix|solution)\*\*[:\-\s]*/i
              /(?:^|\n)🛠️\s*(?:remediation|recommendation|fix|solution|mitigation)[:\-\s]*/i,
              /(?:^|\n)(?:remediation|recommendation|fix|solution|mitigation)\s*steps[:\-\s]*/i
            ],
            sectionEndPatterns
          );
          let remediation = cleanMarkdown(remediationResult.extracted);
          
          // If no remediation found, look for it in the entire finding text
          if (!remediation) {
            const remediationPatterns = [
              /(?:remediation|recommendation|fix|solution|mitigation)[:\-\s]*([^]*?)(?=\n(?:\*\*|##|###|🔍|📊|⚡|🛠️|📚)|$)/i,
              /(?:to\s+fix|to\s+resolve|to\s+address)[:\-\s]*([^]*?)(?=\n(?:\*\*|##|###|🔍|📊|⚡|🛠️|📚)|$)/i
            ];
            
            for (const pattern of remediationPatterns) {
              const match = findingText.match(pattern);
              if (match && match[1].trim()) {
                remediation = cleanMarkdown(match[1].trim());
                break;
              }
            }
          }
          remainingText = remediationResult.remaining;

          // Extract References
          const referencesResult = extractAndRemoveSection(
            remainingText,
            [
              /(?:^|\n)(?:\*\*)?(?:references?|links?|swc|cve)(?:\*\*)?[:\-\s]*/i,
              /(?:^|\n)-\s*\*\*(?:references?|links?|swc|cve)\*\*[:\-\s]*/i
            ],
            sectionEndPatterns
          );
          const references = cleanMarkdown(referencesResult.extracted);
          remainingText = referencesResult.remaining;

          // Extract Impact
          const impactResult = extractAndRemoveSection(
            remainingText,
            [
              /(?:^|\n)(?:\*\*)?(?:impact|description|summary)(?:\*\*)?[:\-\s]*/i,
              /(?:^|\n)-\s*\*\*(?:impact|description|summary)\*\*[:\-\s]*/i
            ],
            sectionEndPatterns
          );
          const impact = cleanMarkdown(impactResult.extracted);
          remainingText = impactResult.remaining;

          // Extract Vulnerable Code
          const vulnerableCodeBlocks = extractCodeBlocks(findingText);
          const codeResult = extractAndRemoveSection(
            remainingText,
            [
              /(?:^|\n)(?:\*\*)?(?:vulnerable\s*code|code|location)(?:\*\*)?[:\-\s]*/i,
              /(?:^|\n)-\s*\*\*(?:vulnerable\s*code|code|location)\*\*[:\-\s]*/i
            ],
            sectionEndPatterns
          );
          const vulnerableCode = vulnerableCodeBlocks || cleanMarkdown(codeResult.extracted);
          remainingText = codeResult.remaining;

          // What's left is the explanation/technical analysis
          const explanation = cleanMarkdown(remainingText) || 'Technical analysis required';

          // Extract CVE/SWC IDs
          const cveMatch = findingText.match(/CVE-\d{4}-\d{4,}/);
          const swcMatch = findingText.match(/SWC-\d{3}/);

          findings.push({
            vulnerabilityName,
            severity,
            impact: impact || 'Security vulnerability identified',
            vulnerableCode,
            explanation,
            proofOfConcept,
            remediation: remediation || 'Review the technical analysis for remediation guidance',
            references,
            cveId: cveMatch ? cveMatch[0] : undefined,
            swcId: swcMatch ? swcMatch[0] : undefined
          });
        }
        
        break; // Use the first pattern that finds structured findings
      }
    }

    // Fallback: If no structured findings found, try to extract from bullet points or sections
    if (!foundStructuredFindings) {
      // Look for any vulnerability mentions in the text
      const vulnerabilityPatterns = [
        /(?:vulnerability|issue|problem|flaw|weakness)[:\-\s]*([^\n]+)/gi,
        /(?:^|\n)-\s*([^\n]*(?:vulnerability|issue|problem|flaw|weakness)[^\n]*)/gi
      ];

      let foundVulnerabilities = false;
      for (const pattern of vulnerabilityPatterns) {
        const matches = [...cleanContent.matchAll(pattern)];
        if (matches.length > 0) {
          foundVulnerabilities = true;
          matches.forEach((match, index) => {
            const vulnerabilityName = cleanMarkdown(match[1] || `Security Finding ${index + 1}`);
            const severity = extractSeverity(cleanContent);
            const codeBlocks = extractCodeBlocks(cleanContent);
            
            findings.push({
              vulnerabilityName,
              severity,
              impact: 'Security assessment completed',
              vulnerableCode: codeBlocks,
              explanation: cleanMarkdown(cleanContent.replace(/```[\s\S]*?```/g, '')),
              proofOfConcept: '',
              remediation: 'Review the analysis and implement recommended security measures',
              references: ''
            });
          });
          break;
        }
      }

      // Ultimate fallback: Create a general finding if content exists
      if (!foundVulnerabilities && cleanContent.length > 50) {
        const severity = extractSeverity(cleanContent);
        const codeBlocks = extractCodeBlocks(cleanContent);
        
        findings.push({
          vulnerabilityName: 'Smart Contract Security Analysis',
          severity,
          impact: 'Comprehensive security assessment completed',
          vulnerableCode: codeBlocks,
          explanation: cleanMarkdown(cleanContent.replace(/```[\s\S]*?```/g, '')),
          proofOfConcept: '',
          remediation: 'Review the analysis and implement recommended security measures',
          references: ''
        });
      }
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
      
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
        throw new Error('Supabase environment variables are not configured. Please set up your Supabase project and update the .env file with your actual project URL and anonymous key.');
      }
      
      // Call Supabase edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/audit-contract`, {
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get audit response`);
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