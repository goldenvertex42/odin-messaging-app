import { Routes, Route, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ConversationsPage from './pages/ConversationsPage/ConversationsPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import FriendsListPage from './pages/FriendsListPage/FriendsListPage';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';
import { useAuth } from './hooks/useAuth/useAuth';
import './App.css';

export default function App() {
  const { user, loading, login, updateUserTheme } = useAuth();

  if (loading) return <LoadingSpinner />;

  const currentAppTheme = user?.themePreference || 'SLATE';

  return (
    <div className="app-viewport-root" data-theme={currentAppTheme}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/conversations" replace /> : <LoginPage onAuthSuccess={login} />} />
        <Route path="/register" element={user ? <Navigate to="/conversations" replace /> : <RegisterPage onAuthSuccess={login} />} />
        
        <Route element={<ProtectedRoute user={user} loading={loading} />}>
          
          <Route path="/conversations">
            <Route path=":activeConversationId" element={<ConversationsPage user={user} />} />
            <Route index element={<ConversationsPage user={user} />} />
          </Route>
          
          <Route path="/profile" element={<ProfilePage currentUser={user} onGlobalThemeChange={updateUserTheme} />} />
          
          <Route path="/profile/:username" element={<ProfilePage currentUser={user} onGlobalThemeChange={updateUserTheme} />} />
          
          <Route path="/friends" element={<FriendsListPage />} />
          
        </Route>

        <Route path="*" element={<Navigate to={user ? "/conversations" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
