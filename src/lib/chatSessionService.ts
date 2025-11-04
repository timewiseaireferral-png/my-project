import { supabase } from './supabase';

export interface ChatMessage {
  type: 'user' | 'assistant';
  content: any;
  timestamp: number;
  orderIndex: number;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  userId: string;
  textType: string;
  prompt: string;
  userText: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

export class ChatSessionService {
  private static currentSessionId: string | null = null;

  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async createSession(
    userId: string,
    textType: string,
    prompt: string,
    userText: string = ''
  ): Promise<string | null> {
    try {
      const sessionId = this.generateSessionId();

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          text_type: textType,
          prompt: prompt,
          user_text: userText,
          metadata: {
            startedAt: new Date().toISOString()
          }
        })
        .select('session_id')
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      this.currentSessionId = sessionId;
      console.log('✅ Chat session created:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  static async updateSession(
    sessionId: string,
    updates: {
      userText?: string;
      textType?: string;
      prompt?: string;
      metadata?: any;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          ...updates,
          user_text: updates.userText,
          text_type: updates.textType,
          last_accessed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSession:', error);
      return false;
    }
  }

  static async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  }

  static async getLatestSession(userId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting latest session:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error in getLatestSession:', error);
      return null;
    }
  }

  static async saveMessage(
    sessionId: string,
    userId: string,
    messageType: 'user' | 'assistant',
    content: any,
    orderIndex: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: (await this.getSessionUUID(sessionId)),
          user_id: userId,
          message_type: messageType,
          content: content,
          order_index: orderIndex
        });

      if (error) {
        console.error('Error saving message:', error);
        return false;
      }

      await supabase
        .from('chat_sessions')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('session_id', sessionId);

      return true;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return false;
    }
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const sessionUUID = await this.getSessionUUID(sessionId);
      if (!sessionUUID) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionUUID)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error getting messages:', error);
        return [];
      }

      return (data || []).map((msg: any) => ({
        type: msg.message_type,
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        orderIndex: msg.order_index
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  private static async getSessionUUID(sessionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        console.error('Error getting session UUID:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in getSessionUUID:', error);
      return null;
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  static async cleanupOldSessions(userId: string, daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId)
        .lt('last_accessed_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up sessions:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in cleanupOldSessions:', error);
      return 0;
    }
  }

  static getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  static setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }
}
