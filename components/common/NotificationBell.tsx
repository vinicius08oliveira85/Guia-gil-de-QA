import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, restoreNotification, Notification } from '../../utils/notificationService';

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
  showButton = true 
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

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

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

  const handleDelete = (notification: Notification) => {
    deleteNotification(notification.id);
    setNotifications(getNotifications().slice(0, 10));
    setUnreadCount(getUnreadCount());

    toast(
      (t) => (
        <span className="flex items-center gap-3">
          Notificação excluída
          <button
            onClick={() => {
              restoreNotification(notification);
              setNotifications(getNotifications().slice(0, 10));
              setUnreadCount(getUnreadCount());
              toast.dismiss(t.id);
            }}
            className="btn btn-xs btn-ghost underline"
          >
            Desfazer
          </button>
        </span>
      ),
      { duration: 4000 }
    );
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
            {showButton && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
            )}
            <div className={`${showButton ? 'absolute right-0 mt-3' : 'relative'} w-80 bg-base-100 border border-base-300 rounded-[var(--rounded-box)] shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col`}>
              <div className="p-4 border-b border-base-300 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-base-content">Notificações</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="btn btn-ghost btn-xs rounded-full"
                      type="button"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fechar notificações"
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification);
                        }}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error hover:bg-error/10"
                        type="button"
                        aria-label="Excluir notificação"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-sm font-medium text-base-content/70">Nenhuma notificação</p>
                  <p className="text-xs text-base-content/50 mt-1">Você será notificado quando houver atualizações importantes.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

