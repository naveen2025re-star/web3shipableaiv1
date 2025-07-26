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

  const calculateAuditSummary = (content: string): AuditSummary => {
    // Extract summary information from the markdown content
    const criticalCount = (content.match(/critical/gi) || []).length;
    const highCount = (content.match(/high.*severity|high.*risk/gi) || []).length;
    const mediumCount = (content.match(/medium.*severity|medium.*risk/gi) || []).length;
    const lowCount = (content.match(/low.*severity|low.*risk/gi) || []).length;
    const informationalCount = (content.match(/informational|info/gi) || []).length;
    
    // Count actual findings by looking for numbered sections or finding headers
    const findingMatches = content.match(/(?:## FINDING|# FINDING|FINDING \d+|Finding \d+|\d+\.\s*[A-Z])/gi) || [];
    const totalFindings = Math.max(findingMatches.length, 1);
    
    // Calculate risk score (weighted by severity)
    const riskScore = (criticalCount * 10) + (highCount * 7) + (mediumCount * 4) + (lowCount * 2) + (informationalCount * 1);
    
    let overallRisk: 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal' = 'Minimal';
    if (criticalCount > 0) overallRisk = 'Critical';
    else if (highCount > 0) overallRisk = 'High';
    else if (mediumCount > 2) overallRisk = 'High';
    else if (mediumCount > 0 || lowCount > 3) overallRisk = 'Medium';
    else if (lowCount > 0) overallRisk = 'Low';

    return {
      totalFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      informationalCount,
      riskScore,
      overallRisk
    };
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary } => {
    // Clean up the response content
    let cleanContent = response
      .replace(/^\s*```[\w]*\n?/, '') // Remove opening code blocks
      .replace(/\n?```\s*$/, '') // Remove closing code blocks
      .trim();
    
    // Extract structured findings from the response
    const findings: Finding[] = [];
    
    // Look for vulnerability sections in various formats
    const vulnerabilityPatterns = [
      /(?:##?\s*)?(?:FINDING|Finding|Vulnerability)\s*(?:\d+)?[:\-\s]*([^\n]+)[\s\S]*?(?=(?:##?\s*(?:FINDING|Finding|Vulnerability)|\n##|\n#\s|$))/gi,
      /(?:##?\s*)?([^#\n]+(?:vulnerability|issue|problem|flaw)[^#\n]*)[\s\S]*?(?=(?:##?\s*(?:FINDING|Finding|Vulnerability)|\n##|\n#\s|$))/gi,
      /(?:##?\s*)?(\d+\.\s*[^#\n]+)[\s\S]*?(?=(?:\d+\.\s*|\n##|\n#\s|$))/gi
    ];
    
    let foundFindings = false;
    
    for (const pattern of vulnerabilityPatterns) {
      const matches = [...cleanContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        foundFindings = true;
        
        matches.forEach((match, index) => {
          const fullSection = match[0];
          const title = match[1]?.trim() || `Vulnerability ${index + 1}`;
          
          // Extract severity
          const severityMatch = fullSection.match(/(?:severity|risk)[:\s]*([a-z]+)/i);
          let severity: Finding['severity'] = 'Medium';
          if (severityMatch) {
            const sev = severityMatch[1].toLowerCase();
            if (sev.includes('critical')) severity = 'Critical';
            else if (sev.includes('high')) severity = 'High';
            else if (sev.includes('medium')) severity = 'Medium';
            else if (sev.includes('low')) severity = 'Low';
            else if (sev.includes('info')) severity = 'Informational';
          }
          
          // Extract impact
          const impactMatch = fullSection.match(/(?:impact|description)[:\s]*([^\n]+(?:\n(?!\s*(?:proof|remediation|reference|vulnerable|explanation))[^\n]*)*)/i);
          const impact = impactMatch ? impactMatch[1].trim() : 'Impact assessment needed';
          
          // Extract vulnerable code
          const codeMatches = fullSection.match(/```[\w]*\n?([\s\S]*?)\n?```/g);
          const vulnerableCode = codeMatches ? codeMatches.map(code => 
            code.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '')
          ).join('\n\n') : '';
          
          // Extract explanation/technical analysis
          let explanation = fullSection
            .replace(/(?:##?\s*)?(?:FINDING|Finding|Vulnerability)\s*(?:\d+)?[:\-\s]*[^\n]+\n?/i, '')
            .replace(/(?:severity|risk)[:\s]*[^\n]+\n?/i, '')
            .replace(/(?:impact|description)[:\s]*[^\n]+(?:\n(?!\s*(?:proof|remediation|reference|vulnerable|explanation))[^\n]*)*/i, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/(?:proof\s*of\s*concept|poc)[:\s]*[\s\S]*?(?=(?:remediation|reference|$))/i, '')
            .replace(/(?:remediation|recommendation|fix)[:\s]*[\s\S]*?(?=(?:reference|$))/i, '')
            .replace(/(?:reference|link)[:\s]*[\s\S]*$/i, '')
            .trim();
          
          // Extract proof of concept
          const pocMatch = fullSection.match(/(?:proof\s*of\s*concept|poc)[:\s]*([\s\S]*?)(?=(?:remediation|recommendation|reference|$))/i);
          const proofOfConcept = pocMatch ? pocMatch[1].trim() : '';
          
          // Extract remediation
          const remediationMatch = fullSection.match(/(?:remediation|recommendation|fix)[:\s]*([\s\S]*?)(?=(?:reference|$))/i);
          const remediation = remediationMatch ? remediationMatch[1].trim() : '';
          
          // Extract references
          const referencesMatch = fullSection.match(/(?:reference|link)[:\s]*([\s\S]*?)$/i);
          const references = referencesMatch ? referencesMatch[1].trim() : '';
          
          findings.push({
            vulnerabilityName: title,
            severity,
            impact,
            vulnerableCode,
            explanation: explanation || 'Technical analysis needed',
            proofOfConcept,
            remediation,
            references
          });
        });
        
        break; // Use the first pattern that finds matches
      }
    }
    
    // If no structured findings found, create a general finding from the content
    if (!foundFindings && cleanContent.length > 50) {
      // Look for severity indicators in the content
      let severity: Finding['severity'] = 'Medium';
      if (/critical/i.test(cleanContent)) severity = 'Critical';
      else if (/high/i.test(cleanContent)) severity = 'High';
      else if (/low/i.test(cleanContent)) severity = 'Low';
      else if (/info/i.test(cleanContent)) severity = 'Informational';
      
      // Extract code blocks
      const codeMatches = cleanContent.match(/```[\w]*\n?([\s\S]*?)\n?```/g);
      const vulnerableCode = codeMatches ? codeMatches.map(code => 
        code.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '')
      ).join('\n\n') : '';
      
      // Create a general finding
      findings.push({
        vulnerabilityName: 'Security Analysis',
        severity,
        impact: 'Security assessment completed',
        vulnerableCode,
        explanation: cleanContent.replace(/```[\s\S]*?```/g, '').trim(),
        proofOfConcept: '',
        remediation: '',
        references: ''
      });
    }
    
    // Calculate summary from the content
    const summary = calculateAuditSummary(cleanContent);
    
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
      
      // Create appropriate message based on actual findings severity
      let messageContent = '';
      if (summary.totalFindings > 0) {
        const criticalIssues = summary.criticalCount;
        const highIssues = summary.highCount;
        const mediumIssues = summary.mediumCount;
        const lowIssues = summary.lowCount;
        
        if (criticalIssues > 0) {
          messageContent = content;
        } else if (highIssues > 0) {
          messageContent = content;
        } else if (mediumIssues > 0) {
          messageContent = content;
        } else if (lowIssues > 0) {
          messageContent = content;
        } else {
          messageContent = content;
        }
      } else {
        messageContent = content;
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: messageContent,
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