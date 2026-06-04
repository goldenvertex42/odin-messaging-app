import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import LoginForm from '../../components/auth/LoginForm/LoginForm';
import styles from './LoginPage.module.css';

export default function LoginPage({ onAuthSuccess }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (credentials) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid network response layout.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed');
      }

      onAuthSuccess(result.user, result.token);
      navigate('/conversations');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to join your Odin chat rooms</p>
        </div>

        <LoginForm onSubmit={handleLoginSubmit} loading={loading} error={error} />

        <p className={styles.footerText}>
          New to the app?{' '}
          <Link to="/register" className={styles.link}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
