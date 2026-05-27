import { useState } from 'react';
import Sidebar from '../../components/chat/Sidebar/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow/ChatWindow';
import styles from './ConversationsPage.module.css';

export default function ConversationsPage({ user }) {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  return (
    <main className={styles.workspace} data-testid="conversations-page-container">
      {/* Left Column: Fixed-width threads sidebar navigator */}
      <Sidebar 
        currentUserId={user?.id} 
        onSelectChat={handleSelectChat} 
      />

      {/* Right Column: Fluid full-screen message stream pane layout */}
      <ChatWindow 
        activeChat={selectedChat} 
        currentUserId={user?.id} 
      />
    </main>
  );
}
