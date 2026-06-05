import { useState, useRef } from 'react';
import styles from './MessageInput.module.css';

export default function MessageInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Block trigger if text is blank AND no image binary is queued up
    if ((!input.trim() && !selectedFile) || disabled) return;

    await onSendMessage(input, selectedFile);
    
    setInput(''); // Clear input instantly upon parent execution callback trigger
    handleClearFile(); // Reset staging indicators on success
  };

  return (
    <form className={styles.inputArea} onSubmit={handleSubmit}>
      {previewUrl && (
        <div className={styles.previewBox}>
          <img src={previewUrl} alt="Staged image" className={styles.previewImage} />
          <button type="button" onClick={handleClearFile} className={styles.btnClearPreview} aria-label="Remove image attachment">✕</button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={styles.hiddenInput}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`${styles.btnAttach} ${selectedFile ? styles.hasFile : ''}`}
        disabled={disabled}
        title="Attach Image"
      >
        📷
      </button>

      <input 
        type="text" 
        placeholder={selectedFile ? "Add a caption..." : "Type a message..."} 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        className={styles.input} 
        disabled={disabled} 
        aria-label="Message text input" 
      />
      
      <button 
        type="submit" 
        disabled={disabled || (!input.trim() && !selectedFile)} 
        className={styles.sendBtn}
      >
        {disabled ? '...' : 'Send'}
      </button>
    </form>
  );
}
