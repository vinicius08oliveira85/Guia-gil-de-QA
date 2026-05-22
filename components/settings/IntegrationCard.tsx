import React from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import {
  leveSettingsCardClass,
  leveSettingsMutedTextClass,
  leveSettingsSectionIconWrapClass,
  leveSettingsSectionTitleClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import { cn } from '../../utils/cn';

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: StatusVariant;
  statusLabel: string;
  onConnect?: () => void;
  onConfigure?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export const IntegrationCard = React.memo<IntegrationCardProps>(
  ({
    name,
    description,
    icon,
    status,
    statusLabel,
    onConnect,
    onConfigure,
    onDisconnect,
    className,
  }) => {
    const isConnected = status === 'connected' || status === 'configured';

    return (
      <div
        className={cn(
          leveSettingsCardClass,
          'transition-colors hover:border-[color-mix(in_srgb,var(--leve-header-accent)_25%,transparent)]',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className={leveSettingsSectionIconWrapClass}>{icon}</div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className={cn(leveSettingsSectionTitleClass, 'text-lg')}>{name}</h3>
                <p className={cn(leveSettingsMutedTextClass, 'mt-1')}>{description}</p>
              </div>
              <StatusBadge variant={status}>{statusLabel}</StatusBadge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!isConnected ? (
                <button type="button" onClick={onConnect} className={cn(leveViewPrimaryBtnClass, 'gap-1 text-sm')}>
                  Conectar
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <>
                  {onConfigure && (
                    <button
                      type="button"
                      onClick={onConfigure}
                      className={cn(leveViewOutlineBtnClass, 'gap-2 text-sm')}
                    >
                      <Settings className="h-4 w-4" aria-hidden />
                      Configurar
                    </button>
                  )}
                  {onDisconnect && (
                    <button type="button" onClick={onDisconnect} className={cn(leveViewOutlineBtnClass, 'text-sm')}>
                      Desconectar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

IntegrationCard.displayName = 'IntegrationCard';
