import React, { useState, useEffect } from 'react';
import {
  Home,
  LayoutGrid,
  PlusCircle,
  MessageSquare,
  Menu,
  X,
  Layers,
  Heart,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  HelpCircle,
  ShieldCheck,
  LogOut,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenCreateListing?: () => void;
}

const MENU_VIEWS = new Set([
  'my-listings',
  'saved',
  'services',
  'guides',
  'graduating-sale',
  'settings',
  'profile',
  'help',
  'admin',
]);

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenCreateListing,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen]);

  const handleProtectedAction = (action: () => void) => {
    if (!isAuthenticated) {
      setIsMenuOpen(false);
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    action();
  };

  const navigateAndClose = (view: string, isPrivate = false) => {
    if (isPrivate && !isAuthenticated) {
      setIsMenuOpen(false);
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const menuFeatures = [
    { id: 'my-listings', label: 'My Listings', subtitle: 'Manage your items', icon: Layers, isPrivate: true, badge: '' },
    { id: 'saved', label: 'Saved Items', subtitle: 'Your wishlist', icon: Heart, isPrivate: true, badge: '' },
    { id: 'services', label: 'Services', subtitle: 'Tutoring & skills', icon: Users, isPrivate: false, badge: '' },
    { id: 'graduating-sale', label: 'Graduating Sale', subtitle: 'Senior clearance', icon: GraduationCap, isPrivate: false, badge: 'New' },
    { id: 'guides', label: 'Student Guides', subtitle: 'Safety & rules', icon: BookOpen, isPrivate: false, badge: '' },
    { id: 'help', label: 'Help & Support', subtitle: 'Campus helpdesk', icon: HelpCircle, isPrivate: false, badge: '' },
    { id: 'settings', label: 'Settings', subtitle: 'Profile & password', icon: Settings, isPrivate: true, badge: '' },
  ];

  const isMenuActive = isMenuOpen || MENU_VIEWS.has(currentView);

  return (
    <>
      {/* Full-Feature Slide-Up Drawer for Mobile & Tablet (< lg) */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setIsMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Drag Handle & Title */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">All UniMart Features</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Account Summary Card */}
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => navigateAndClose('settings', true)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart'}
                      alt={user.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-600 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md capitalize">
                        {user.role} · {user.universityShortName || 'BAUST'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900">Join Campus Exchange</p>
                      <p className="text-[11px] text-slate-600 truncate">Unlock listings, saved items & chat</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenAuth) onOpenAuth('login');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Control Center Shortcut */}
              {isAuthenticated && isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateAndClose('admin', true)}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                    currentView === 'admin'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-gradient-to-r from-slate-900 to-emerald-950 text-white hover:opacity-95'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-extrabold">Admin Management Console</p>
                      <p className="text-[10px] text-emerald-200/90">Verify students, moderate listings & audit logs</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
                </button>
              )}

              {/* 2-Column Campus Features Grid (100% Parity with Desktop Sidebar) */}
              <div className="grid grid-cols-2 gap-2.5">
                {menuFeatures.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateAndClose(item.id, item.isPrivate)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200/90 hover:bg-slate-50 active:scale-[0.98]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-emerald-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {item.label}
                          </p>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Log Out Button */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await logout();
                    onNavigate('home');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (5 Ergonomic Touch Slots) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 sm:px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            onNavigate('home');
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'home' && !isMenuOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            onNavigate('browse');
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'browse' && !isMenuOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Browse</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleProtectedAction(() => {
              setIsMenuOpen(false);
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
          onClick={() =>
            handleProtectedAction(() => {
              setIsMenuOpen(false);
              onNavigate('messages');
            })
          }
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'messages' && !isMenuOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>Messages</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
            isMenuActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-expanded={isMenuOpen}
          aria-label="Open all features menu"
        >
          <div className="relative">
            {isMenuOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
            {isAuthenticated && isAdmin && !isMenuOpen && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            )}
          </div>
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
};
