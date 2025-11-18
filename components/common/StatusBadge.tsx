import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: 'To Do' | 'In Progress' | 'Done' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; icon?: string }> = {
    'To Do': { variant: 'default', icon: '⏳' },
    'In Progress': { variant: 'info', icon: '🔄' },
    'Done': { variant: 'success', icon: '✅' },
    'Não Iniciado': { variant: 'default', icon: '⏸️' },
    'Em Andamento': { variant: 'info', icon: '🔄' },
    'Concluído': { variant: 'success', icon: '✅' }
  };

  const config = statusConfig[status] || { variant: 'default' };

  return (
    <Badge variant={config.variant} size={size}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {status}
    </Badge>
  );
};

