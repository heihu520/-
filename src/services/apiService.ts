import { Session, Message } from '../types';

// Use absolute path for local development to avoid proxy issues.
// Ensure your backend is running on port 3001.
const API_BASE = 'http://localhost:3001/api';

export const api = {
  // Get all sessions
  getSessions: async (): Promise<Session[]> => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Create session
  createSession: async (title: string): Promise<Session | null> => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // Delete session
  deleteSession: async (id: string): Promise<boolean> => {
    try {
      await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Update session title
  updateSessionTitle: async (id: string, title: string): Promise<boolean> => {
     try {
       await fetch(`${API_BASE}/sessions/${id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ title })
       });
       return true;
     } catch(error) {
       return false;
     }
  },

  // Get messages for a session
  getMessages: async (sessionId: string): Promise<Message[]> => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Save a message
  saveMessage: async (sessionId: string, message: Message): Promise<boolean> => {
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: message.id,
          session_id: sessionId,
          role: message.role,
          content: message.content,
          metrics: message.metrics,
          timestamp: message.timestamp
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to save message', error);
      return false;
    }
  }
};