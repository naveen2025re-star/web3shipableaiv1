import React from 'react';
import { Shield, Zap, FileText, AlertTriangle, CheckCircle, TrendingUp, Code2, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  findings?: any[];
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: Message[];
  onStartNewAudit: () => void;
}

export default function ChatHistory({ messages, onStartNewAudit }: ChatHistoryProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 thin-scrollbar">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center max-w-4xl mx-auto px-6">
            {/* Hero Section */}
            <div className="relative mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-pulse">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SmartAudit AI</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Get enterprise-grade security audits in seconds. Our advanced AI detects vulnerabilities, 
              provides detailed findings with severity ratings, and offers expert remediation guidance.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-green-100 rounded-lg p-2 w-fit mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 rounded-lg p-2 w-fit mx-auto mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">&lt;15s</div>
                <div className="text-xs text-gray-600">Audit Time</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-orange-100 rounded-lg p-2 w-fit mx-auto mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">2.5M+</div>
                <div className="text-xs text-gray-600">Vulnerabilities Found</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-purple-100 rounded-lg p-2 w-fit mx-auto mb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-xs text-gray-600">Contracts Audited</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onStartNewAudit}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 mb-8 animate-pulse hover:animate-none"
            >
              <Shield className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
              Start Your First Audit
              <div className="ml-3 bg-white/20 rounded-full px-2 py-1 text-xs font-medium">
                FREE
              </div>
            </button>
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 group">
                <div className="bg-green-100 rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-green-800 mb-2 text-lg">Comprehensive Analysis</h3>
                <p className="text-green-700 text-sm leading-relaxed">
                  Advanced AI detects CVE patterns, reentrancy attacks, overflow vulnerabilities, and complex business logic flaws
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 group">
                <div className="bg-blue-100 rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Code2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-blue-800 mb-2 text-lg">Expert Remediation</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Get actionable fixes, proof-of-concept exploits, gas optimization tips, and security best practices
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <div className="bg-purple-100 rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-purple-800 mb-2 text-lg">Lightning Fast</h3>
                <p className="text-purple-700 text-sm leading-relaxed">
                  Complete security audits in under 15 seconds. Perfect for CI/CD integration and rapid development
                </p>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Quick Tips for Better Audits
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Include contract descriptions for more targeted analysis</li>
                <li>• Upload multiple files for comprehensive project audits</li>
                <li>• Export detailed reports in JSON or text format</li>
                <li>• Use project organization to track audit history</li>
              </ul>
            </div>
            
            {/* Supported Languages */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Supported Languages & Blockchains</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Solidity', 'Vyper', 'Rust', 'Cairo', 'Move', 'Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Solana'].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage
            key={message.id}
            type={message.type}
            content={message.content}
            findings={message.findings}
            timestamp={message.timestamp}
          />
        ))
      )}
    </div>
  );
}