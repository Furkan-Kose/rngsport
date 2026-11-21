import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';
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
    // redirectTo verilen sayfalar müşteri sitesinde (profil, galerim): site teması.
    // Diğerleri admin paneli: panelin gri/amber teması.
    return redirectTo ? (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    ) : (
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
