import React, { useEffect, useRef } from 'react';
import MessageBubble from '../MessageBubble/MessageBubble';
import styles from './MessageList.module.css';

export default function MessageList({ messages, currentUserId, isGroup }) {
  const bottomRef = useRef(null);

  // Automatically scroll down to reveal new messages on stream updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.listContainer}>
      {messages.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No messages yet. Say hello!</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            isGroup={isGroup}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
