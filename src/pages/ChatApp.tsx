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
    projectsLoading: loading,
    user,
    selectProject
  } = useProjects();

  console.log('ChatApp rendered with currentProject:', currentProject?.name || 'null');
  console.log('Projects available:', projects.length);

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
    // Wait for projects to load
    if (loading) return;
    
    // If no user, redirect will be handled by route protection
    if (!user) return;

    // Check for pending GitHub scan
    const pendingGithubScan = localStorage.getItem('pendingGithubScan');
    if (pendingGithubScan && currentProject) {
      try {
        const scanData = JSON.parse(pendingGithubScan);
        if (scanData.projectId === currentProject.id) {
          // Clear the pending scan
          localStorage.removeItem('pendingGithubScan');
          
          // Trigger GitHub repository scan
          setTimeout(() => {
            handleAudit('', `Scanning GitHub repository: ${scanData.owner}/${scanData.repo}`, {
              owner: scanData.owner,
              repo: scanData.repo
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing pending GitHub scan:', error);
        localStorage.removeItem('pendingGithubScan');
      }
    }
    console.log('ChatApp useEffect - projects:', projects.length, 'currentProject:', currentProject?.name || 'null');
    
    if (projects.length === 0) {
      console.log('No projects exist, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    if (!currentProject) {
      console.log('No current project, checking localStorage...');
      const saved = localStorage.getItem('currentProjectId');
      if (saved) {
        try {
          const savedProjectId = saved;
          console.log('Found saved project ID:', savedProjectId);
          // Verify the saved project still exists
          const existingProject = projects.find(p => p.id === savedProjectId);
          if (existingProject) {
            console.log('Restoring saved project:', existingProject.name);
            setCurrentProject(existingProject);
            return;
          } else {
            console.log('Saved project no longer exists, selecting first available');
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
        console.log('No saved project, selecting first available');
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

  const handleStartNewAudit = () => {
    createNewSession();
  };

  const handleAudit = async (code: string, description: string) => {
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
  };

  // Show loading state while projects are being loaded or project is being determined
  if (loading || (projects.length > 0 && !currentProject)) {
    console.log('Showing loading state - waiting for project selection');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading your projects...' : 'Setting up your workspace...'}
          </p>
        </div>
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