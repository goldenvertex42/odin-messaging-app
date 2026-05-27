import styles from './ChatHeader.module.css';

export default function ChatHeader({ title }) {
  return (
    <header className={styles.header}>
      <h4>{title || 'Chat Channel'}</h4>
    </header>
  );
}
