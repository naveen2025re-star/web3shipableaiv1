import React, { useState, useEffect } from 'react';
import { Code, Github, MessageSquare, Settings, Play, Save, ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import GitHubIntegration from '../components/GitHubIntegration';
import DeveloperChat from '../components/DeveloperChat';
import { useAuditWithSessions } from '../hooks/useAuditWithSessions';
import { useProjects } from '../hooks/useProjects';
import { useChatSessions } from '../hooks/useChatSessions';

export default function DeveloperMode() {
  const [activeTab, setActiveTab] = useState<'editor' | 'github' | 'chat'>('editor');
  const [code, setCode] = useState(`pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    
    constructor(string memory _message) {
        message = _message;
    }
    
    function setMessage(string memory _message) public {
        message = _message;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}`);
  const [currentFilename, setCurrentFilename] = useState('HelloWorld.sol');
  const [language, setLanguage] = useState('solidity');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sidebarWidth, setSidebarWidth] = useState(400);

  const { projects, currentProject, setCurrentProject } = useProjects();
  const {
    currentSessionId,
    messages,
    setMessages,
    setIsLoading,
    createNewSession,
    saveMessage,
    updateSessionTitle,
  } = useChatSessions(currentProject);
  const { performAudit } = useAuditWithSessions();

  // Auto-select first project if available
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleFileSelect = (content: string, filename: string) => {
    setCode(content);
    setCurrentFilename(filename);
    
    // Detect language from file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'sol':
        setLanguage('solidity');
        break;
      case 'js':
        setLanguage('javascript');
        break;
      case 'ts':
        setLanguage('typescript');
        break;
      case 'py':
        setLanguage('python');
        break;
      case 'rs':
        setLanguage('rust');
        break;
      default:
        setLanguage('text');
    }
  };

  const handleInsertCode = (codeSnippet: string) => {
    setCode(prev => prev + '\n\n' + codeSnippet);
    setActiveTab('editor');
  };

  const handleAnalyzeCode = async () => {
    if (!currentProject || !code.trim()) return;

    setIsAnalyzing(true);
    
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession('Code Analysis Session');
      if (!sessionId) return;
    }

    await performAudit(
      code,
      `Analyzing ${currentFilename}`,
      currentProject,
      sessionId,
      messages,
      setMessages,
      setIsLoading,
      saveMessage,
      updateSessionTitle
    );
    
    setIsAnalyzing(false);
    setActiveTab('chat');
  };

  const handleSave = () => {
    // Save to localStorage as backup
    localStorage.setItem('dev_mode_code', code);
    localStorage.setItem('dev_mode_filename', currentFilename);
    
    // Show success message (you could add a toast notification here)
    console.log('Code saved locally');
  };

  // Load saved code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('dev_mode_code');
    const savedFilename = localStorage.getItem('dev_mode_filename');
    
    if (savedCode) setCode(savedCode);
    if (savedFilename) setCurrentFilename(savedFilename);
  }, []);

  const tabs = [
    { id: 'editor', label: 'Code Editor', icon: Code },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Audit Mode</span>
          </Link>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Developer Mode</h1>
              <p className="text-sm text-gray-500">VS Code Web + AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Layout Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLayout('horizontal')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'horizontal' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Horizontal Layout"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout('vertical')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'vertical' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Vertical Layout"
            >
              <Smartphone className="h-4 w-4 rotate-90" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            
            <button
              onClick={handleAnalyzeCode}
              disabled={isAnalyzing || !code.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} overflow-hidden`}>
        {/* Code Editor */}
        <div className={`${layout === 'vertical' ? 'h-1/2' : 'flex-1'} p-4`}>
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language={language}
            onAnalyze={handleAnalyzeCode}
            onSave={handleSave}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Sidebar */}
        <div 
          className={`${
            layout === 'vertical' ? 'h-1/2' : 'flex-shrink-0'
          } bg-white border-l border-gray-200 flex flex-col`}
          style={{ width: layout === 'horizontal' ? `${sidebarWidth}px` : 'auto' }}
        >
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <div className="p-4 h-full">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Editor settings and file explorer coming soon</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'github' && (
              <GitHubIntegration
                onFileSelect={handleFileSelect}
                currentCode={code}
                currentFilename={currentFilename}
              />
            )}
            
            {activeTab === 'chat' && (
              <DeveloperChat
                onInsertCode={handleInsertCode}
                currentCode={code}
                onAnalyzeCode={handleAnalyzeCode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}