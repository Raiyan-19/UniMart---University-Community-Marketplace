import React, { useEffect } from 'react';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  onRedirectLogin: () => void;
  requiredRole?: 'admin' | 'teacher' | 'student';
  userRole?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  isLoading,
  onRedirectLogin,
  requiredRole,
  userRole,
  children,
}) => {
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onRedirectLogin();
    }
  }, [isLoading, isAuthenticated, onRedirectLogin]);

  // Loading state while checking session
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 text-center animate-in fade-in duration-150">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Verifying Session</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Checking your campus security credentials. Please wait...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 text-center animate-in fade-in duration-150">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 shadow-xs">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Authentication Required</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          This dashboard contains private campus information. Please log in to continue.
        </p>
        <button
          type="button"
          onClick={onRedirectLogin}
          className="mt-4 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Log In to Access
        </button>
      </div>
    );
  }

  // Role check if required
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 text-center animate-in fade-in duration-150">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4 shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Your account does not have permission to view this control panel.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

