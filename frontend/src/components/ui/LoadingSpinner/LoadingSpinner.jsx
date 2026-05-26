import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <div data-testid="loading-spinner" className={styles.container}>
      <div className={styles.spinner}></div>
    </div>
  );
}