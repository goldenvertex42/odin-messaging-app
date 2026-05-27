import { useState } from 'react';
import NewChatModal from '../NewChatModal/NewChatModal';
import styles from './NewChatButton.module.css';

export default function NewChatButton({ onCreateConversation }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className={styles.triggerBtn} 
        onClick={() => setIsModalOpen(true)}
      >
        + New Chat
      </button>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateConversation={onCreateConversation}
      />
    </>
  );
}
