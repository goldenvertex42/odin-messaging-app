import { useState } from 'react';
import styles from './NewChatModal.module.css';

export default function NewChatModal({ isOpen, onClose, onCreateConversation }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Adds a username to the group array when pressing Enter or Comma
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = usernameInput.trim().replace(/,/g, '');
      
      if (!value) return;
      if (participants.includes(value)) {
        setError('User has already been added to this thread.');
        return;
      }

      setParticipants((prev) => [...prev, value]);
      setUsernameInput('');
      setError('');
    }
  };

  const removeParticipant = (indexToRemove) => {
    setParticipants((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Capture any lingering text in the input field
    let finalParticipants = [...participants];
    const residual = usernameInput.trim();
    if (residual && !finalParticipants.includes(residual)) {
      finalParticipants.push(residual);
    }

    if (finalParticipants.length === 0) {
      setError('Please add at least one username.');
      return;
    }

    setLoading(true);
    try {
      // Backend routes this to either 1:1 matching or group creation based on length
      await onCreateConversation(finalParticipants);
      
      // Reset layout state on success
      setUsernameInput('');
      setParticipants([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to initiate conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Start a New Chat</h3>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="target-username" className={styles.label}>
              Recipients (Press Enter or Comma to add multiple)
            </label>
            
            {/* Render selected participant tokens */}
            {participants.length > 0 && (
              <div className={styles.tokenContainer}>
                {participants.map((user, idx) => (
                  <span key={user} className={styles.token}>
                    {user}
                    <button 
                      type="button" 
                      className={styles.removeToken} 
                      onClick={() => removeParticipant(idx)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              id="target-username"
              type="text"
              className={styles.input}
              placeholder={participants.length === 0 ? "Enter username..." : "Add more users..."}
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || (participants.length === 0 && !usernameInput.trim())}
            >
              {loading ? 'Creating...' : finalParticipants => participants.length > 1 ? 'Create Group' : 'Start Chat'}
              {participants.length > 0 || usernameInput.trim() ? (participants.length > 0 && usernameInput.trim() || participants.length > 1 ? 'Create Group' : 'Start Chat') : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
