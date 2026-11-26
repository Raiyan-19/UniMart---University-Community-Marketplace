import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Check,
  MessageSquare,
  Heart,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Star,
} from 'lucide-react';
import { Notification, NotificationType } from '../../types';
import { notificationApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: () => void;
  onUpdateUnreadCount?: (count: number) => void;
  onNavigate?: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNotificationRead,
  onUpdateUnreadCount,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const { success, error } = useToast();
  const drawerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll();
      if (res.success && res.data) {
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.isRead).length;
        if (onUpdateUnreadCount) {
          onUpdateUnreadCount(unread);
        }
      }
    } catch (e: any) {
      console.error('Failed to load notifications:', e);
    }
  }, [onUpdateUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Handle outside click & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const bellButton = document.getElementById('notification-bell-button');
      if (bellButton && bellButton.contains(e.target as Node)) {
        // Let the bell button's own click listener handle toggling
        return;
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Use pointerdown/mousedown so it captures touches on mobile and clicks on desktop outside the panel
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;

    // Immediately update UI state (mark as read, extinguish unread indicator)
    if (!target.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onNotificationRead();

      try {
        await notificationApi.markAsRead(id);
      } catch (e: any) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
        error('Failed to mark read', e.message);
      }
    }

    // If notification has a link or view target, execute navigation
    if (target.link && onNavigate) {
      if (target.link.startsWith('/')) {
        const route = target.link.replace(/^\/+/, '');
        onNavigate(route);
        onClose();
      }
    }
  };

  const handleMarkAllRead = async () => {
    const unreadExist = notifications.some((n) => !n.isRead);
    if (!unreadExist) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (onUpdateUnreadCount) onUpdateUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
      success('All Read', 'Marked all notifications as read.');
    } catch (e: any) {
      error('Failed to mark all as read', e.message);
      loadNotifications();
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'messages') return n.type === 'message';
    if (filter === 'listings') return n.type === 'wishlist' || n.type === 'listing_approved';
    if (filter === 'services') return n.type === 'service';
    if (filter === 'system') return n.type === 'system';
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'wishlist':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'service':
        return <Briefcase className="w-4 h-4 text-sky-600" />;
      case 'listing_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'review':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end"
    >
      <div
        ref={drawerRef}
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Stay updated with your activity on UniMart.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('messages')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              filter === 'messages'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setFilter('listings')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              filter === 'listings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setFilter('services')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              filter === 'services'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              filter === 'system'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            System
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No notifications in this category.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  item.isRead
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50/80 shadow-xs'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-bold ${item.isRead ? 'text-slate-800' : 'text-emerald-950'}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                </div>

                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500">
            UniMart Community Notifications · Campus Alerts
          </p>
        </div>
      </div>
    </div>
  );
};
