import React, { useState, useEffect } from 'react';
import { messagingService, Conversation, Message } from '../../services/messagingService';

export const MessagingUI: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Fetch conversations on mount
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      const interval = setInterval(() => {
        loadMessages(selectedConversationId);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messagingService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      // Assuming recipient is the other participant in the conversation
      // For simplicity, we just pass the conversation ID here. In a real app,
      // you might need to extract the specific recipient ID.
      const conversation = conversations.find((c) => c.id === selectedConversationId);
      const recipientId = conversation?.participants.find((p) => p !== 'me'); // Simplified logic

      if (!recipientId) return;

      const sentMsg = await messagingService.sendMessage(recipientId, newMessage, selectedConversationId);
      setMessages([...messages, sentMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 p-4">
      {/* Inbox Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col rounded-l-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No conversations found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedConversationId === conv.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <p className="font-medium text-gray-800">
                    Conversation {conv.id.substring(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Updated: {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Thread View */}
      <div className="flex-1 bg-white flex flex-col rounded-r-lg shadow-sm">
        {selectedConversationId ? (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Thread: {selectedConversationId.substring(0, 8)}...
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'me' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                        msg.sender === 'me'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to view the thread
          </div>
        )}
      </div>
    </div>
  );
};
