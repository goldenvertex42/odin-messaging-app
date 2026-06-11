import { Link } from 'react-router';
import { useAuth } from '../../../../../context/AuthContext';
import styles from './ChatHeader.module.css';

export default function ChatHeader({ title, isOnline, isGroup, profileUsername }) {
  const { theme, toggleTheme } = useAuth();
  const isProfileLinkable = !isGroup && profileUsername;

  return (
    <header className={styles.header}>
      {/* Grouping container keeps back arrow and text structural elements docked together */}
      <div className={styles.leftGroup}>
        <Link to="/conversations" className={styles.backButton} aria-label="Return to conversations list">
          ⬅️
        </Link>
        
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
      </div>

      <button 
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className={styles.toggleIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
        <span className={styles.toggleLabel}>
          {theme === 'light' ? 'Too Bright?' : 'Too Dark?'}
        </span>
      </button>
    </header>
  );
}

