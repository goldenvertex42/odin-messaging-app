import { useState } from 'react';
import styles from './LoginForm.module.css';

export default function LoginForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.errorBanner} role="alert">{error}</div>}
      
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
          autoComplete='true' 
        />
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
