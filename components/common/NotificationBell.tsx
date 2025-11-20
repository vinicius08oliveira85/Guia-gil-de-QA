import React, { useState, useEffect } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, Notification } from '../../utils/notificationService';

export const NotificationBell: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = getNotifications();
      setNotifications(allNotifications.slice(0, 10)); // Mostrar apenas as 10 mais recentes
      setUnreadCount(getUnreadCount());
    };

    loadNotifications();

    const handleNotificationCreated = () => {
      loadNotifications();
    };

    window.addEventListener('notification-created', handleNotificationCreated);
    return () => window.removeEventListener('notification-created', handleNotificationCreated);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    setNotifications(getNotifications().slice(0, 10));
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotifications(getNotifications().slice(0, 10));
    setUnreadCount(0);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setNotifications(getNotifications().slice(0, 10));
    setUnreadCount(getUnreadCount());
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'bug_created': return '🐛';
      case 'test_failed': return '❌';
      case 'deadline': return '⏰';
      case 'task_assigned': return '📋';
      case 'comment_added': return '💬';
      case 'task_completed': return '✅';
      default: return '🔔';
    }
  };

  return (
      <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onClick?.();
        }}
          className="relative win-icon-button"
        aria-label="Notificações"
        >
          <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-danger/90 text-white text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center shadow-[0_6px_18px_rgba(255,92,112,0.45)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
          <>
            <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
            <div className="absolute right-0 mt-3 w-80 mica border border-white/10 rounded-2xl shadow-[0_35px_80px_rgba(3,7,23,0.55)] z-50 max-h-96 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                    className="text-sm text-accent hover:text-accent-light transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-surface-border hover:bg-surface-hover transition-colors cursor-pointer ${
                      !notification.read ? 'bg-accent/10' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getNotificationIcon(notification.type)}</span>
                          <span className="font-semibold text-text-primary text-sm">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-accent rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{notification.message}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {new Date(notification.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="text-text-secondary hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-text-secondary">
                  Nenhuma notificação
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

