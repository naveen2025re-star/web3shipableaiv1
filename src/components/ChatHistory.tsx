import React from 'react';
import { Shield, Zap, FileText, AlertTriangle, CheckCircle, TrendingUp, Code2, Sparkles, Play, ArrowRight, Star, Users, Clock, Award } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 thin-scrollbar bg-gradient-to-br from-slate-50/80 via-blue-50/30 to-purple-50/20">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center max-w-5xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative mb-12 animate-scale-in">
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl p-8 w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 hover:rotate-3">
                <Shield className="h-12 w-12 text-white drop-shadow-lg" />
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl blur opacity-30 animate-pulse"></div>
              </div>
              <div className="absolute top-0 right-1/2 transform translate-x-12 -translate-y-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 animate-bounce shadow-xl">
                <Sparkles className="h-5 w-5 text-yellow-900" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 animate-slide-up leading-tight">
              Welcome to <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">SmartAudit AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed animate-slide-up max-w-4xl mx-auto font-medium">
              Get <span className="text-blue-600 font-bold">enterprise-grade</span> security audits in seconds. 
              Our advanced AI detects vulnerabilities, provides detailed findings, and offers expert remediation guidance.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12 animate-slide-up">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">10K+ Developers</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">
                <Award className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">SOC2 Compliant</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 animate-slide-up">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">99.9%</div>
                <div className="text-sm text-gray-600 font-semibold">Accuracy Rate</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">&lt;15s</div>
                <div className="text-sm text-gray-600 font-semibold">Audit Time</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">2.5M+</div>
                <div className="text-sm text-gray-600 font-semibold">Vulnerabilities Found</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">50K+</div>
                <div className="text-sm text-gray-600 font-semibold">Contracts Audited</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onStartNewAudit}
              className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-500 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 mb-12 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Start Your First Audit</span>
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="ml-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-bold shadow-inner border border-white/20">
                FREE
              </div>
            </button>
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-left animate-slide-up">
              <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm p-8 rounded-3xl border border-green-200/50 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-3 cursor-pointer">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-black text-green-800 mb-4 text-xl group-hover:text-green-900 transition-colors">Comprehensive Analysis</h3>
                <p className="text-green-700 leading-relaxed">
                  Advanced AI detects CVE patterns, reentrancy attacks, overflow vulnerabilities, and complex business logic flaws with precision
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm p-8 rounded-3xl border border-blue-200/50 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-3 cursor-pointer">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Code2 className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-black text-blue-800 mb-4 text-xl group-hover:text-blue-900 transition-colors">Expert Remediation</h3>
                <p className="text-blue-700 leading-relaxed">
                  Get actionable fixes, proof-of-concept exploits, gas optimization tips, and security best practices from industry experts
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/90 backdrop-blur-sm p-8 rounded-3xl border border-purple-200/50 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-3 cursor-pointer">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Zap className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="font-black text-purple-800 mb-4 text-xl group-hover:text-purple-900 transition-colors">Lightning Fast</h3>
                <p className="text-purple-700 leading-relaxed">
                  Complete security audits in under 15 seconds. Perfect for CI/CD integration and rapid development cycles
                </p>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="mt-12 p-8 bg-gradient-to-br from-blue-50/90 to-purple-50/90 backdrop-blur-sm rounded-3xl border border-blue-200/50 shadow-xl animate-slide-up">
              <h4 className="font-black text-blue-900 mb-6 flex items-center text-xl">
                <Shield className="h-6 w-6 mr-3" />
                Quick Tips for Better Audits
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="text-blue-800 space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Include contract descriptions for more targeted analysis
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Upload multiple files for comprehensive project audits
                  </li>
                </ul>
                <ul className="text-blue-800 space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Export detailed reports in JSON or text format
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Use project organization to track audit history
                  </li>
                </ul>
              </div>
              </ul>
            </div>
            
            {/* Supported Languages */}
            <div className="mt-12 pt-8 border-t border-gray-200/50 animate-slide-up">
              <p className="text-gray-600 mb-6 font-bold text-lg">Supported Languages & Blockchains</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Solidity', 'Vyper', 'Rust', 'Cairo', 'Move', 'Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Solana'].map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-semibold hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 cursor-pointer">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={message.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ChatMessage
                  type={message.type}
                  content={message.content}
                  findings={message.findings}
                  timestamp={message.timestamp}
                />
              </div>
            ))}
          </div>
      )}
    </div>
  );
}