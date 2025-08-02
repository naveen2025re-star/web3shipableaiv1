import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Settings, LogOut, User, Trash2, Edit3, ArrowLeft, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatSession } from '../hooks/useChatSessions';
import { Project } from '../hooks/useProjects';

interface SidebarProps {
  currentSessionId: string | null;
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSessionTitle: (sessionId: string, title: string) => void;
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

export default function Sidebar({ 
  currentSessionId, 
  sessions, 
  onSessionSelect, 
  onNewChat,
  onDeleteSession,
  onUpdateSessionTitle,
  projects,
  currentProject,
  onProjectSelect
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const deleteSession = (sessionId: string) => {
    onDeleteSession(sessionId);
    // If we're deleting the current session, create a new one
    if (currentSessionId === sessionId) {
      onNewChat();
    }
  };

  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    onUpdateSessionTitle(sessionId, newTitle);
    setEditingSession(null);
  };

  const startEditing = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      updateSessionTitle(sessionId, editTitle);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'Solidity': 'bg-blue-100 text-blue-800',
      'Vyper': 'bg-green-100 text-green-800',
      'Rust': 'bg-orange-100 text-orange-800',
      'Cairo': 'bg-purple-100 text-purple-800',
      'Move': 'bg-pink-100 text-pink-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-indigo-100 text-indigo-800',
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <div className="w-72 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col h-full relative shadow-3xl border-r border-gray-700/30">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/30 bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-3 text-gray-300 hover:text-white mb-6 text-sm font-medium transition-all duration-300 hover:bg-slate-800/60 px-3 py-2 rounded-xl group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to Dashboard</span>
        </button>

        {/* Current Project Display */}
        <div className="relative mb-6">
          <div
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-800/90 to-gray-800/90 rounded-2xl cursor-pointer hover:from-slate-700/90 hover:to-gray-700/90 transition-all duration-300 border border-gray-600/40 shadow-xl backdrop-blur-sm hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl shadow-lg">
                <FolderOpen className="h-5 w-5 text-blue-400 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                {currentProject ? (
                  <>
                    <p className="text-sm font-bold text-white truncate">
                      {currentProject.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold mt-2 ${getLanguageColor(currentProject.contract_language)} shadow-lg`}>
                      {currentProject.contract_language}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 font-medium">No project selected</p>
                )}
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Project Dropdown */}
          {showProjectDropdown && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-gradient-to-br from-slate-800/95 to-gray-900/95 border border-gray-600/50 rounded-2xl shadow-3xl z-50 max-h-64 overflow-y-auto backdrop-blur-xl animate-slide-up">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project);
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-700/60 transition-all duration-300 border-b border-gray-700/30 last:border-b-0 group ${
                    currentProject?.id === project.id ? 'bg-slate-700/60 border-l-3 border-blue-400' : ''
                  }`}
                >
                  <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {project.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getLanguageColor(project.contract_language)} shadow-lg`}>
                      {project.contract_language}
                    </span>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setShowProjectDropdown(false);
                }}
                className="w-full text-left p-4 hover:bg-slate-700/60 transition-all duration-300 text-blue-400 border-t border-gray-600/50 font-bold"
              >
                <Plus className="h-5 w-5 inline mr-3" />
                Manage Projects
              </button>
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-5 py-4 rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto p-5 dark-scrollbar bg-gradient-to-b from-transparent via-slate-900/10 to-gray-900/30">
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-12 animate-fade-in">
              <div className="p-6 bg-slate-800/40 rounded-2xl mb-6 border border-gray-700/30">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-bold">No chats yet</p>
                <p className="text-xs mt-2 opacity-75">Start a new audit to begin</p>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-2xl transition-all duration-300 ${
                  currentSessionId === session.id
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-l-3 border-blue-400 shadow-xl'
                    : 'hover:bg-slate-800/60 hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                <div
                  onClick={() => onSessionSelect(session.id)}
                  className="flex items-center p-4 cursor-pointer rounded-2xl"
                >
                  <div className={`p-2 rounded-xl mr-4 flex-shrink-0 shadow-lg ${
                    currentSessionId === session.id ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30' : 'bg-slate-700/60'
                  }`}>
                    <MessageSquare className={`h-5 w-5 ${
                      currentSessionId === session.id ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingSession === session.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => updateSessionTitle(session.id, editTitle)}
                        onKeyDown={(e) => handleKeyPress(e, session.id)}
                        className="w-full bg-transparent border-none outline-none text-white text-sm font-bold"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="text-sm font-bold truncate mb-1">{session.title}</p>
                        <p className="text-xs text-gray-400 opacity-80 font-medium">{formatDate(session.updated_at)}</p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(session);
                    }}
                    className="p-2 hover:bg-slate-700/60 rounded-xl text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 shadow-lg"
                    title="Rename"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-2 hover:bg-red-500/30 rounded-xl text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 shadow-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Profile & Settings */}
      <div className="border-t border-gray-700/30 p-6 bg-gradient-to-br from-slate-800/40 to-gray-900/40 backdrop-blur-sm">
        <div className="flex items-center space-x-4 mb-4 p-3 rounded-2xl bg-slate-800/50 border border-gray-700/30">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-xl">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate opacity-80 font-medium">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-slate-800/60 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group">
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 text-gray-300 hover:text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group"
          >
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      </div>

      {/* Backdrop for dropdown */}
      {showProjectDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProjectDropdown(false)}
        />
      )}
    </>
  );
}