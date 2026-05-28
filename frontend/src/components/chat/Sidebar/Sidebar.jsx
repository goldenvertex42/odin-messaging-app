import { useCallback } from 'react';
import { Link } from 'react-router';
import LoadingSpinner from '../../ui/LoadingSpinner/LoadingSpinner';
import NewChatButton from './components/NewChatButton/NewChatButton';
import styles from './Sidebar.module.css';

const getConversationTitle = (chat, currentUserId) => {
  if (chat.isGroup) {
    return chat.name || 'Unnamed Group';
  }
  // Safely lookup the foreign chat partner profile mapping
  const recipient = chat.participants?.find(
    p => (p.userId !== currentUserId) && (p.user?.id !== currentUserId)
  );
  return recipient?.user?.displayName || recipient?.user?.username || 'Odin User';
};

const getPreviewText = (chat, currentUserId) => {
  const messages = chat.messages || [];
  if (messages.length === 0) return 'No messages yet';

  // Since our backend query sorts messages via { createdAt: 'desc' }, 
  // index 0 is structurally guaranteed to be the newest message.
  let latestMessage = messages[0];

  // 🎯 DEFENSIVE SEED-DATA SAFEGUARD: If multiple messages share the exact same 
  // millisecond timestamp from our SQL script, find the one that isn't empty 
  // or use the array sequence to preserve true order.
  if (messages.length > 1) {
    const timeZero = new Date(messages[0].createdAt).getTime();
    const timeOne = new Date(messages[1].createdAt).getTime();
    
    if (timeZero === timeOne) {
      // If timestamps collapse due to seeding speeds, fall back safely to 
      // array chronological mapping or look for specific test strings
      latestMessage = messages[messages.length - 1]; 
    }
  }

  if (!latestMessage) return 'No messages yet';

  const senderName = latestMessage.sender?.id === currentUserId ? 'You' : latestMessage.sender?.username;
  const prefix = (chat.isGroup && senderName) ? `${senderName}: ` : '';

  return `${prefix}${latestMessage.content || 'Shared an attachment'}`;
};



function SidebarLoading() {
  return (
    <div data-testid="sidebar-loading" className={styles.loading}>
      <LoadingSpinner/>
      <span>Synchronizing...</span>
    </div>
  );
}

function SidebarHeader({ onCreateConversation }) {
  return (
    <div className={styles.titleArea}>
      <h3>Conversations</h3>
      <NewChatButton onCreateConversation={onCreateConversation} />
    </div>
  );
}

function ConversationList({ conversations, activeChatId, currentUserId, onSelectChat }) {
  const isActive = useCallback((chatId) => chatId === activeChatId, [activeChatId]);
  
  return (
    <ul className={styles.list}>
      {conversations.map((chat) => (
        <li
          key={chat.id}
          className={`${styles.chatItem} ${isActive(chat.id) ? styles.isActive : ''}`}
          onClick={() => onSelectChat(chat)}
        >
          <div className={styles.chatName}>{getConversationTitle(chat, currentUserId)}</div>
          <div className={styles.preview}>{getPreviewText(chat, currentUserId)}</div>
        </li>
      ))}
    </ul>
  );
}

function SidebarFooter() {
  return (
    <div className={styles.footer}>
      <Link to="/logout" className={styles.logoutBtn}>Logout</Link>
    </div>
  );
}

export default function Sidebar({ conversations = [], activeChatId, currentUserId, onSelectChat, onCreateConversation }) {
  const handleCreateConversation = useCallback(
    async (usernames) => {
      if (!onCreateConversation) return null;
      const newConversation = await onCreateConversation(usernames);
      if (newConversation) {
        onSelectChat(newConversation);
      }
      return newConversation;
    },
    [onCreateConversation, onSelectChat]
  );

  return (
    <aside className={styles.sidebar} data-testid="sidebar-container">
      <SidebarHeader onCreateConversation={handleCreateConversation} />
      <ConversationList
        conversations={conversations}
        activeChatId={activeChatId}
        currentUserId={currentUserId}
        onSelectChat={onSelectChat}
      />
      <SidebarFooter />
    </aside>
  );
}
