import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Shield, AlertTriangle, AlertCircle, Info, CheckCircle, Copy, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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
    icon: AlertCircle,
    bgColor: 'bg-red-500'
  },
  High: { 
    color: 'bg-orange-50 text-orange-900 border-orange-200', 
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: AlertTriangle,
    bgColor: 'bg-orange-500'
  },
  Medium: { 
    color: 'bg-yellow-50 text-yellow-900 border-yellow-200', 
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-500'
  },
  Low: { 
    color: 'bg-blue-50 text-blue-900 border-blue-200', 
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Info,
    bgColor: 'bg-blue-500'
  },
  Informational: { 
    color: 'bg-gray-50 text-gray-900 border-gray-200', 
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: CheckCircle,
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

// Helper function to detect programming language from code
function detectLanguage(code: string): string {
  if (!code) return 'text';
  
  const lowerCode = code.toLowerCase();
  
  // Solidity detection
  if (lowerCode.includes('pragma solidity') || 
      lowerCode.includes('contract ') || 
      lowerCode.includes('transferproxy') ||
      lowerCode.includes('tokenwhale') ||
      lowerCode.includes('sixeyetoken') ||
      lowerCode.includes('function ') && (lowerCode.includes('public') || lowerCode.includes('external') || lowerCode.includes('internal')) ||
      lowerCode.includes('mapping') ||
      lowerCode.includes('uint256') ||
      lowerCode.includes('uint') ||
      lowerCode.includes('address') ||
      lowerCode.includes('.transfer') ||
      lowerCode.includes('msg.sender') ||
      lowerCode.includes('require(') ||
      lowerCode.includes('modifier ') ||
      lowerCode.includes('event ') ||
      lowerCode.includes('struct ') ||
      lowerCode.includes('enum ') ||
      lowerCode.includes('library ') ||
      lowerCode.includes('interface ')) {
    return 'solidity';
  }
  
  // Rust detection
  if (lowerCode.includes('fn ') || 
      lowerCode.includes('impl ') ||
      lowerCode.includes('struct ') ||
      lowerCode.includes('pub fn') ||
      lowerCode.includes('use ') ||
      lowerCode.includes('mod ') ||
      lowerCode.includes('trait ')) {
    return 'rust';
  }
  
  // JavaScript/TypeScript detection
  if (lowerCode.includes('function') || 
      lowerCode.includes('const ') ||
      lowerCode.includes('let ') ||
      lowerCode.includes('var ') ||
      lowerCode.includes('=>') ||
      lowerCode.includes('async ') ||
      lowerCode.includes('await ')) {
    return 'javascript';
  }
  
  // Vyper detection
  if (lowerCode.includes('@external') || 
      lowerCode.includes('@internal') ||
      lowerCode.includes('def ') ||
      lowerCode.includes('@public')) {
    return 'python'; // Vyper is Python-like
  }
  
  return 'text';
}

export default function ChatMessage({ type, content, findings, summary, timestamp }: ChatMessageProps) {
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
  const [copiedFinding, setCopiedFinding] = useState<number | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleFinding = (index: number) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  const copyFinding = async (finding: Finding, index: number) => {
    const text = `
**${finding.vulnerabilityName}**
Severity: ${finding.severity}
${finding.cveId ? `CVE ID: ${finding.cveId}` : ''}
${finding.swcId ? `SWC ID: ${finding.swcId}` : ''}

Impact: ${finding.impact}

Explanation: ${finding.explanation}

Remediation: ${finding.remediation}

${finding.references ? `References: ${finding.references}` : ''}
    `.trim();
    
    await navigator.clipboard.writeText(text);
    setCopiedFinding(index);
    setTimeout(() => setCopiedFinding(null), 2000);
  };

  const exportReport = () => {
    if (!findings || !summary) return;
    
    const report = `
SMART CONTRACT SECURITY AUDIT REPORT
Generated: ${timestamp.toLocaleString()}

EXECUTIVE SUMMARY
Overall Risk Level: ${summary.overallRisk}
Total Findings: ${summary.totalFindings}
Risk Score: ${summary.riskScore}

FINDINGS BREAKDOWN
- Critical: ${summary.criticalCount}
- High: ${summary.highCount}
- Medium: ${summary.mediumCount}
- Low: ${summary.lowCount}
- Informational: ${summary.informationalCount}

DETAILED FINDINGS
${findings.map((finding, index) => `
${index + 1}. ${finding.vulnerabilityName}
   Severity: ${finding.severity}
   ${finding.cveId ? `CVE ID: ${finding.cveId}` : ''}
   ${finding.swcId ? `SWC ID: ${finding.swcId}` : ''}
   
   Impact: ${finding.impact}
   
   Vulnerable Code:
   ${finding.vulnerableCode}
   
   Explanation: ${finding.explanation}
   
   Proof of Concept: ${finding.proofOfConcept}
   
   Remediation: ${finding.remediation}
   
   ${finding.references ? `References: ${finding.references}` : ''}
`).join('\n')}

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

  // Helper function to format text with proper line breaks and structure
  function renderMarkdown(text: string) {
    if (!text || typeof text !== 'string') return [];
    
    // Split by double newlines to get blocks, then process each block
    const blocks = text.split(/\n\s*\n/);
    const elements: React.ReactNode[] = [];
    
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex].trim();
      if (!block) continue;
      
      const lines = block.split('\n');
      let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
      let inCodeBlock = false;
      let codeContent = '';
      let codeLanguage = '';
      
      const flushList = () => {
        if (currentList) {
          if (currentList.type === 'ul') {
            elements.push(
              <ul key={elements.length} className="list-disc list-inside space-y-1 my-3 ml-4">
                {currentList.items.map((item, idx) => (
                  <li key={idx} className="text-gray-700">{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          } else {
            elements.push(
              <ol key={elements.length} className="list-decimal list-inside space-y-1 my-3 ml-4">
                {currentList.items.map((item, idx) => (
                  <li key={idx} className="text-gray-700">{renderInlineMarkdown(item)}</li>
                ))}
              </ol>
            );
          }
          currentList = null;
        }
      };

      const flushCodeBlock = () => {
        if (inCodeBlock && codeContent) {
          elements.push(
            <SyntaxHighlighter
              key={elements.length}
              language={codeLanguage || 'text'}
              style={vscDarkPlus}
              className="my-4 rounded-lg text-sm"
              showLineNumbers={true}
              wrapLines={true}
            >
              {codeContent}
            </SyntaxHighlighter>
          );
          codeContent = '';
          codeLanguage = '';
          inCodeBlock = false;
        }
      };
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Handle code blocks
        if (trimmedLine.startsWith('```')) {
          if (inCodeBlock) {
            flushCodeBlock();
          } else {
            flushList();
            inCodeBlock = true;
            codeLanguage = trimmedLine.substring(3).trim();
          }
          continue;
        }
        
        if (inCodeBlock) {
          codeContent += (codeContent ? '\n' : '') + line;
          continue;
        }
        
        // Handle headers
        if (/^#{1,6}\s+/.test(trimmedLine)) {
          flushList();
          const level = trimmedLine.match(/^(#{1,6})/)?.[1].length || 1;
          const headerText = trimmedLine.replace(/^#{1,6}\s+/, '');
          const className = level === 1 ? 'text-2xl font-bold text-gray-900 mt-6 mb-4' :
                          level === 2 ? 'text-xl font-bold text-gray-900 mt-5 mb-3' :
                          level === 3 ? 'text-lg font-semibold text-gray-900 mt-4 mb-3' :
                          'text-base font-semibold text-gray-800 mt-3 mb-2';
          elements.push(
            <div key={elements.length} className={className}>
              {renderInlineMarkdown(headerText)}
            </div>
          );
          continue;
        }
        
        // Handle horizontal rules
        if (trimmedLine === '---' || trimmedLine === '***') {
          flushList();
          elements.push(
            <hr key={elements.length} className="my-6 border-gray-300" />
          );
          continue;
        }
        
        // Handle numbered lists
        if (/^\d+\.\s+/.test(trimmedLine)) {
          if (!currentList || currentList.type !== 'ol') {
            flushList();
            currentList = { type: 'ol', items: [] };
          }
          currentList.items.push(trimmedLine.replace(/^\d+\.\s+/, ''));
          continue;
        }
        
        // Handle bullet points
        if (/^[-*+•]\s+/.test(trimmedLine)) {
          if (!currentList || currentList.type !== 'ul') {
            flushList();
            currentList = { type: 'ul', items: [] };
          }
          currentList.items.push(trimmedLine.replace(/^[-*+•]\s+/, ''));
          continue;
        }
        
        // Empty line - flush current list
        if (!trimmedLine) {
          flushList();
          continue;
        }
        
        // Regular paragraph
        flushList();
        elements.push(
          <p key={elements.length} className="leading-relaxed text-gray-700 mb-3">
            {renderInlineMarkdown(trimmedLine)}
          </p>
        );
      }
      
      // Flush any remaining content for this block
      flushList();
      flushCodeBlock();
      
      // Add spacing between blocks
      if (blockIndex < blocks.length - 1) {
        elements.push(<div key={`spacer-${elements.length}`} className="h-4"></div>);
      }
    }
    
    return elements;
  }

  // Helper function to render inline markdown (bold, code, links)
  function renderInlineMarkdown(text: string): React.ReactNode {
    if (!text) return text;
    
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining) {
      // Handle bold text **text**
      const boldMatch = remaining.match(/^(.*?)\*\*([^*]+?)\*\*(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) elements.push(<span key={key++}>{boldMatch[1]}</span>);
        elements.push(<strong key={key++} className="font-semibold text-gray-900">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }
      
      // Handle inline code `code`
      const codeMatch = remaining.match(/^(.*?)`([^`]+?)`(.*)/);
      if (codeMatch) {
        if (codeMatch[1]) elements.push(<span key={key++}>{codeMatch[1]}</span>);
        elements.push(
          <code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
        continue;
      }
      
      // Handle URLs
      const urlMatch = remaining.match(/^(.*?)(https?:\/\/[^\s\)]+)(.*)/);
      if (urlMatch) {
        if (urlMatch[1]) elements.push(<span key={key++}>{urlMatch[1]}</span>);
        elements.push(
          <a key={key++} href={urlMatch[2]} target="_blank" rel="noopener noreferrer" 
             className="text-blue-600 hover:text-blue-800 underline inline-flex items-center">
            {urlMatch[2]}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        );
        remaining = urlMatch[3];
        continue;
      }
      
      // No more matches, add remaining text
      elements.push(<span key={key++}>{remaining}</span>);
      break;
    }
    
    return elements.length === 1 ? elements[0] : elements;
  }

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
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
          
          {/* Audit Summary */}
          {summary && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Audit Summary</h3>
                <button
                  onClick={exportReport}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Report
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{summary.totalFindings}</div>
                  <div className="text-sm text-gray-600">Total Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{summary.riskScore}</div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${riskConfig[summary.overallRisk].color}`}>
                    {summary.overallRisk}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.criticalCount + summary.highCount}</div>
                  <div className="text-sm text-gray-600">High+ Issues</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {summary.criticalCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {summary.criticalCount} Critical
                  </span>
                )}
                {summary.highCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {summary.highCount} High
                  </span>
                )}
                {summary.mediumCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {summary.mediumCount} Medium
                  </span>
                )}
                {summary.lowCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {summary.lowCount} Low
                  </span>
                )}
                {summary.informationalCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {summary.informationalCount} Info
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Detailed Findings */}
          {findings && findings.length > 0 && (
            <div className="mt-4 space-y-3">
              {findings.map((finding, index) => {
                const SeverityIcon = severityConfig[finding.severity].icon;
                const isExpanded = expandedFindings.has(index);
                
                return (
                  <div key={index} className={`border rounded-lg overflow-hidden transition-all duration-200 ${severityConfig[finding.severity].color}`}>
                    {/* Finding Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                      onClick={() => toggleFinding(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-full ${severityConfig[finding.severity].bgColor}`}>
                            <SeverityIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{finding.vulnerabilityName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${severityConfig[finding.severity].badge}`}>
                                {finding.severity}
                              </span>
                              {finding.cveId && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  {finding.cveId}
                                </span>
                              )}
                              {finding.swcId && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  {finding.swcId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFinding(finding, index);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                            title="Copy finding"
                          >
                            {copiedFinding === index ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      
                      {/* Impact Preview */}
                      <div className="mt-2">
                        <p className="text-sm opacity-90 line-clamp-2">{finding.impact}</p>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          {finding.impact && finding.impact.trim() && 
                           finding.impact !== 'Review required' && 
                           finding.impact !== 'Manual review required' && 
                           finding.impact !== 'N/A' &&
                           finding.impact !== 'TBD' &&
                           finding.impact.length > 20 &&
                           finding.impact !== finding.explanation &&
                           !finding.impact.includes('Alice approves Eve to transfer') && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Impact
                              </h4>
                              <div className={`text-sm text-gray-700 p-4 rounded-lg border mb-4 ${
                                finding.severity === 'Critical' ? 'bg-red-50 border-red-200' :
                                finding.severity === 'High' ? 'bg-orange-50 border-orange-200' :
                                finding.severity === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}>
                                {renderMarkdown(finding.impact)}
                              </div>
                            </div>
                          )}
                          
                          {finding.proofOfConcept && finding.proofOfConcept.trim() && 
                           finding.proofOfConcept !== 'Review required' && 
                           finding.proofOfConcept !== 'Manual review required' && 
                           finding.proofOfConcept !== 'N/A' &&
                           finding.proofOfConcept !== 'TBD' &&
                           finding.proofOfConcept.length > 20 &&
                           finding.proofOfConcept !== finding.impact &&
                           finding.proofOfConcept !== finding.explanation &&
                           finding.proofOfConcept !== finding.remediation &&
                           finding.proofOfConcept !== finding.remediation &&
                           !finding.proofOfConcept.includes('Alice approves Eve to transfer') && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Info className="h-4 w-4 mr-1" />
                                Proof of Concept
                              </h4>
                              <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                                {renderMarkdown(finding.proofOfConcept)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {finding.vulnerableCode && finding.vulnerableCode.trim() && finding.vulnerableCode.length > 5 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Vulnerable Code
                            </h4>
                            <SyntaxHighlighter
                              language={detectLanguage(finding.vulnerableCode)}
                              style={vscDarkPlus}
                              className="mb-6 rounded-lg text-sm"
                              showLineNumbers={true}
                              wrapLines={true}
                            >
                              {finding.vulnerableCode}
                            </SyntaxHighlighter>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Info className="h-4 w-4 mr-1" />
                            Technical Analysis
                          </h4>
                          <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                            {renderMarkdown(finding.explanation)}
                          </div>
                        </div>
                        
                        {finding.remediation && finding.remediation.trim() && 
                          finding.remediation !== 'Manual review required' && 
                          finding.remediation !== 'Review required' && 
                          finding.remediation !== 'N/A' &&
                          finding.remediation !== 'TBD' &&
                          finding.remediation.length > 20 &&
                          finding.remediation !== finding.explanation &&
                          finding.remediation !== finding.impact &&
                          finding.remediation !== finding.proofOfConcept &&
                          !finding.explanation.includes(finding.remediation) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Recommended Remediation
                            </h4>
                            <div className="text-sm text-gray-700 bg-green-50 p-5 rounded-lg border border-green-200 mb-6">
                              {renderMarkdown(finding.remediation)}
                            </div>
                          </div>
                        )}
                        
                        {finding.references && finding.references.trim() && 
                          finding.references !== 'Review required' && 
                          finding.references !== 'Manual review required' && 
                          finding.references !== 'N/A' &&
                          finding.references !== 'TBD' &&
                          finding.references.length > 15 &&
                          finding.references !== finding.explanation &&
                          finding.references !== finding.impact &&
                          finding.references !== finding.proofOfConcept &&
                          finding.references !== finding.remediation &&
                          !finding.explanation.includes(finding.references) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              References
                            </h4>
                            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                              {renderMarkdown(finding.references)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className={`text-xs text-gray-500 mt-2 ${type === 'user' ? 'text-right' : 'text-left'}`}>
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}