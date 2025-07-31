import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatHistory from '../components/ChatHistory';
import CodeInput from '../components/CodeInput';
import { useProjects, Project } from '../hooks/useProjects';
import { useChatSessions } from '../hooks/useChatSessions';
import { useAuditWithSessions } from '../hooks/useAuditWithSessions';
import { MessageSquare } from 'lucide-react';
import { ChatSession } from '../hooks/useChatSessions';

export default function ChatApp() {
  const navigate = useNavigate();
  const {
    projects,
    currentProject,
    setCurrentProject,
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

  // Redirect to dashboard if no project is selected
  useEffect(() => {
    if (!currentProject && projects.length === 0) {
      navigate('/dashboard');
    }
  }, [currentProject, projects.length, navigate]);

  // Auto-select first project if none selected but projects exist
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  };

  const handleStartNewAudit = () => {
    createNewSession();
  };

  const handleAudit = async (code: string, description: string) => {
    if (!currentProject) {
      alert('Please select a project first');
      return;
    }

    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }
    
    await performAudit(
      code,
      description,
      currentProject,
      sessionId,
      messages,
      setMessages,
      setIsLoading,
      saveMessage,
      updateSessionTitle
    );
  };

  // Show loading state while determining project state
  if (!currentProject && projects.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        currentSessionId={currentSessionId}
        sessions={allSessions}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={deleteChatSession}
        onUpdateSessionTitle={updateChatSessionTitle}
        projects={projects}
        currentProject={currentProject}
        onProjectSelect={setCurrentProject}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <ChatHistory 
          messages={messages} 
          onStartNewAudit={handleStartNewAudit}
        />
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
          <CodeInput onSubmit={handleAudit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}