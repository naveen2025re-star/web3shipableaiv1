import { useState } from 'react';
import { marked } from 'marked';

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

  // Configure marked for better rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
  });

  // Clean and beautify markdown content
  const beautifyMarkdown = (content: string): string => {
    if (!content || typeof content !== 'string') return '';

    // Remove redundant headers and labels
    let cleaned = content
      // Remove redundant section headers
      .replace(/^\s*(?:vulnerability\s*name|severity|impact|vulnerable\s*code|technical\s*analysis|explanation|proof\s*of\s*concept|remediation|recommendation|references?)\s*:?\s*$/gmi, '')
      // Remove standalone severity indicators
      .replace(/^\s*(?:severity|risk\s*level|priority)\s*:\s*(?:critical|high|medium|low|informational)\s*$/gmi, '')
      // Remove evidence & justification headers
      .replace(/^\s*(?:evidence\s*&\s*justification|detailed\s*explanation)\s*:?\s*$/gmi, '')
      // Remove lines with just dashes, equals, or asterisks
      .replace(/^\s*[-=*]{3,}\s*$/gm, '')
      // Remove empty bullet points
      .replace(/^\s*[-*+]\s*$/gm, '')
      // Convert various bullet points to standard markdown
      .replace(/^\s*[•◦▪]\s*/gm, '- ')
      // Ensure proper spacing after periods
      .replace(/\.(\s*)([A-Z])/g, '.\n\n$2')
      // Add proper spacing around headers
      .replace(/^(#{1,6}\s+)/gm, '\n$1')
      // Ensure proper list formatting
      .replace(/^(\d+\.\s+)/gm, '\n$1')
      .replace(/^([-*+]\s+)/gm, '\n$1')
      // Clean up multiple newlines
      .replace(/\n{4,}/g, '\n\n\n')
      // Remove leading/trailing whitespace
      .trim();

    return cleaned;
  };

  // Extract code blocks from content
  const extractCodeBlocks = (content: string): string => {
    const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.join('\n\n');
  };

  // Extract severity from text
  const extractSeverity = (text: string): Finding['severity'] => {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('critical')) return 'Critical';
    if (textLower.includes('high')) return 'High';
    if (textLower.includes('low')) return 'Low';
    if (textLower.includes('info')) return 'Informational';
    
    return 'Medium'; // Default
  };

  // Simple section extraction
  const extractSection = (content: string, sectionNames: string[]): string => {
    for (const sectionName of sectionNames) {
      const regex = new RegExp(`(?:^|\\n)(?:\\*\\*)?${sectionName}(?:\\*\\*)?[:\\-\\s]*([\\s\\S]*?)(?=\\n(?:\\*\\*|##|###|$))`, 'i');
      const match = content.match(regex);
      if (match && match[1] && match[1].trim().length > 20) {
        return beautifyMarkdown(match[1]);
      }
    }
    return '';
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary; findings: Finding[] } => {
    const cleanContent = beautifyMarkdown(response);
    const findings: Finding[] = [];

    // Look for structured findings using multiple patterns
    const findingPatterns = [
      /(?:^|\n)#{1,4}\s*(?:finding|vulnerability|issue)\s*\d*[:\-\s]*([^\n]+)([\s\S]*?)(?=\n#{1,4}\s*(?:finding|vulnerability|issue)|\n#{1,4}\s*\d+\.|\n\*\*(?:finding|vulnerability)|$)/gi,
      /(?:^|\n)#{1,4}\s*\d+\.\s*([^\n]+)([\s\S]*?)(?=\n#{1,4}\s*\d+\.|\n#{1,4}\s*(?:finding|vulnerability)|$)/gi,
      /(?:^|\n)\*\*(?:finding|vulnerability|issue)\s*\d*[:\-\s]*([^*\n]+)\*\*([\s\S]*?)(?=\n\*\*(?:finding|vulnerability)|$)/gi
    ];

    let foundFindings = false;

    for (const pattern of findingPatterns) {
      const matches = [...cleanContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        foundFindings = true;
        
        matches.forEach((match, index) => {
          const vulnerabilityName = beautifyMarkdown(match[1] || `Security Finding ${index + 1}`);
          const findingContent = match[2] || '';
          
          // Extract sections
          const impact = extractSection(findingContent, ['impact', 'description', 'summary']) || 
                        '**Security Impact:** This vulnerability poses a security risk that requires attention.';
          
          const explanation = extractSection(findingContent, ['technical analysis', 'explanation', 'analysis', 'details']) || 
                            beautifyMarkdown(findingContent.replace(/```[\s\S]*?```/g, '').substring(0, 500)) || 
                            'Technical analysis indicates potential security concerns that should be addressed.';
          
          const proofOfConcept = extractSection(findingContent, ['proof of concept', 'poc', 'exploit', 'attack']) || 
                               'Proof of concept analysis required for validation.';
          
          const remediation = extractSection(findingContent, ['remediation', 'recommendation', 'fix', 'solution', 'mitigation']) || 
                            '**Recommended Actions:**\n\n1. Review the identified vulnerability\n2. Implement appropriate security measures\n3. Test the fix thoroughly\n4. Consider additional security audits';
          
          const references = extractSection(findingContent, ['references', 'links', 'cve', 'swc']) || '';
          
          const vulnerableCode = extractCodeBlocks(findingContent);
          const severity = extractSeverity(findingContent);
          
          // Extract CVE/SWC IDs
          const cveMatch = findingContent.match(/CVE-\d{4}-\d{4,}/);
          const swcMatch = findingContent.match(/SWC-\d{3}/);

          findings.push({
            vulnerabilityName,
            severity,
            impact,
            vulnerableCode,
            explanation,
            proofOfConcept,
            remediation,
            references,
            cveId: cveMatch ? cveMatch[0] : undefined,
            swcId: swcMatch ? swcMatch[0] : undefined
          });
        });
        
        break;
      }
    }

    // Fallback: Create a general finding if no structured findings found
    if (!foundFindings && cleanContent.length > 100) {
      const severity = extractSeverity(cleanContent);
      const codeBlocks = extractCodeBlocks(cleanContent);
      
      findings.push({
        vulnerabilityName: 'Smart Contract Security Analysis',
        severity,
        impact: '**Security Assessment:** Comprehensive security analysis completed with detailed findings.',
        vulnerableCode: codeBlocks,
        explanation: beautifyMarkdown(cleanContent.replace(/```[\s\S]*?```/g, '')),
        proofOfConcept: 'Detailed analysis provided above for security validation.',
        remediation: '**Recommended Actions:**\n\n1. Review the security analysis above\n2. Implement suggested improvements\n3. Follow smart contract best practices\n4. Consider additional security testing',
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