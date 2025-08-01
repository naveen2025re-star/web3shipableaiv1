import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  Settings, 
  User, 
  ChevronDown, 
  Plus, 
  MessageSquare, 
  FileText, 
  Code, 
  Activity,
  Clock,
  Heart,
  Share,
  Edit,
  Eye,
  EyeOff,
  Bell,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Maximize2,
  MoreHorizontal,
  Tag,
  Users,
  Globe,
  Lock,
  Bookmark,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useProjects, Project } from '../hooks/useProjects';
import { useChatSessions } from '../hooks/useChatSessions';
import { useAuditWithSessions } from '../hooks/useAuditWithSessions';
import { ChatSession } from '../hooks/useChatSessions';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  findings?: any[];
  summary?: any;
  timestamp: Date;
}

export default function ChatApp() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('findings');
  const [isPublic, setIsPublic] = useState(true);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, analyzing, completed
  const [currentScan, setCurrentScan] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);

  const {
    projects,
    currentProject,
    setCurrentProject,
    projectsLoading: loading,
    user,
  } = useProjects();

  const {
    currentSessionId,
    messages,
    isLoading,
    allSessions,
    setMessages,
    setIsLoading,
    createNewSession,
    loadSession,
    saveMessage,
    updateSessionTitle,
    deleteChatSession,
    updateChatSessionTitle,
  } = useChatSessions(currentProject);

  const { performAudit } = useAuditWithSessions();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const pendingFileAnalysis = localStorage.getItem('pendingFileAnalysis');
    if (pendingFileAnalysis && currentProject) {
      try {
        const analysisData = JSON.parse(pendingFileAnalysis);
        if (analysisData.projectId === currentProject.id) {
          localStorage.removeItem('pendingFileAnalysis');
          setTimeout(() => {
            handleAudit(analysisData.content, `Analyzing selected files from: ${analysisData.repoDetails.owner}/${analysisData.repoDetails.repo}`);
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing pending file analysis:', error);
        localStorage.removeItem('pendingFileAnalysis');
      }
    }

    if (projects.length === 0) {
      navigate('/dashboard');
      return;
    }
    
    if (!currentProject) {
      const saved = localStorage.getItem('currentProjectId');
      if (saved) {
        try {
          const existingProject = projects.find(p => p.id === saved);
          if (existingProject) {
            setCurrentProject(existingProject);
            return;
          } else {
            localStorage.removeItem('currentProjectId');
            setCurrentProject(projects[0]);
            return;
          }
        } catch (error) {
          console.error('Error parsing saved project:', error);
          localStorage.removeItem('currentProjectId');
          if (projects.length > 0) {
            setCurrentProject(projects[0]);
          }
          return;
        }
      } else {
        if (projects.length > 0) {
          setCurrentProject(projects[0]);
        }
        return;
      }
    }
  }, [projects, currentProject, setCurrentProject, navigate, loading, user]);

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  };

  const handleAudit = async (code: string, description: string, repoDetails?: { owner: string; repo: string }) => {
    if (!currentProject) {
      console.error('No current project available for audit');
      alert('Please select a project first');
      return;
    }

    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    // Start analysis animation
    setIsAnalyzing(true);
    setScanStatus('analyzing');
    setAnalysisProgress(0);
    setShowNotificationModal(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      await performAudit(
        code,
        description,
        repoDetails,
        currentProject,
        sessionId,
        messages,
        setMessages,
        setIsLoading,
        saveMessage,
        updateSessionTitle
      );

      // Complete progress
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setScanStatus('completed');
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowNotificationModal(false);
        setScanStatus('idle');
      }, 2000);

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setScanStatus('idle');
      setShowNotificationModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim()) {
      handleAudit(codeInput.trim(), '');
      setCodeInput('');
    }
  };

  // Mock data for demonstration
  const mockFindings = [
    {
      id: 1,
      title: "Admin cannot unregister a proposer if it removes their executor's registration",
      severity: "HIGH",
      description: "The unregisterProposer function includes a check that the admin's executor is still a registered executor after unregistering a proposer. If the admin's executor is only associated with the proposer being unregistered, this check fails, preventing the admin from unregistering that proposer.",
      recommendation: "Remove the _proposers.checkRegisteredExecutor(msg.sender) check in the unregisterProposer function. The admin should retain the ability to unregister any proposer regardless of their executor status."
    }
  ];

  const mockCommunityScans = [
    {
      id: 1,
      title: "TokenVault Security Incident",
      severity: "High",
      type: "Attack",
      category: "Logic",
      likes: 12,
      timestamp: "2025-06-25 14:40:10"
    },
    {
      id: 2,
      title: "Pufferverse Security Scan",
      severity: "High",
      type: "Binance Alpha",
      category: "Replay Attack",
      likes: 11,
      timestamp: "2025-06-22 10:18:21"
    }
  ];

  if (loading || (projects.length > 0 && !currentProject)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {loading ? 'Loading your projects...' : 'Setting up your workspace...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-teal-500 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-400">SmartAudit AI</span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-600 px-2 py-1 rounded text-xs text-gray-300">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-3 text-teal-400 bg-gray-700 rounded-lg px-3 py-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Sessions</span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              <Shield className="h-4 w-4" />
              <span>Scans</span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </div>

            <div className="ml-6 space-y-1">
              <div className="text-gray-400 hover:text-white px-3 py-1 cursor-pointer text-sm">
                Public Scans
              </div>
              <div className="text-gray-400 hover:text-white px-3 py-1 cursor-pointer text-sm">
                My Scans
              </div>
            </div>

            <div className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              <FileText className="h-4 w-4" />
              <span>Blog</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              <FileText className="h-4 w-4" />
              <span>Documentation</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              <Users className="h-4 w-4" />
              <span>Community</span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </div>
          </div>

          {/* Session History */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Today</div>
            <div className="space-y-1">
              {allSessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm truncate">{session.title}</span>
                  <MoreHorizontal className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button className="w-full flex items-center space-x-3 text-teal-400 hover:text-teal-300 px-3 py-2 rounded-lg transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </button>
          
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
            <Zap className="h-4 w-4 inline mr-2" />
            Upgrade to Pro
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.email}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">Session</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
                <span className="text-white font-medium">Code analysis with SmartAudit AI</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Activity className="h-4 w-4" />
                <span>Scan Status</span>
                <span className="text-white">0/0</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <TrendingUp className="h-4 w-4" />
                <span>Current Credit:</span>
                <span className="text-white">576</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Code Input Area */}
            <div className="p-6 bg-gray-800 border-b border-gray-700">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      isPublic 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{isPublic ? 'Public' : 'Private'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Enter code, contract address, or GitHub repository. Or upload a file."
                    className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-400 min-h-[120px]"
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>AI may not always be accurate, please be cautious and verify</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Upload Code</span>
                      </button>
                      
                      <button
                        type="submit"
                        disabled={!codeInput.trim() || isAnalyzing}
                        className="flex items-center space-x-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            <span>Start Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Analysis Status */}
              {scanStatus === 'analyzing' && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-teal-400" />
                    <span className="text-white font-medium">The provided code is validated successfully</span>
                    <span className="text-sm text-gray-400 ml-auto">Code Validation</span>
                  </div>
                  
                  <div className="text-gray-300 mb-4">
                    Your scan has been initiated! You can view the results shortly at:
                  </div>
                  
                  <div className="text-teal-400 hover:text-teal-300 cursor-pointer mb-4">
                    https://smartaudit.ai/scan/a9359d23-1478-4173-ad48-0770d669720b
                  </div>
                  
                  <div className="text-gray-400">
                    Let me know if you need anything else.
                  </div>
                </div>
              )}

              {/* Recent Scan Card */}
              {messages.length > 0 && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">2025-08-01 17:24:01</span>
                      <CheckCircle className="h-4 w-4 text-teal-400" />
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                    <Heart className="h-4 w-4 text-gray-400 hover:text-red-400 cursor-pointer transition-colors" />
                  </div>
                  
                  <h3 className="text-white font-medium mb-2">DualGovernance.sol Security Scan</h3>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">High</span>
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">Medium</span>
                    <span className="text-sm text-gray-400 ml-auto">
                      {scanStatus === 'analyzing' ? 'Queued' : 'Completed'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Ready to Analyze</h3>
                    <p className="text-gray-400">Enter your smart contract code above to begin security analysis</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Analysis Results */}
                  {scanStatus === 'completed' && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      {/* Header */}
                      <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">DualGovernance.sol Security Scan</h2>
                            <button className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
                              <Plus className="h-4 w-4" />
                              <span>Add tag</span>
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                              <Edit className="h-4 w-4" />
                              <span>Rename</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                              <Eye className="h-4 w-4" />
                              <span>Partially Disclosed</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                              <Share className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                              <Download className="h-4 w-4" />
                              <span>Export</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>Created By:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">N</span>
                              </div>
                              <span className="text-white">{user?.email}</span>
                            </div>
                          </div>
                          <div>
                            <span>Credit Usage: 287</span>
                          </div>
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex items-center border-b border-gray-700">
                        <button
                          onClick={() => setSelectedTab('findings')}
                          className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                            selectedTab === 'findings'
                              ? 'border-teal-400 text-teal-400'
                              : 'border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>Findings</span>
                        </button>
                        <button
                          onClick={() => setSelectedTab('summary')}
                          className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                            selectedTab === 'summary'
                              ? 'border-teal-400 text-teal-400'
                              : 'border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Code Summary</span>
                        </button>
                        <button
                          onClick={() => setSelectedTab('diagram')}
                          className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                            selectedTab === 'diagram'
                              ? 'border-teal-400 text-teal-400'
                              : 'border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          <span>Protocol Diagram</span>
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="p-6">
                        {selectedTab === 'findings' && (
                          <div className="space-y-6">
                            {mockFindings.map((finding) => (
                              <div key={finding.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="text-lg font-medium text-white">{finding.title}</h3>
                                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-medium">
                                        {finding.severity}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                                    <p className="text-gray-400 leading-relaxed">{finding.description}</p>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendation</h4>
                                    <p className="text-gray-400 leading-relaxed">{finding.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedTab === 'summary' && (
                          <div className="text-center py-12">
                            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Code Summary</h3>
                            <p className="text-gray-400">Detailed code analysis and summary will appear here</p>
                          </div>
                        )}

                        {selectedTab === 'diagram' && (
                          <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Protocol Diagram</h3>
                            <p className="text-gray-400">Interactive protocol diagram will be displayed here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          {showRightPanel && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
              {/* Scans in Session */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Scans in This Session</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                {allSessions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">2025-08-01 17:24:01</span>
                        <CheckCircle className="h-4 w-4 text-teal-400" />
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2">DualGovernance.sol Security S...</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">High</span>
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">Medium</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <Heart className="h-4 w-4 text-gray-400 hover:text-red-400 cursor-pointer transition-colors" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Community Scans */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Popular from the Community</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {mockCommunityScans.map((scan) => (
                    <div key={scan.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                      <div className="flex items-center space-x-2 mb-2 text-xs text-gray-400">
                        <span>{scan.timestamp}</span>
                        <CheckCircle className="h-3 w-3 text-teal-400" />
                      </div>
                      
                      <h4 className="text-white font-medium mb-2">{scan.title}</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">{scan.severity}</span>
                          <span className="text-xs text-gray-400">{scan.type}</span>
                          <span className="text-xs text-gray-400">{scan.category}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Heart className="h-4 w-4" />
                          <span className="text-xs">{scan.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Progress Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Analysis in progress ...</h3>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div 
                  className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Bell className="h-4 w-4 text-teal-400" />
                  <span className="text-white font-medium">Would you like to receive an email notification when this scan completes?</span>
                </div>
                
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                    Notify Once
                  </button>
                  <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors">
                    Always Notify
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Continue in background
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}