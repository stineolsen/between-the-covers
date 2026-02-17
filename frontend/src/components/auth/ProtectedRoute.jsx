import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check if user is approved (not pending or rejected)
  if (user?.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold text-secondary mb-4">Account Pending</h2>
          <p className="text-gray-600 mb-4">
            Your account is currently pending approval. You'll be able to access the bookclub once an admin approves your account.
          </p>
          <p className="text-sm text-gray-500">Please check back later!</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
