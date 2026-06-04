import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData); // getMe returns flat user object
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUserTheme = (newTheme) => {
    setUser(prev => prev ? { ...prev, themePreference: newTheme } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserTheme }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
