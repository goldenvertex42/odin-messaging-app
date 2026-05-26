import { useState } from 'react';
import styles from './RegisterForm.module.css';

export default function RegisterForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    // Client-side password validation check before hitting the server
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    // Strip confirmPassword before passing clean registration data up
    const { email, username, displayName, password } = formData;
    onSubmit({ email, username, displayName, password });
  };

  const displayError = error || localError;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {displayError && <div className={styles.errorBanner} role="alert">{displayError}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>Email Address</label>
        <input 
          id="email" 
          type="email" 
          name="email" 
          required 
          disabled={loading}
          value={formData.email} 
          onChange={handleChange} 
          className={styles.input} 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="username" className={styles.label}>Username</label>
        <input 
          id="username" 
          type="text" 
          name="username" 
          required 
          disabled={loading}
          value={formData.username} 
          onChange={handleChange} 
          className={styles.input} 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="displayName" className={styles.label}>Display Name (Optional)</label>
        <input 
          id="displayName" 
          type="text" 
          name="displayName" 
          disabled={loading}
          value={formData.displayName} 
          onChange={handleChange} 
          className={styles.input} 
          placeholder={formData.username}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.label}>Password</label>
        <input 
          id="password" 
          type="password" 
          name="password" 
          required 
          disabled={loading}
          value={formData.password} 
          onChange={handleChange} 
          className={styles.input} 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
        <input 
          id="confirmPassword" 
          type="password" 
          name="confirmPassword" 
          required 
          disabled={loading}
          value={formData.confirmPassword} 
          onChange={handleChange} 
          className={styles.input} 
        />
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
}
