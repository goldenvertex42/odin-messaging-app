import React from 'react';
import styles from './MessageBubble.module.css';

export default function MessageBubble({ message, currentUserId, isGroup }) {
  // Safe validation fallback check for message context mapping
  if (!message) return null;

  const isMe = message.senderId === currentUserId || message.sender?.id === currentUserId;
  const senderName = message.sender?.displayName || 'unknown_user';

  return (
    <div className={`${styles.bubbleContainer} ${isMe ? styles.alignRight : styles.alignLeft}`}>
      {/* Conditionally mount sender metadata blocks solely during group chat threads */}
      {isGroup && !isMe && (
        <span className={styles.senderLabel}>
          {senderName}
        </span>
      )}

      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
        <p className={styles.text}>{message.content}</p>
        
        {message.fileUrl && (
          <div className={styles.mediaAttachment}>
            <img src={message.fileUrl} alt="Shared asset payload" className={styles.previewImage} />
          </div>
        )}
        
        <span className={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
