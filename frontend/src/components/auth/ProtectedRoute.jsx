import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster...</p>
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
          <p className="text-gray-600">Du har ikke rettigheter til denne siden.</p>
        </div>
      </div>
    );
  }

  // Check if user is approved (not pending or rejected)
  if (user?.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold text-secondary mb-4">Bruker til godkjenning</h2>
          <p className="text-gray-600 mb-4">
            Din bruker venter på godkjenning. Du kan bruke bokklubben sin nettside etter du har blitt godkjent av en admin. 
          </p>
          <p className="text-sm text-gray-500">Kom tilbake senere!</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
