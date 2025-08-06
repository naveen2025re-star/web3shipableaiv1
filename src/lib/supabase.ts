import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          contract_language: string;
          target_blockchain: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          contract_language?: string;
          target_blockchain?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          contract_language?: string;
          target_blockchain?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          credits: number;
          created_at: string | null;
          updated_at: string | null;
          github_pat: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string | null;
          updated_at?: string | null;
          github_pat?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string | null;
          updated_at?: string | null;
          github_pat?: string | null;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          created_at: string | null;
          updated_at: string | null;
          is_archived: boolean | null;
          session_metadata: any | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          created_at?: string | null;
          updated_at?: string | null;
          is_archived?: boolean | null;
          session_metadata?: any | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          created_at?: string | null;
          updated_at?: string | null;
          is_archived?: boolean | null;
          session_metadata?: any | null;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_session_id: string;
          user_id: string;
          content: string;
          role: string;
          message_type: string | null;
          metadata: any | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          chat_session_id: string;
          user_id: string;
          content: string;
          role: string;
          message_type?: string | null;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          chat_session_id?: string;
          user_id?: string;
          content?: string;
          role?: string;
          message_type?: string | null;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};