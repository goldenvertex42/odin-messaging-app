import { createContext, useContext, useState, useEffect } from 'react';
import { customFetch } from '../utils/api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Light/Dark Mode tracking is completely distinct from the workspace theme accent colors
  const [colorScheme, setColorScheme] = useState(() => {
    return localStorage.getItem('workspace-color-scheme') || 'light';
  });

  // 2. Safely cascade DOM changes only for the background scheme layers
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    localStorage.setItem('workspace-color-scheme', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await customFetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData); // Keep flat user properties (like themePreference: 'EMERALD') intact
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
      await customFetch('/api/auth/logout', {
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
      setColorScheme('light'); // Revert canvas back to light mode, leaving accents alone
    }
  };

  // 3. Toggle light/dark surfaces independently without modifying user.themePreference
  const toggleColorScheme = () => {
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 4. Modifies the workspace design palette accent (SLATE, EMERALD, OCEAN, etc.)
  const updateUserTheme = (newAccentTheme) => {
    setUser(prev => prev ? { ...prev, themePreference: newAccentTheme } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      theme: colorScheme,          /* Renamed value mapping mapping to protect existing subcomponent bindings */
      toggleTheme: toggleColorScheme, 
      updateUserTheme 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
