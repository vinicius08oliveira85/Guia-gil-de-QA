import React from 'react';
import { type BadgeSize } from '../../utils/badgeSizes';

/**
 * Props do componente VersionBadge
 */
interface VersionBadgeProps {
  /** Versão a ser exibida (ex: "V1", "V2") */
  version: string;
  /** Tamanho do badge */
  size?: BadgeSize;
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar ícone */
  showIcon?: boolean;
}

/**
 * Componente Badge para exibir versão do projeto
 * Destaca visualmente tags de versão (V1, V2, etc.)
 * 
 * @example
 * ```tsx
 * <VersionBadge version="V1" />
 * <VersionBadge version="V2" size="sm" />
 * ```
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  size = 'md',
  className = '',
  showIcon = true
}) => {
  // Escala alinhada com BADGE_SIZE_CLASSES; altura definida via padding (sem h-* fixo)
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[0.6rem]',
    sm: 'px-2 py-0.5 text-[0.65rem]',
    md: 'px-2 py-1 text-[0.7rem]',
    lg: 'px-2.5 py-1.5 text-[0.75rem]',
  };

  const iconSize = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full font-semibold
        bg-gradient-to-br from-blue-500/20 to-indigo-500/20
        border border-blue-400/40
        text-blue-300
        shadow-[0_4px_12px_rgba(59,130,246,0.15)]
        transition-all duration-200
        hover:shadow-[0_6px_16px_rgba(59,130,246,0.25)]
        hover:border-blue-400/60
        ${sizeClasses[size]}
        ${className}
      `}
      title={`Versão ${version}`}
      aria-label={`Versão do projeto: ${version}`}
      role="status"
    >
      {showIcon && (
        <span className={iconSize[size]} aria-hidden="true">
          🏷️
        </span>
      )}
      <span>{version}</span>
    </span>
  );
};

/**
 * Componente para exibir múltiplas versões
 */
interface VersionBadgesProps {
  /** Array de versões */
  versions: string[];
  /** Tamanho dos badges */
  size?: BadgeSize;
  /** Classes CSS adicionais */
  className?: string;
}

export const VersionBadges: React.FC<VersionBadgesProps> = ({
  versions,
  size = 'md',
  className = ''
}) => {
  if (versions.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {versions.map((version, index) => (
        <VersionBadge
          key={`${version}-${index}`}
          version={version}
          size={size}
        />
      ))}
    </div>
  );
};

