import React from 'react';
import { Home, LayoutGrid, PlusCircle, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenCreateListing?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenCreateListing,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleProtectedAction = (action: () => void) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    action();
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 sm:px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] flex items-center justify-around shadow-lg">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
          currentView === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('browse')}
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
          currentView === 'browse' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutGrid className="w-5 h-5 mb-0.5" />
        <span>Browse</span>
      </button>

      <button
        type="button"
        onClick={() =>
          handleProtectedAction(() => {
            if (onOpenCreateListing) onOpenCreateListing();
            else onNavigate('my-listings');
          })
        }
        className="flex flex-col items-center justify-center min-w-[48px] py-0.5 px-1 text-[10px] font-semibold text-emerald-700 -mt-3 cursor-pointer"
        aria-label="Post new listing"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/25 hover:bg-emerald-800 transition active:scale-95">
          <PlusCircle className="w-5 h-5" />
        </div>
        <span className="mt-0.5 font-bold">Post</span>
      </button>

      <button
        type="button"
        onClick={() => handleProtectedAction(() => onNavigate('messages'))}
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
          currentView === 'messages' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MessageSquare className="w-5 h-5 mb-0.5" />
        <span>Messages</span>
      </button>

      {isAuthenticated && isAdmin ? (
        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'admin' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Admin</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleProtectedAction(() => onNavigate('settings'))}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'settings' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>
      )}
    </nav>
  );
};
