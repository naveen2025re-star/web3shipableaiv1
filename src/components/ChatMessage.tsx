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
  confidence?: number;
  gasImpact?: string;
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
  auditDuration?: number;
  codeComplexity?: 'Low' | 'Medium' | 'High';
}

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  findings?: Finding[];
  summary?: AuditSummary;
  timestamp: Date;
  processingTime?: number;
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

const complexityConfig = {
  Low: { color: 'text-green-600', bgColor: 'bg-green-100' },
  Medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  High: { color: 'text-red-600', bgColor: 'bg-red-100' }
};

export default function ChatMessage({ type, content, findings, summary, timestamp, processingTime }: ChatMessageProps) {
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
    <div className={`flex space-x-3 ${type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        type === 'user' ? 'bg-blue-600' : 'bg-gray-700'
      }`}>
        {type === 'user' ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Shield className="h-4 w-4 text-white" />
        )}
      </div>
      
      <div className={`flex-1 space-y-4 ${type === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-4xl ${type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`rounded-lg px-4 py-3 ${
            type === 'user' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
          }`}>
            {type === 'user' ? (
              <div className="whitespace-pre-wrap">{content}</div>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {summary && (
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          summary.overallRisk === 'Critical' ? 'bg-red-100 text-red-800' :
                          summary.overallRisk === 'High' ? 'bg-orange-100 text-orange-800' :
                          summary.overallRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          summary.overallRisk === 'Low' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {summary.totalFindings} Finding{summary.totalFindings !== 1 ? 's' : ''} • {summary.overallRisk} Risk
                        </span>
                        {summary.codeComplexity && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${complexityConfig[summary.codeComplexity].bgColor} ${complexityConfig[summary.codeComplexity].color}`}>
                            {summary.codeComplexity} Complexity
                          </span>
                        )}
                        {summary.auditDuration && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {(summary.auditDuration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyContent}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
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
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        title="Export report"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
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
                
                <div className={`prose prose-sm max-w-none ${isExpanded ? '' : 'max-h-96 overflow-hidden thin-scrollbar'}`}>
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
                
                {!isExpanded && content.length > 500 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
            )}
          </div>
          
          <div className={`text-xs text-gray-500 mt-2 flex items-center justify-between ${type === 'user' ? 'flex-row-reverse' : ''}`}>
            <span>{formatTime(timestamp)}</span>
            {processingTime && (
              <span className="text-gray-400">
                {type === 'user' ? 'Processed' : 'Generated'} in {(processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}