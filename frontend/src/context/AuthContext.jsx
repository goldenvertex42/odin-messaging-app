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
            setUser(userData);
            localStorage.setItem('user_session', JSON.stringify(userData));
          } else {
            // Token is invalid, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user_session');
          }
        } catch (err) {
          console.error('Token validation failed:', err);
          // Clear local storage on error
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
        }
      }
      setLoading(false);
    };
    validateSession();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_session', JSON.stringify(userData));
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
      localStorage.removeItem('user_session');
      setUser(null);
    }
  };

  const updateUserTheme = (newTheme) => {
    setUser(prev => prev ? { ...prev, themePreference: newTheme } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
