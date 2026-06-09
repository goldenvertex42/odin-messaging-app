import { Link } from 'react-router';
import styles from './ChatHeader.module.css';

export default function ChatHeader({ title, isOnline, isGroup, profileUsername }) {
  const isProfileLinkable = !isGroup && profileUsername;

  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        {isProfileLinkable ? (
          <Link to={`/profile/${profileUsername}`} className={styles.profileLink}>
            <h4>{title}</h4>
          </Link>
        ) : (
          <h4>{title}</h4>
        )}

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

