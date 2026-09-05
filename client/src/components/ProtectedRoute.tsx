import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  /** Birden fazla rolün erişebildiği sayfalar için (ör. çekim listesi) */
  requiredRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, requiredRoles, redirectTo }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo ?? '/admin/login'} replace />;
  }

  // Rol tutmuyorsa ana sayfaya (login sayfasına değil — redirect loop olmasın)
  const allowed = requiredRoles ?? (requiredRole ? [requiredRole] : null);
  if (allowed && !allowed.includes(user?.role ?? '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
