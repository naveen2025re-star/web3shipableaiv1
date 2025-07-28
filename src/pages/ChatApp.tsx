import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatHistory from '../components/ChatHistory';
import CodeInput from '../components/CodeInput';
import { useChatSessions } from '../hooks/useChatSessions';
import { useAuditWithSessions } from '../hooks/useAuditWithSessions';

export default function ChatApp() {
  const {
    currentSessionId,
    messages,
    isLoading,
    setMessages,
    setIsLoading,
    createNewSession,
    loadSession,
    saveMessage,
    updateSessionTitle,
  } = useChatSessions();

  const { performAudit } = useAuditWithSessions();

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSessionSelect = (sessionId: string) => {
    loadSession(sessionId);
  };

  const handleStartNewAudit = () => {
    createNewSession();
  };

  const handleAudit = async (code: string, description: string, fileName?: string, fileCount?: number) => {
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }
    
    await performAudit(
      code,
      description,
      sessionId,
      messages,
      setMessages,
      setIsLoading,
      saveMessage,
      updateSessionTitle,
      fileName,
      fileCount
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
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