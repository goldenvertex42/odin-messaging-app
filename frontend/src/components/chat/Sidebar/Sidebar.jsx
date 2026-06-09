import { useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import LoadingSpinner from '../../ui/LoadingSpinner/LoadingSpinner';
import NewChatButton from './components/NewChatButton/NewChatButton';
import { useAuth } from '../../../context/AuthContext';
import { getConversationName } from '../../../utils/getConversationName';
import styles from './Sidebar.module.css';

const getPreviewText = (chat, currentUserId) => {
  const messages = chat.messages || [];
  if (messages.length === 0) return 'No messages yet';

  // extract the latest message by sorting based on createdAt timestamps, with a fallback to the first message
  const latestMessage = [...messages].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0] || messages[0];

  if (!latestMessage) return 'No messages yet';

  // Normalize ID checking using your structural profile parameters
  const isMe = latestMessage.sender?.id?.toString() === currentUserId?.toString();
  const senderName = isMe ? 'You' : (latestMessage.sender?.username || 'User');
  
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

function SidebarHeader({ onCreateConversation, onRefresh }) {
  return (
    <div className={styles.titleArea}>
      <h3>Conversations</h3>
      <div className={styles.headerActions}>
        <button onClick={onRefresh} className={styles.btnRefresh} title="Sync Channels">🔄</button>
        <NewChatButton onCreateConversation={onCreateConversation} />
      </div>
    </div>
  );
}

function ConversationList({ conversations, activeChatId, currentUserId, onSelectChat }) {
  const navigate = useNavigate();
  const isActive = useCallback((chatId) => chatId === activeChatId, [activeChatId]);

  return (
    <ul className={styles.list}>
      {conversations.map((chat) => {
        const conversationTitle = getConversationName(chat, currentUserId);
        return (
          <li 
            key={chat.id} 
            className={`${styles.chatItem} ${isActive(chat.id) ? styles.isActive : ''}`} 
            onClick={() => {
              onSelectChat(chat);
              navigate(`/conversations/${chat.id}`);
            }} 
          >
            <div className={styles.chatName}>{conversationTitle}</div>
            <div className={styles.preview}>{getPreviewText(chat, currentUserId)}</div>
          </li>
        );
      })}
    </ul>
  );
}


function SidebarFooter() {
  const { logout } = useAuth();

  return (
    <div className={styles.footer}>
      <div className={styles.profileActions}>
        <Link to="/friends" className={styles.footerLink}>👥 Friends</Link>
        <Link to="/profile" className={styles.footerLink}>👤 Profile</Link>
      </div>
      <Link to="/logout" className={styles.logoutBtn} onClick={logout}>
        Logout
      </Link>
    </div>
  );
}

export default function Sidebar({ conversations = [], activeChatId, currentUserId, onSelectChat, onCreateConversation, onRefresh }) {
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
      <SidebarHeader onCreateConversation={handleCreateConversation} onRefresh={onRefresh} />
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
