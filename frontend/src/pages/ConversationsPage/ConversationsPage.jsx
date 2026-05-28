import React, { useState, useCallback } from 'react';
import Sidebar from '../../components/chat/Sidebar/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow/ChatWindow';
import LoadingSpinner from '../../components/ui/LoadingSpinner/LoadingSpinner';
import { useConversations } from '../../hooks/useConversations/useConversations';
import styles from './ConversationsPage.module.css';

export default function ConversationsPage({ user }) {
  const effectiveCurrentUserId = user?.id;
  const userProfile = user?.profile || {};
  // Pull conversations matrix directly from your custom hook source
  const { conversations, setConversations, loading, error, createConversation } = useConversations();
  const [activeChat, setActiveChat] = useState(null);

  // 🎯 SYNCHRONIZER: Pushes the fresh message snippet into the sidebar state instantly
  const handleLocalSidebarUpdate = useCallback((conversationId, newRawMessage) => {
    setConversations((prevConversations) => {
      const hydratedMessage = {
        ...newRawMessage,
        sender: newRawMessage.sender || {
          id: effectiveCurrentUserId,
          username: 'you', 
          displayName: 'You'
        }
      };
      const updatedList = prevConversations.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            // Prepend new messages so the preview algorithm sees index 0 instantly
            messages: [hydratedMessage, ...(chat.messages || [])]
          };
        }
        return chat;
      });

      // Maintain order sorting so the most recently updated thread jumps to the top
      return [...updatedList].sort((a, b) => {
        const timeA = new Date(a.messages?.[0]?.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.messages?.[0]?.createdAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
    });
  }, [setConversations]);

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <LoadingSpinner />
      </div>
    );
  }
  const activeTheme = userProfile?.themePreference || "SLATE";
  return (
    <div className={styles.workspace} data-theme={activeTheme} data-testid="conversations-page-container">
      <Sidebar 
        conversations={conversations} // Passed down as shared state mapping
        activeChatId={activeChat?.id}
        currentUserId={effectiveCurrentUserId}
        onSelectChat={setActiveChat}
        onCreateConversation={createConversation}
      />
      
      {activeChat ? (
        <ChatWindow 
          activeChat={activeChat}
          currentUserId={effectiveCurrentUserId}
          onNewMessageSent={(msg) => handleLocalSidebarUpdate(activeChat.id, msg)}
        />
      ) : (
        <div className={styles.emptyLanding}>
          <p>Select a conversation thread or launch a new chat channel to begin.</p>
        </div>
      )}
    </div>
  );
}
