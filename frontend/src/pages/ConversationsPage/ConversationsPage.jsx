import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '../../components/chat/Sidebar/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow/ChatWindow';
import LoadingSpinner from '../../components/ui/LoadingSpinner/LoadingSpinner';
import { useConversations } from '../../hooks/useConversations/useConversations';
import styles from './ConversationsPage.module.css';

export default function ConversationsPage({ user }) {
  const { conversations, setConversations, loading, error, createConversation, refreshConversations } = useConversations();
  const [activeChat, setActiveChat] = useState(null);
  const params = useParams();
  const activeConversationId = params?.activeConversationId;

  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const matchedChat = conversations.find(c => c.id === activeConversationId);
      if (matchedChat) {
        setActiveChat(matchedChat);
      }
    }
  }, [activeConversationId, conversations]);

  const activeWorkspaceTheme = user?.themePreference || 'SLATE';

  const handleLocalSidebarUpdate = useCallback((conversationId, newRawMessage) => {
    setConversations((prevConversations) => {
      const hydratedMessage = { 
        ...newRawMessage, 
        sender: newRawMessage.sender || { id: user.id, username: user.username, displayName: user.displayName || user.username } 
      };
      
      const updatedList = prevConversations.map((chat) => {
        if (chat.id === conversationId) {
          return { ...chat, messages: [hydratedMessage, ...(chat.messages || [])] };
        }
        return chat;
      });

      return [...updatedList].sort((a, b) => {
        const timestampsA = [new Date(a.updatedAt || 0).getTime(), ...((a.messages || []).map(m => new Date(m.createdAt).getTime()))];
        const timestampsB = [new Date(b.updatedAt || 0).getTime(), ...((b.messages || []).map(m => new Date(m.createdAt).getTime()))];
        return Math.max(...timestampsB) - Math.max(...timestampsA);
      });
    });
  }, [user, setConversations]);

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <LoadingSpinner />
      </div>
    );
  }

  const liveActiveChat = conversations.find(c => c.id === activeChat?.id) || activeChat;
  const isThreadActive = !!activeConversationId;
  const shouldRenderChatWindow = !!liveActiveChat || isThreadActive;

  return (
    <div className={styles.workspace} data-theme={activeWorkspaceTheme} data-testid="conversations-page-container">
      {/* Responsive Structural Container for Sidebar */}
      <div className={`${styles.sidebarPane} ${isThreadActive ? styles.mobileHidden : ''}`}>
        <Sidebar 
          conversations={conversations} 
          activeChatId={liveActiveChat?.id} 
          currentUserId={user?.id} 
          onSelectChat={setActiveChat} 
          onCreateConversation={createConversation} 
          onRefresh={refreshConversations} 
        />
      </div>

      {/* Responsive Structural Container for Chat Window */}
      <div className={`${styles.chatPane} ${!isThreadActive ? styles.mobileHidden : ''}`}>
        {shouldRenderChatWindow ? (
          <ChatWindow 
            activeChat={liveActiveChat} 
            currentUserId={user?.id} 
            onNewMessageSent={(msg) => handleLocalSidebarUpdate(liveActiveChat?.id || activeConversationId, msg)} 
          />
        ) : (
          <div className={styles.emptyLanding}>
            <p>Select a conversation thread or launch a new chat channel to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
