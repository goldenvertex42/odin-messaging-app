import styles from './ChatHeader.module.css';

export default function ChatHeader({ title, isOnline, isGroup }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        <h4>{title}</h4>
        
        {/* Only render presence dot for 1:1 DM channels */}
        {!isGroup && (
          <span 
            className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}
            aria-label={isOnline ? "User online" : "User offline"}
          />
        )}
      </div>
    </header>
  );
}
