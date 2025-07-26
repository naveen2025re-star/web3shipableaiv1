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

  const extractSection = (text: string, patterns: string[]): { content: string; remaining: string } => {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'is');
      const match = text.match(regex);
      if (match) {
        const content = match[1]?.trim() || '';
        const remaining = text.replace(match[0], '').trim();
        return { content, remaining };
      }
    }
    return { content: '', remaining: text };
  };

  const extractCodeBlocks = (text: string): { code: string; remaining: string } => {
    const codeBlocks: string[] = [];
    let remaining = text;
    
    // Extract all code blocks
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

  const cleanText = (text: string): string => {
    return text
      .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
      .replace(/^\s*#+\s*/gm, '') // Remove markdown headers
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
  };

  const parseAuditResponse = (response: string): { content: string; summary: AuditSummary; findings: Finding[] } => {
    let cleanContent = response
      .replace(/^\s*```[\w]*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    const findings: Finding[] = [];

    // Enhanced patterns to find vulnerability sections
    const findingPatterns = [
      // Pattern 1: Standard finding headers
      /(?:##?\s*)?(?:FINDING|Finding|Vulnerability)\s*(?:\d+)?[:\-\s]*([^\n]+)([\s\S]*?)(?=(?:##?\s*(?:FINDING|Finding|Vulnerability)|\n##|\n#\s|$))/gi,
      // Pattern 2: Numbered findings
      /(\d+\.\s*[^#\n]+)([\s\S]*?)(?=(?:\d+\.\s*|\n##|\n#\s|$))/gi,
      // Pattern 3: Name/Type format
      /(?:Name\/Type|Title)[:\s]*([^\n]+)([\s\S]*?)(?=(?:Name\/Type|Title|\n##|\n#\s|$))/gi
    ];

    let foundFindings = false;

    for (const pattern of findingPatterns) {
      const matches = [...cleanContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        foundFindings = true;
        
        matches.forEach((match) => {
          const title = match[1]?.trim() || 'Security Finding';
          let sectionContent = match[2]?.trim() || '';

          // Extract severity first
          const severityExtraction = extractSection(sectionContent, [
            'severity[:\s]*([^\n]+)',
            'risk[:\s]*([^\n]+)',
            '(?:critical|high|medium|low|informational)'
          ]);
          
          let severity: Finding['severity'] = 'Medium';
          if (severityExtraction.content) {
            const sev = severityExtraction.content.toLowerCase();
            if (sev.includes('critical')) severity = 'Critical';
            else if (sev.includes('high')) severity = 'High';
            else if (sev.includes('medium')) severity = 'Medium';
            else if (sev.includes('low')) severity = 'Low';
            else if (sev.includes('info')) severity = 'Informational';
          } else {
            // Fallback: check entire section for severity keywords
            const sev = sectionContent.toLowerCase();
            if (sev.includes('critical')) severity = 'Critical';
            else if (sev.includes('high')) severity = 'High';
            else if (sev.includes('low')) severity = 'Low';
            else if (sev.includes('info')) severity = 'Informational';
          }
          
          sectionContent = severityExtraction.remaining;

          // Extract vulnerable code blocks
          const codeExtraction = extractCodeBlocks(sectionContent);
          const vulnerableCode = codeExtraction.code;
          sectionContent = codeExtraction.remaining;

          // Extract impact
          const impactExtraction = extractSection(sectionContent, [
            'impact[:\s]*([^\n]+(?:\n(?!(?:proof|remediation|reference|explanation|technical))[^\n]*)*)',
            'description[:\s]*([^\n]+(?:\n(?!(?:proof|remediation|reference|explanation|technical))[^\n]*)*)'
          ]);
          const impact = impactExtraction.content || 'Impact assessment needed';
          sectionContent = impactExtraction.remaining;

          // Extract proof of concept
          const pocExtraction = extractSection(sectionContent, [
            'proof\\s*of\\s*concept[:\s]*([\s\S]*?)(?=(?:remediation|recommendation|reference|technical|explanation|$))',
            'poc[:\s]*([\s\S]*?)(?=(?:remediation|recommendation|reference|technical|explanation|$))',
            'exploit[:\s]*([\s\S]*?)(?=(?:remediation|recommendation|reference|technical|explanation|$))'
          ]);
          const proofOfConcept = pocExtraction.content;
          sectionContent = pocExtraction.remaining;

          // Extract remediation
          const remediationExtraction = extractSection(sectionContent, [
            'remediation[:\s]*([\s\S]*?)(?=(?:reference|technical|explanation|$))',
            'recommendation[:\s]*([\s\S]*?)(?=(?:reference|technical|explanation|$))',
            'fix[:\s]*([\s\S]*?)(?=(?:reference|technical|explanation|$))',
            'solution[:\s]*([\s\S]*?)(?=(?:reference|technical|explanation|$))'
          ]);
          const remediation = remediationExtraction.content;
          sectionContent = remediationExtraction.remaining;

          // Extract references
          const referencesExtraction = extractSection(sectionContent, [
            'reference[s]?[:\s]*([\s\S]*?)(?=(?:technical|explanation|$))',
            'link[s]?[:\s]*([\s\S]*?)(?=(?:technical|explanation|$))',
            'cve[:\s]*([\s\S]*?)(?=(?:technical|explanation|$))',
            'swc[:\s]*([\s\S]*?)(?=(?:technical|explanation|$))'
          ]);
          const references = referencesExtraction.content;
          sectionContent = referencesExtraction.remaining;

          // Extract technical analysis/explanation
          const explanationExtraction = extractSection(sectionContent, [
            'technical\\s*analysis[:\s]*([\s\S]*?)$',
            'explanation[:\s]*([\s\S]*?)$',
            'analysis[:\s]*([\s\S]*?)$'
          ]);
          
          // If no explicit technical analysis section, use remaining content
          const explanation = explanationExtraction.content || cleanText(sectionContent) || 'Technical analysis needed';

          findings.push({
            vulnerabilityName: title,
            severity,
            impact,
            vulnerableCode,
            explanation,
            proofOfConcept,
            remediation,
            references
          });
        });
        
        break; // Use the first pattern that finds matches
      }
    }

    // Fallback: create a general finding if no structured findings found
    if (!foundFindings && cleanContent.length > 50) {
      let severity: Finding['severity'] = 'Medium';
      const content = cleanContent.toLowerCase();
      if (content.includes('critical')) severity = 'Critical';
      else if (content.includes('high')) severity = 'High';
      else if (content.includes('low')) severity = 'Low';
      else if (content.includes('info')) severity = 'Informational';

      const codeExtraction = extractCodeBlocks(cleanContent);
      
      findings.push({
        vulnerabilityName: 'Security Analysis',
        severity,
        impact: 'Security assessment completed',
        vulnerableCode: codeExtraction.code,
        explanation: cleanText(codeExtraction.remaining) || cleanContent,
        proofOfConcept: '',
        remediation: '',
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