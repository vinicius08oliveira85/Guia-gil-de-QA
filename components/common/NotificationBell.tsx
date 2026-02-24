import React, { useState, useEffect } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '../../utils/notificationService';

interface NotificationBellProps {
  onClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  showButton?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onClick,
  isOpen: externalIsOpen,
  onClose,
  showButton = true,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Usar isOpen externo se fornecido, senão usar estado interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(value);
    } else {
      onClose?.();
    }
  };

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
      case 'bug_created':
        return '🐛';
      case 'test_failed':
        return '❌';
      case 'deadline':
        return '⏰';
      case 'task_assigned':
        return '📋';
      case 'comment_added':
        return '💬';
      case 'task_completed':
        return '✅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {showButton && (
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            onClick?.();
          }}
          className="relative btn btn-ghost btn-sm btn-circle"
          aria-label="Notificações"
          type="button"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-error text-error-content text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <>
          {showButton && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
          <div
            className={`${showButton ? 'absolute right-0 mt-3' : 'relative'} w-80 bg-base-100 border border-base-300 rounded-[var(--rounded-box)] shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col`}
          >
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h3 className="font-semibold text-base-content">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="btn btn-ghost btn-xs rounded-full"
                  type="button"
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
                    className={`p-4 border-b border-base-300 hover:bg-base-200 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
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
                          <span className="font-semibold text-base-content text-sm">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-base-content/70">{notification.message}</p>
                        <p className="text-xs text-base-content/60 mt-1">
                          {new Date(notification.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error hover:bg-error/10"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-base-content/60">Nenhuma notificação</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
