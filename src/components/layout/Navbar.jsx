import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Bell,
  LogOut,
  CircleAlert,
  CheckCheck,
  Check,
  Package,
} from 'lucide-react';
import { getStoredUser } from '@/src/lib/auth';
import { lowStockNotificationService } from '@/src/services/lowStockNotification.service';

function getInitials(name, username) {
  const source = String(name || username || '').trim();
  if (!source) return 'U';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

const NOTIFICATION_REFRESH_EVENT = 'low-stock-notifications:refresh';
const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export default function Navbar({ darkMode, setDarkMode, onLogout }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [markingIds, setMarkingIds] = useState([]);
  const notificationRef = useRef(null);
  const user = getStoredUser();
  const fullName = user?.fullName || user?.username || 'User';
  const role = user?.role || 'Logged In User';
  const initials = getInitials(user?.fullName, user?.username);
  const normalizedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        icon: Package,
        tone: notification.unread ? 'brand' : 'slate',
      })),
    [notifications],
  );
  const derivedUnreadCount = useMemo(
    () => normalizedNotifications.filter((notification) => notification.unread).length,
    [normalizedNotifications],
  );
  const displayUnreadCount = Math.max(unreadCount, derivedUnreadCount);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const loadNotificationCount = async () => {
    try {
      const response = await lowStockNotificationService.count();
      setUnreadCount(Number(response?.data || 0));
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');

    try {
      const response = await lowStockNotificationService.list();
      setNotifications(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setNotificationsError(requestError.message || 'Failed to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationCount();
    loadNotifications();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadNotificationCount();
      loadNotifications();
    }, NOTIFICATION_POLL_INTERVAL_MS);

    const handleNotificationRefresh = () => {
      loadNotificationCount();
      loadNotifications();
    };

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, handleNotificationRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, handleNotificationRefresh);
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    loadNotificationCount();
    loadNotifications();
  }, [isNotificationsOpen]);

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId || markingIds.includes(notificationId)) return;

    setMarkingIds((current) => [...current, notificationId]);

    try {
      const response = await lowStockNotificationService.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, unread: false } : notification,
        ),
      );
      const nextCount = Number(response?.data?.count);
      if (Number.isFinite(nextCount)) {
        setUnreadCount(nextCount);
      } else {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (requestError) {
      setNotificationsError(requestError.message || 'Failed to mark notification as read.');
    } finally {
      setMarkingIds((current) => current.filter((id) => id !== notificationId));
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = normalizedNotifications.filter((notification) => notification.unread);
    if (!unreadNotifications.length) return;

    setMarkingIds((current) => [
      ...current,
      ...unreadNotifications.map((notification) => notification.id).filter((id) => !current.includes(id)),
    ]);

    try {
      await Promise.all(unreadNotifications.map((notification) => lowStockNotificationService.markAsRead(notification.id)));
      setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
      setUnreadCount(0);
    } catch (requestError) {
      setNotificationsError(requestError.message || 'Failed to mark all notifications as read.');
    } finally {
      setMarkingIds([]);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40 sticky top-0">
      <div className="flex items-center flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search dashboard, users, settings..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-[border-color,box-shadow,background-color] duration-200 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
       
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              loadNotificationCount();
              setIsNotificationsOpen((current) => !current);
            }}
            className={`relative rounded-xl border p-2 transition-all ${
              isNotificationsOpen
                ? 'border-brand/20 bg-brand-light text-brand shadow-sm'
                : 'border-transparent text-gray-500 hover:bg-gray-50'
            }`}
            title="Notifications"
            aria-label="Open notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-5 h-5" />
            {displayUnreadCount ? (
              <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black leading-none text-white shadow-lg shadow-rose-200">
                {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationsOpen ? (
            <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Notifications</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">Low Stock Alerts</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review items that need stock attention.
                    </p>
                  </div>
                  <div className="inline-flex min-w-12 items-center justify-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {displayUnreadCount}
                  </div>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto bg-white p-3">
                <div className="space-y-2.5">
                  {notificationsLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-7 text-center text-sm font-medium text-slate-500">
                      Loading notifications...
                    </div>
                  ) : notificationsError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
                      {notificationsError}
                    </div>
                  ) : !normalizedNotifications.length ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-7 text-center">
                      <p className="text-sm font-semibold text-slate-900">No notifications</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Low stock alerts will appear here when items fall below reorder level.</p>
                    </div>
                  ) : normalizedNotifications.map((notification) => {
                    const Icon = notification.icon;
                    const toneClasses =
                      notification.tone === 'brand'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : notification.tone === 'emerald'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600';

                    return (
                      <div
                        key={notification.id}
                        className={`rounded-xl border px-3.5 py-3.5 text-left transition-colors ${
                          notification.unread
                            ? 'border-slate-300 bg-white'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneClasses}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                  {notification.unread ? (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{notification.description}</p>
                              </div>
                              <span className="shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                {notification.time}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {notification.unread ? 'Needs attention' : 'Reviewed'}
                              </div>
                              <button
                                type="button"
                                onClick={() => markNotificationAsRead(notification.id)}
                                disabled={!notification.unread || markingIds.includes(notification.id)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                                  notification.unread
                                    ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'border border-slate-200 bg-slate-100 text-slate-400'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                {markingIds.includes(notification.id) ? 'Marking...' : 'Mark Read'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {displayUnreadCount ? `${displayUnreadCount} unread remaining` : 'All notifications reviewed'}
                  </div>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={!displayUnreadCount || markingIds.length > 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark All Read
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <button
          onClick={onLogout}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">{fullName}</p>
            <p className="text-xs text-gray-500 mt-1">{role}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm group-hover:shadow-md transition-all">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
