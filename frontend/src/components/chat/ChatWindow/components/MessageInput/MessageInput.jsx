import { useState } from 'react';
import styles from './MessageInput.module.css';

export default function MessageInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    
    onSendMessage(input);
    setInput(''); // Clear input instantly upon parent execution callback trigger
  };

  return (
    <form className={styles.inputArea} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={styles.input}
        disabled={disabled}
        aria-label="Message text input"
      />
      <button 
        type="submit" 
        disabled={disabled || !input.trim()} 
        className={styles.sendBtn}
      >
        {disabled ? '...' : 'Send'}
      </button>
    </form>
  );
}
