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
      <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col h-full relative shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4 text-sm transition-all duration-200 hover:bg-gray-800/50 px-2 py-1 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Current Project Display */}
        <div className="relative mb-4">
          <div
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl cursor-pointer hover:from-gray-700/80 hover:to-gray-600/80 transition-all duration-200 border border-gray-600/30 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <FolderOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                {currentProject ? (
                  <>
                    <p className="text-sm font-medium text-white truncate">
                      {currentProject.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getLanguageColor(currentProject.contract_language)} shadow-sm`}>
                      {currentProject.contract_language}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No project selected</p>
                )}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Project Dropdown */}
          {showProjectDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600/50 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-xl animate-slide-up">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project);
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-700/30 last:border-b-0 ${
                    currentProject?.id === project.id ? 'bg-gray-700/50 border-l-2 border-blue-400' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLanguageColor(project.contract_language)} shadow-sm`}>
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
                className="w-full text-left p-3 hover:bg-gray-700/50 transition-all duration-200 text-blue-400 border-t border-gray-600/50"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Manage Projects
              </button>
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto p-4 dark-scrollbar bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8 animate-fade-in">
              <div className="p-4 bg-gray-800/30 rounded-xl mb-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No chats yet</p>
                <p className="text-xs mt-1 opacity-75">Start a new audit to begin</p>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-xl transition-all duration-200 ${
                  currentSessionId === session.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-l-2 border-blue-400 shadow-lg'
                    : 'hover:bg-gray-800/50 hover:shadow-md'
                }`}
              >
                <div
                  onClick={() => onSessionSelect(session.id)}
                  className="flex items-center p-3 cursor-pointer rounded-xl"
                >
                  <div className={`p-1.5 rounded-lg mr-3 flex-shrink-0 ${
                    currentSessionId === session.id ? 'bg-blue-500/20' : 'bg-gray-700/50'
                  }`}>
                    <MessageSquare className={`h-4 w-4 ${
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
                        className="w-full bg-transparent border-none outline-none text-white text-sm font-medium"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate mb-0.5">{session.title}</p>
                        <p className="text-xs text-gray-400 opacity-75">{formatDate(session.updated_at)}</p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(session);
                    }}
                    className="p-1.5 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                    title="Rename"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all duration-200 hover:scale-110"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Profile & Settings */}
      <div className="border-t border-gray-700/50 p-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-3 p-2 rounded-xl bg-gray-800/30">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate opacity-75">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800/50 px-3 py-2 rounded-xl transition-all duration-200 text-sm group">
            <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all duration-200 text-sm group"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
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