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
    
    // Calculate summary from the content
    const summary = calculateAuditSummary(cleanContent);
    
    return {
      content: cleanContent,
      summary
    };
  }
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
      const { content, summary } = parseAuditResponse(auditResult);
      
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