import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ConversationsPage from './pages/ConversationsPage/ConversationsPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import FriendsListPage from './pages/FriendsListPage/FriendsListPage';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import './App.css';

export default function App() {
  const { user, loading, login, updateUserTheme, theme } = useAuth();
  const [activeUserTheme, setActiveUserTheme] = useState(user?.themePreference || 'SLATE');
  if (loading) return <LoadingSpinner />;

  return (
    <div className="app-viewport-root" data-theme={activeUserTheme} data-color-scheme={theme}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/conversations" replace /> : <LoginPage onAuthSuccess={login} />} />
        <Route path="/register" element={user ? <Navigate to="/conversations" replace /> : <RegisterPage onAuthSuccess={login} />} />
        
        <Route element={<ProtectedRoute user={user} loading={loading} />}>
          
          <Route path="/conversations">
            <Route path=":activeConversationId" element={<ConversationsPage user={user} />} />
            <Route index element={<ConversationsPage user={user} />} />
          </Route>
          
          <Route path="/profile" element={<ProfilePage currentUser={user} onGlobalThemeChange={updateUserTheme} setOverrideTheme={setActiveUserTheme}/>} />
          
          <Route path="/profile/:username" element={<ProfilePage currentUser={user} onGlobalThemeChange={updateUserTheme} setOverrideTheme={setActiveUserTheme} />} />
          
          <Route path="/friends" element={<FriendsListPage />} />
          
        </Route>

        <Route path="*" element={<Navigate to={user ? "/conversations" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
