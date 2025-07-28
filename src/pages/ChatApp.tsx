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
    createNewSession,
    loadSession,
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
    if (!currentSessionId) {
      const newSessionId = await createNewSession();
      if (!newSessionId) return;
    }
    
    await performAudit(code, description, fileName, fileCount);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatHistory 
          messages={messages} 
          onStartNewAudit={handleStartNewAudit}
        />
        <CodeInput onSubmit={handleAudit} isLoading={isLoading} />
      </div>
    </div>
  );
}