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
      <div className="w-64 bg-gray-900 text-white flex flex-col h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Current Project Display */}
        <div className="relative mb-4">
          <div
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <FolderOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                {currentProject ? (
                  <>
                    <p className="text-sm font-medium text-white truncate">
                      {currentProject.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getLanguageColor(currentProject.contract_language)}`}>
                      {currentProject.contract_language}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No project selected</p>
                )}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Project Dropdown */}
          {showProjectDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project);
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                    currentProject?.id === project.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(project.contract_language)}`}>
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
                className="w-full text-left p-3 hover:bg-gray-700 transition-colors text-blue-400 border-t border-gray-600"
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
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto p-4 dark-scrollbar">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new audit to begin</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-700 border-l-4 border-blue-400'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div
                  onClick={() => onSessionSelect(session.id)}
                  className="flex items-center p-3 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingSession === session.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => updateSessionTitle(session.id, editTitle)}
                        onKeyDown={(e) => handleKeyPress(e, session.id)}
                        className="w-full bg-transparent border-none outline-none text-white text-sm"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(session.updated_at)}</p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(session);
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="Rename"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
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
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-600 p-2 rounded-full">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors text-sm">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
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