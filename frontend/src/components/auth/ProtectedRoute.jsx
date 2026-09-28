import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>Laster...</p>
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-terracotta)" }}>
            Access Denied
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Du har ikke rettigheter til denne siden.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is approved (not pending or rejected)
  if (user?.status !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold text-secondary mb-4">
            Bruker til godkjenning
          </h2>
          <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>
            Din bruker venter på godkjenning. Du kan bruke bokklubben sin
            nettside etter du har blitt godkjent av en admin.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>Kom tilbake senere!</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
