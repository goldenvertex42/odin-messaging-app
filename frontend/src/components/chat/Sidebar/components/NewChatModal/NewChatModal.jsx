import { useState } from 'react';
import { useFriendSearch } from '../../../../../hooks/useFriendSearch/useFriendSearch';
import styles from './NewChatModal.module.css';

export default function NewChatModal({ isOpen, onClose, onCreateConversation }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🎯 Clean Modularization: Extracting hook operations 
  const { suggestions } = useFriendSearch(isOpen, usernameInput, participants);

  if (!isOpen) return null;

  const addParticipantToken = (username) => {
    if (participants.includes(username)) {
      setError('User has already been added to this thread.');
      return;
    }
    setParticipants((prev) => [...prev, username]);
    setUsernameInput('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = usernameInput.trim().replace(/,/g, '');
      if (!value) return;
      addParticipantToken(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      await onCreateConversation(finalParticipants);
      setUsernameInput('');
      setParticipants([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to initiate conversation.');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = participants.length + (usernameInput.trim() ? 1 : 0);
  const buttonLabel = loading ? 'Creating...' : totalCount > 1 ? 'Create Group' : 'Start Chat';

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Start a New Chat</h3>
        
        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.formGroup} style={{ position: 'relative' }}>
            <label htmlFor="target-username" className={styles.label}>
              Recipients (Press Enter or Comma to add multiple)
            </label>
            
            {participants.length > 0 && (
              <div className={styles.tokenContainer}>
                {participants.map((user, idx) => (
                  <span key={user} className={styles.token}>
                    {user}
                    <button type="button" className={styles.removeToken} onClick={() => setParticipants(prev => prev.filter((_, i) => i !== idx))}>&times;</button>
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

            {suggestions.length > 0 && (
              <ul className={styles.suggestionDropdown}>
                {suggestions.map((friend) => (
                  <li key={friend.id} className={styles.suggestionItem} onClick={() => addParticipantToken(friend.username)}>
                    <img src={friend.avatarUrl} alt="" className={styles.suggestionAvatar} />
                    <div className={styles.suggestionMeta}>
                      <span className={styles.suggestionName}>{friend.displayName || friend.username}</span>
                      <span className={styles.suggestionHandle}>@{friend.username}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading || (participants.length === 0 && !usernameInput.trim())}>{buttonLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
