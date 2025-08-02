import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Shield, Copy, Download, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

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

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  findings?: Finding[];
  summary?: AuditSummary;
  timestamp: Date;
}

const severityConfig = {
  Critical: { 
    color: 'bg-red-50 text-red-900 border-red-200', 
    badge: 'bg-red-100 text-red-800 border-red-300',
    bgColor: 'bg-red-500'
  },
  High: { 
    color: 'bg-orange-50 text-orange-900 border-orange-200', 
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    bgColor: 'bg-orange-500'
  },
  Medium: { 
    color: 'bg-yellow-50 text-yellow-900 border-yellow-200', 
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    bgColor: 'bg-yellow-500'
  },
  Low: { 
    color: 'bg-blue-50 text-blue-900 border-blue-200', 
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    bgColor: 'bg-blue-500'
  },
  Informational: { 
    color: 'bg-gray-50 text-gray-900 border-gray-200', 
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    bgColor: 'bg-gray-500'
  }
};

const riskConfig = {
  Critical: { color: 'text-red-600', bgColor: 'bg-red-100' },
  High: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  Medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  Low: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  Minimal: { color: 'text-green-600', bgColor: 'bg-green-100' }
};

export default function ChatMessage({ type, content, findings, summary, timestamp }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState<{[key: string]: boolean}>({});

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyContent = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportReport = () => {
    if (!findings || !summary) return;
    
    // Create structured report data
    const reportData = {
      metadata: {
        title: "Smart Contract Security Audit Report",
        generatedAt: timestamp.toISOString(),
        timestamp: timestamp.toLocaleString(),
        contractName: summary.contractName || "Smart Contract"
      },
      summary: {
        totalFindings: summary.totalFindings,
        riskBreakdown: {
          critical: summary.criticalCount,
          high: summary.highCount,
          medium: summary.mediumCount,
          low: summary.lowCount,
          informational: summary.informationalCount
        },
        overallRisk: summary.overallRisk,
        riskScore: summary.riskScore
      },
      findings: findings.map((finding, index) => ({
        id: index + 1,
        vulnerabilityName: finding.vulnerabilityName,
        severity: finding.severity,
        impact: finding.impact,
        vulnerableCode: finding.vulnerableCode,
        explanation: finding.explanation,
        proofOfConcept: finding.proofOfConcept,
        remediation: finding.remediation,
        references: finding.references,
        cveId: finding.cveId,
        swcId: finding.swcId
      })),
      additionalObservations: summary.additionalObservations || [],
      conclusion: summary.conclusion || "",
      rawContent: content
    };
    
    // Create both JSON and text versions
    const jsonReport = JSON.stringify(reportData, null, 2);
    const textReport = `
SMART CONTRACT SECURITY AUDIT REPORT
Generated: ${timestamp.toLocaleString()}
Contract: ${summary.contractName || "Smart Contract"}

EXECUTIVE SUMMARY
=================
Total Findings: ${summary.totalFindings}
Overall Risk: ${summary.overallRisk}
Risk Score: ${summary.riskScore}

Risk Breakdown:
- Critical: ${summary.criticalCount}
- High: ${summary.highCount}
- Medium: ${summary.mediumCount}
- Low: ${summary.lowCount}
- Informational: ${summary.informationalCount}

DETAILED FINDINGS
=================
${findings.map((finding, index) => `
${index + 1}. ${finding.vulnerabilityName}
Severity: ${finding.severity}
Impact: ${finding.impact}

Vulnerable Code:
${finding.vulnerableCode}

Explanation:
${finding.explanation}

Proof of Concept:
${finding.proofOfConcept}

Remediation:
${finding.remediation}

${finding.references ? `References: ${finding.references}` : ''}
${finding.cveId ? `CVE ID: ${finding.cveId}` : ''}
${finding.swcId ? `SWC ID: ${finding.swcId}` : ''}
`).join('\n---\n')}

${summary.additionalObservations && summary.additionalObservations.length > 0 ? `
ADDITIONAL OBSERVATIONS
======================
${summary.additionalObservations.join('\n')}
` : ''}

${summary.conclusion ? `
CONCLUSION
==========
${summary.conclusion}
` : ''}

END OF REPORT
    `.trim();
    
    // Create dropdown menu for export options
    const exportMenu = document.createElement('div');
    exportMenu.className = 'absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-48';
    exportMenu.innerHTML = `
      <button class="export-json w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100">
        Export as JSON
      </button>
      <button class="export-text w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">
        Export as Text
      </button>
    `;
    
    // Position and show menu
    const exportButton = document.activeElement as HTMLElement;
    const rect = exportButton.getBoundingClientRect();
    exportMenu.style.position = 'fixed';
    exportMenu.style.top = `${rect.bottom + 5}px`;
    exportMenu.style.right = `${window.innerWidth - rect.right}px`;
    
    document.body.appendChild(exportMenu);
    
    // Handle JSON export
    exportMenu.querySelector('.export-json')?.addEventListener('click', () => {
      const blob = new Blob([jsonReport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(exportMenu);
    });
    
    // Handle text export
    exportMenu.querySelector('.export-text')?.addEventListener('click', () => {
      const blob = new Blob([textReport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(exportMenu);
    });
    
    // Remove menu when clicking outside
    const removeMenu = (e: MouseEvent) => {
      if (!exportMenu.contains(e.target as Node)) {
        document.body.removeChild(exportMenu);
        document.removeEventListener('click', removeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  };

  const exportReportSimple = () => {
    if (!findings || !summary) return;
    
    const report = `
SMART CONTRACT SECURITY AUDIT REPORT
Generated: ${timestamp.toLocaleString()}

${content}

END OF REPORT
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCodeBlock = async (code: string, blockId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCodeBlocks(prev => ({ ...prev, [blockId]: true }));
    setTimeout(() => {
      setCopiedCodeBlocks(prev => ({ ...prev, [blockId]: false }));
    }, 2000);
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeContent = String(children).replace(/\n$/, '');
      
      // Don't render single words or short phrases as code blocks
      // Only render as code block if it's multiline or contains typical code patterns
      const isActualCode = !inline && (
        codeContent.includes('\n') || 
        codeContent.includes(';') || 
        codeContent.includes('(') || 
        codeContent.includes('{') || 
        codeContent.includes('=') ||
        codeContent.length > 50
      );
      
      return !inline && isActualCode ? (
        <div className="relative group my-4">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            className="rounded-lg text-sm"
            showLineNumbers={true}
            wrapLines={true}
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
          <button
            onClick={() => copyCodeBlock(codeContent, `${node?.position?.start?.line || Math.random()}`)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs flex items-center space-x-1"
            title="Copy code"
          >
            {copiedCodeBlocks[`${node?.position?.start?.line || Math.random()}`] ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ) : (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-gray-900 mt-5 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-base font-semibold text-gray-800 mt-3 mb-2">
        {children}
      </h4>
    ),
    p: ({ children }: any) => {
      // Check if children contains any React elements (not just text)
      const hasReactElements = React.Children.toArray(children).some((child: any) => {
        return React.isValidElement(child);
      });
      
      // If it contains React elements, render as div to avoid nesting issues
      if (hasReactElements) {
        return (
          <div className="leading-relaxed text-gray-700 mb-3">
            {children}
          </div>
        );
      }
      
      // Otherwise render as normal paragraph
      return (
        <p className="leading-relaxed text-gray-700 mb-3">
          {children}
        </p>
      );
    },
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-1 my-3 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-3 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-200 pl-4 my-4 bg-blue-50 py-2 rounded-r">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 rounded-lg">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-left font-semibold text-gray-900">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 border-b border-gray-200 text-gray-700">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="my-6 border-gray-300" />
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-800">
        {children}
      </em>
    )
  };

  return (
    <div className={`flex space-x-4 ${type === 'user' ? 'flex-row-reverse space-x-reverse' : ''} animate-slide-up`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl ${
        type === 'user' 
          ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
          : 'bg-gradient-to-br from-slate-700 to-gray-800 border border-gray-600/30'
      }`}>
        {type === 'user' ? (
          <User className="h-5 w-5 text-white drop-shadow-sm" />
        ) : (
          <Shield className="h-5 w-5 text-white drop-shadow-sm" />
        )}
      </div>
      
      <div className={`flex-1 space-y-4 ${type === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-5xl ${type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`rounded-2xl px-6 py-4 shadow-xl ${
            type === 'user' 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
              : 'bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200/50 shadow-2xl'
          }`}>
            {type === 'user' ? (
              <div className="whitespace-pre-wrap font-medium leading-relaxed">{content}</div>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    {summary && (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                        summary.overallRisk === 'Critical' ? 'bg-red-100 text-red-800' :
                        summary.overallRisk === 'High' ? 'bg-orange-100 text-orange-800' :
                        summary.overallRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        summary.overallRisk === 'Low' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {summary.totalFindings} Finding{summary.totalFindings !== 1 ? 's' : ''} • {summary.overallRisk} Risk
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyContent}
                      className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
                      title="Copy report"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    {summary && (
                      <button
                        onClick={exportReport}
                        className="relative p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
                        title="Export report"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-base max-w-none">
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          
          <div className={`text-sm text-gray-500 mt-3 font-medium ${type === 'user' ? 'text-right' : 'text-left'}`}>
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}