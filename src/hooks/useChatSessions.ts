import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Finding {
  vulnerabilityName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  impact: string;
  vulnerableCode: string;
  explanation: string;
  proofOfConcept: string;
  remediation: string;
  references?: string;
  cveId?: string;
  swcId?: string;
}

interface AuditSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  informationalCount: number;
  riskScore: number;
  overallRisk: 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal';
  contractName?: string;
  additionalObservations?: string[];
  conclusion?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  findings?: Finding[];
  summary?: AuditSummary;
  timestamp: Date;
}

export function useChatSessions() {
  const { user } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);

  // Load all chat sessions for the current user
  const loadAllChatSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAllSessions(data || []);
    } catch (error) {
      console.error('Error loading all sessions:', error);
    }
  };

  // Load all sessions when user changes
  useEffect(() => {
    if (user) {
      loadAllChatSessions();
    } else {
      setAllSessions([]);
    }
  }, [user]);

  // Create a new chat session
  const createNewSession = async (title: string = 'New Audit Session') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);
      setMessages([]);
      
      // Refresh the sessions list
      await loadAllChatSessions();
      
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  // Load messages for a specific session
  const loadSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        type: msg.role as 'user' | 'assistant',
        content: msg.content,
        findings: msg.metadata?.findings,
        summary: msg.metadata?.summary,
        timestamp: new Date(msg.created_at || ''),
      }));

      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  // Save a message to the current session
  const saveMessage = async (message: Message) => {
    if (!user || !currentSessionId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_session_id: currentSessionId,
          user_id: user.id,
          content: message.content,
          role: message.type,
          message_type: message.findings ? 'audit_report' : 'text',
          metadata: {
            findings: message.findings,
            summary: message.summary,
          },
        });

      if (error) throw error;

      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId)
        .eq('user_id', user.id);

      // Refresh the sessions list to reflect the updated timestamp
      await loadAllChatSessions();

    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Update session title based on first message
  const updateSessionTitle = async (sessionId: string, title: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      // Refresh the sessions list to reflect the updated title
      await loadAllChatSessions();
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  return {
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
  };
}