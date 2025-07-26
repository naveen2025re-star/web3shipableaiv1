import React from 'react';
import { Shield, Code } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">SmartAudit AI</h1>
          <p className="text-sm text-gray-500">Smart Contract Security Auditor</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Code className="h-4 w-4" />
        <span>Powered by Shipable AI</span>
      </div>
    </header>
  );
}