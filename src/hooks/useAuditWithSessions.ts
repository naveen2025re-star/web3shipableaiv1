import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatSessions } from './useChatSessions';

interface AuditResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function useAuditWithSessions() {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { createChatSession, addMessage } = useChatSessions();

  const performAudit = async (
    code: string,
    description: string = '',
    repoDetails?: { owner: string; repo: string },
    projectId?: string
  ): Promise<AuditResult> => {
    if (!session?.access_token) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to perform audits.'
      };
    }

    setIsLoading(true);

    try {
      // Create a new chat session
      const chatSession = await createChatSession(
        repoDetails 
          ? `GitHub Repository Scan: ${repoDetails.owner}/${repoDetails.repo}`
          : 'Smart Contract Audit',
        projectId
      );

      if (!chatSession) {
        throw new Error('Failed to create chat session');
      }

      // Add user message
      const userMessage = repoDetails
        ? `**GitHub Repository Scan:**\n\`${repoDetails.owner}/${repoDetails.repo}\`${description ? `\n\n${description}` : ''}`
        : description || 'Please analyze this smart contract code for security vulnerabilities.';

      await addMessage(chatSession.id, userMessage, 'user');

      // Call the audit-contract edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          code,
          description,
          repoDetails,
          chatSessionId: chatSession.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Audit failed: ${errorText}`);
      }

      const result = await response.json();

      // Add assistant response
      if (result.analysis) {
        await addMessage(chatSession.id, result.analysis, 'assistant');
      }

      setIsLoading(false);
      return {
        success: true,
        data: {
          ...result,
          chatSessionId: chatSession.id
        }
      };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return {
    performAudit,
    isLoading
  };
}