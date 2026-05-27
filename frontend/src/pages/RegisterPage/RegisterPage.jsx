import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import RegisterForm from '../../components/auth/RegisterForm/RegisterForm';
import styles from './RegisterPage.module.css'

export default function RegisterPage({ onAuthSuccess }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleRegisterSubmit = async (registrationData) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response format.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed.');
      }

      // Automatically log user in upon successful profile generation
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
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Sign up to join your Odin chat rooms</p>
        </div>

        {/* Modular Register form injected here */}
        <RegisterForm onSubmit={handleRegisterSubmit} loading={loading} error={error} />

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
