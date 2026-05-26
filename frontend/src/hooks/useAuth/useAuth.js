import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper utility to safely extract the token from storage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken();

      // If no token exists locally, bypass the network check entirely
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Pass the stateless bearer token securely across port boundaries
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is expired or compromised, clear out state and storage
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Stateless token verification lookup failure:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Expose auxiliary state setters so components can manipulate user sessions
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, setUser, loading, login, logout, getToken };
}
