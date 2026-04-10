import { api } from "../lib/api";

export interface Conversation {
  id: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: string;
  sender_name: string;
  recipient: string;
  recipient_name: string;
  content: string;
  is_read: boolean;
  timestamp: string;
}

export const messagingService = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get("/core/conversations/");
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  getConversation: async (
    id: string,
  ): Promise<Conversation & { messages: Message[] }> => {
    try {
      const response = await api.get(`/core/conversations/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },

  getMessages: async (conversationId?: string): Promise<Message[]> => {
    try {
      const url = conversationId
        ? `/core/messages/?conversation=${conversationId}`
        : "/core/messages/";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  sendMessage: async (
    recipientId: string,
    content: string,
    conversationId?: string,
  ): Promise<Message> => {
    try {
      const payload: any = {
        recipient: recipientId,
        content: content,
      };
      if (conversationId) {
        payload.conversation = conversationId;
      }
      const response = await api.post("/core/messages/", payload);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  markAsRead: async (messageId: string): Promise<void> => {
    try {
      await api.post(`/core/messages/${messageId}/mark_read/`);
    } catch (error) {
      console.error(`Error marking message ${messageId} as read:`, error);
      throw error;
    }
  },
};
