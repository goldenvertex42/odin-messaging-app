import { Navigate, Outlet } from 'react-router';
import LoadingSpinner from '../../ui/LoadingSpinner/LoadingSpinner';

export default function ProtectedRoute({ user, loading }) {
  if (loading) return <LoadingSpinner />;

  // If unauthenticated, redirect cleanly to login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Renders nested route children perfectly while preserving params context!
  return <Outlet />;
}
