import React from 'react';
import {
  Home,
  LayoutGrid,
  Layers,
  MessageSquare,
  Heart,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unreadMessagesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  unreadMessagesCount = 0,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, isPrivate: false },
    { id: 'browse', label: 'Browse', icon: LayoutGrid, isPrivate: false },
    { id: 'my-listings', label: 'My Listings', icon: Layers, isPrivate: true },
    { id: 'messages', label: 'Messages', icon: MessageSquare, isPrivate: true },
    { id: 'saved', label: 'Saved', icon: Heart, isPrivate: true },
    { id: 'services', label: 'Services', icon: Users, isPrivate: false },
    { id: 'guides', label: 'Guides', icon: BookOpen, isPrivate: false },
    { id: 'graduating-sale', label: 'Graduating Sale', icon: GraduationCap, isPrivate: false },
  ].filter((item) => !item.isPrivate || isAuthenticated);

  const secondaryItems = [
    { id: 'settings', label: 'Settings', icon: Settings, isPrivate: true },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, isPrivate: false },
  ].filter((item) => !item.isPrivate || isAuthenticated);

  return (
    <aside className="w-60 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between p-4 shrink-0 h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-20">
      <div className="space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'messages' && unreadMessagesCount > 0 && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none shadow-2xs"
                    aria-label={`${unreadMessagesCount} unread messages`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Admin Navigation */}
          {isAuthenticated && isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-emerald-700 text-white font-bold shadow-sm'
                  : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${currentView === 'admin' ? 'text-white' : 'text-emerald-700'}`} />
              <span>Admin Management</span>
            </button>
          )}
        </nav>
      </div>

      {/* Campus Pride Card */}
      <div className="pt-6">
        <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 leading-snug">
              A Stronger University Community Together
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Verified campus exchange
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
