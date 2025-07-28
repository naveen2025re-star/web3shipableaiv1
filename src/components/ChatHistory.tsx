import React from 'react';
import { Shield } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center max-w-md">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to SmartAudit AI</h3>
            <p className="text-gray-600">
              Upload your smart contract code to receive a comprehensive security audit. Our AI analyzes for vulnerabilities, 
              provides detailed findings with severity ratings, and offers expert remediation guidance.
            </p>
            
            <button
              onClick={onStartNewAudit}
              className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              <Shield className="h-5 w-5 mr-2" />
              Start Your First Audit
            </button>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="font-medium text-green-800 mb-1">✓ Comprehensive Analysis</div>
                <div className="text-green-700">CVE detection, vulnerability patterns, business logic flaws</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800 mb-1">✓ Expert Remediation</div>
                <div className="text-blue-700">Actionable fixes, best practices, security recommendations</div>
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