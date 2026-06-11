import { useEffect } from 'react';
import styles from './ImageModal.module.css';

export default function ImageModal({ imageUrl, altText = "Enlarged media preview", onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button Action Trigger */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close image viewer">
          ✕
        </button>
        
        {/* Render Target Image */}
        <img src={imageUrl} alt={altText} className={styles.modalImage} />
      </div>
    </div>
  );
}
