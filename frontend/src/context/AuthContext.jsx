import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    setLoading(false);
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
