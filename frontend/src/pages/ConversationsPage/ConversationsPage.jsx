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

  // 2. Keep your hook data synchronization loop active
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const matchedChat = conversations.find(c => c.id === activeConversationId);
      if (matchedChat) {
        setActiveChat(matchedChat);
      }
    }
  }, [activeConversationId, conversations]);

  const activeWorkspaceTheme = user?.themePreference || 'SLATE';

  // Pushes the fresh message snippet into the sidebar state instantly
  const handleLocalSidebarUpdate = useCallback((conversationId, newRawMessage) => {
  setConversations((prevConversations) => {
    // 1. Build a structurally complete message object to prevent bubble rendering crashes
    const hydratedMessage = {
      ...newRawMessage,
      sender: newRawMessage.sender || { 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName || user.username 
      }
    };

    // 2. Map and append the message while maintaining your component's array expectations
    const updatedList = prevConversations.map((chat) => {
      if (chat.id === conversationId) {
        return {
          ...chat,
          // Prepend for local preview logic, or append depending on your MessageList map direction
          messages: [hydratedMessage, ...(chat.messages || [])]
        };
      }
      return chat;
    });

    // 3. Robust multi-criteria sorting that protects against array direction and missing records
    return [...updatedList].sort((a, b) => {
      // Extract timestamps safely from any position in the arrays
      const timestampsA = [
        new Date(a.updatedAt || 0).getTime(),
        ...((a.messages || []).map(m => new Date(m.createdAt).getTime()))
      ];
      
      const timestampsB = [
        new Date(b.updatedAt || 0).getTime(),
        ...((b.messages || []).map(m => new Date(m.createdAt).getTime()))
      ];

      // Sort by the absolute most recent event recorded for each conversation thread
      return Math.max(...timestampsB) - Math.max(...timestampsA);
    });
  });
}, [user]); // Dependency array fixed to track the active User context


  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <LoadingSpinner />
      </div>
    );
  }

  const liveActiveChat = conversations.find(c => c.id === activeChat?.id) || activeChat;
  const shouldRenderChatWindow = !!liveActiveChat || !!activeConversationId;

  return (
    <div className={styles.workspace} data-theme={activeWorkspaceTheme} data-testid="conversations-page-container">
      <Sidebar 
        conversations={conversations} // Passed down as shared state mapping
        activeChatId={activeChat?.id}
        currentUserId={user?.id}
        onSelectChat={setActiveChat}
        onCreateConversation={createConversation}
        onRefresh={refreshConversations}
      />
      
      {shouldRenderChatWindow ? (
        <ChatWindow 
          activeChat={liveActiveChat}
          currentUserId={user?.id}
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
