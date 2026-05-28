import { Routes, Route, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ConversationsPage from './pages/ConversationsPage/ConversationsPage';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';
import { useAuth } from './hooks/useAuth/useAuth';
import './App.css';

export default function App() {
  const { user, loading, login } = useAuth();

  // One line, completely clean, self-contained loading state
  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/conversations" replace /> : <LoginPage onAuthSuccess={login} />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/conversations" replace /> : <RegisterPage onAuthSuccess={login} />} 
      />
      <Route 
        path="/conversations" 
        element={
          <ProtectedRoute user={user} loading={loading}>
            <ConversationsPage user={user} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="*" 
        element={<Navigate to={user ? "/conversations" : "/login"} replace />} 
      />
    </Routes>
  );
}
