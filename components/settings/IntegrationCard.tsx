import React from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import { Card } from '../common/Card';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

/**
 * Props do componente IntegrationCard
 */
interface IntegrationCardProps {
  /** Nome da integração */
  name: string;
  /** Descrição da integração */
  description: string;
  /** Ícone da integração (ReactNode) */
  icon: React.ReactNode;
  /** Variante de status */
  status: StatusVariant;
  /** Label do status */
  statusLabel: string;
  /** Callback quando clicar em conectar */
  onConnect?: () => void;
  /** Callback quando clicar em configurar */
  onConfigure?: () => void;
  /** Callback quando clicar em desconectar */
  onDisconnect?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente IntegrationCard - Card reutilizável para exibir integrações
 *
 * Exibe informações sobre uma integração (Jira, Supabase, etc.) com status,
 * ícone, descrição e botões de ação.
 *
 * @example
 * ```tsx
 * <IntegrationCard
 *   name="Jira"
 *   description="Conecte seu workspace Jira"
 *   icon={<JiraIcon />}
 *   status="connected"
 *   statusLabel="Conectado"
 *   onConfigure={() => {}}
 *   onDisconnect={() => {}}
 * />
 * ```
 */
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
      <Card className={cn('p-6 hover:border-primary/20 transition-colors', className)}>
        <div className="flex items-start gap-4">
          {/* Ícone da integração */}
          <div className="shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {/* Header com nome e status */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-base-content">{name}</h3>
                <p className="text-sm text-base-content/70 mt-1 leading-relaxed">{description}</p>
              </div>
              <StatusBadge variant={status}>{statusLabel}</StatusBadge>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {!isConnected ? (
                <Button onClick={onConnect} size="sm" className="flex items-center gap-1">
                  Conectar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  {onConfigure && (
                    <Button
                      onClick={onConfigure}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar
                    </Button>
                  )}
                  {onDisconnect && (
                    <Button onClick={onDisconnect} variant="ghost" size="sm">
                      Desconectar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

IntegrationCard.displayName = 'IntegrationCard';
