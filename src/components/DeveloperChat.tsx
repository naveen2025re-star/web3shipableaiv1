import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, Shield, Lightbulb, Copy, CheckCircle, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeSnippet?: string;
  language?: string;
}

interface DeveloperChatProps {
  onInsertCode: (code: string) => void;
  currentCode: string;
  onAnalyzeCode: (code: string) => void;
}

export default function DeveloperChat({ onInsertCode, currentCode, onAnalyzeCode }: DeveloperChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI coding assistant. I can help you:\n\n• Write and review smart contract code\n• Identify security vulnerabilities\n• Suggest optimizations\n• Generate code snippets\n\nWhat would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedSnippets, setCopiedSnippets] = useState<{[key: string]: boolean}>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(input, currentCode),
        timestamp: new Date(),
        codeSnippet: extractCodeSnippet(input),
        language: 'solidity'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = (userInput: string, code: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('security') || input.includes('vulnerability') || input.includes('audit')) {
      return 'I can help you identify security vulnerabilities in your smart contract. Here are some common issues to check:\n\n• **Reentrancy attacks** - Use the checks-effects-interactions pattern\n• **Integer overflow/underflow** - Use SafeMath or Solidity 0.8+\n• **Access control** - Implement proper role-based permissions\n• **Gas optimization** - Minimize storage operations\n\nWould you like me to analyze your current code for these issues?';
    }
    
    if (input.includes('erc20') || input.includes('token')) {
      return 'I can help you create an ERC20 token contract. Here\'s a basic implementation:\n\n```solidity\npragma solidity ^0.8.0;\n\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\n\ncontract MyToken is ERC20 {\n    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {\n        _mint(msg.sender, initialSupply);\n    }\n}\n```\n\nThis creates a basic ERC20 token with minting functionality. Would you like me to add more features?';
    }
    
    if (input.includes('optimize') || input.includes('gas')) {
      return 'Here are some gas optimization techniques:\n\n• **Use `uint256` instead of smaller uints** - More gas efficient\n• **Pack structs efficiently** - Group variables by size\n• **Use `calldata` instead of `memory`** - For external function parameters\n• **Cache storage variables** - Read once, use multiple times\n• **Use events for data storage** - Much cheaper than storage\n\nWould you like me to review your code for optimization opportunities?';
    }
    
    return 'I understand you\'re looking for help with smart contract development. I can assist with:\n\n• Code review and security analysis\n• Writing specific functions or contracts\n• Explaining Solidity concepts\n• Gas optimization suggestions\n• Best practices implementation\n\nCould you be more specific about what you\'d like help with?';
  };

  const extractCodeSnippet = (input: string): string | undefined => {
    if (input.toLowerCase().includes('erc20') || input.toLowerCase().includes('token')) {
      return `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}`;
    }
    return undefined;
  };

  const copySnippet = async (code: string, messageId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedSnippets(prev => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setCopiedSnippets(prev => ({ ...prev, [messageId]: false }));
    }, 2000);
  };

  const insertSnippet = (code: string) => {
    onInsertCode(code);
  };

  const quickActions = [
    {
      icon: Shield,
      label: 'Security Review',
      action: () => setInput('Please review my code for security vulnerabilities')
    },
    {
      icon: Code,
      label: 'Generate ERC20',
      action: () => setInput('Create a basic ERC20 token contract')
    },
    {
      icon: Lightbulb,
      label: 'Optimize Gas',
      action: () => setInput('How can I optimize gas usage in my contract?')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Coding Assistant</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Get help with code, security, and optimization</p>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <action.icon className="h-3 w-3 text-gray-600" />
              <span className="text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              {message.type === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 max-w-xs sm:max-w-md ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-lg px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {message.codeSnippet && (
                  <div className="mt-3 bg-gray-900 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs">{message.language}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copySnippet(message.codeSnippet!, message.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Copy code"
                        >
                          {copiedSnippets[message.id] ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => insertSnippet(message.codeSnippet!)}
                          className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 bg-blue-600 rounded"
                          title="Insert into editor"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                    <pre className="text-gray-300 overflow-x-auto">
                      <code>{message.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about code, security, or get help..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}