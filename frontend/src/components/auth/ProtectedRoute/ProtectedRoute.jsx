import { Navigate } from 'react-router';
import LoadingSpinner from '../../ui/LoadingSpinner/LoadingSpinner';

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
