import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/windows12Styles";
import { useTheme } from "../../hooks/useTheme";
import { PhaseStatus } from "../../types";
import { Tooltip } from "./Tooltip";

export interface Pillar {
  label: string;
  height: string;
  delay: number;
  status: PhaseStatus;
  isCurrent?: boolean;
  icon?: string;
  progressPercentage?: number;
  description?: string;
  phaseName?: string;
  heightStyle?: React.CSSProperties;
}

interface ProcessPillarsProps {
  pillars: Pillar[];
  className?: string;
  'aria-label'?: string;
}

/**
 * Componente ProcessPillars com animações de expansão
 * 
 * @example
 * ```tsx
 * <ProcessPillars pillars={pillarsData} />
 * ```
 */
export const ProcessPillars: React.FC<ProcessPillarsProps> = ({ 
  pillars, 
  className,
  'aria-label': ariaLabel
}) => {
  const { theme } = useTheme();

  // Função para obter classes de gradiente baseado no status e tema
  const getGradientClasses = (status: PhaseStatus, isCurrent?: boolean): string => {
    if (status === 'Concluído') {
      switch (theme) {
        case 'dark':
          return 'bg-gradient-to-t from-green-500 via-green-400 to-green-300';
        case 'light':
          return 'bg-gradient-to-t from-green-600 via-green-500 to-green-400';
        case 'leve-saude':
          return 'bg-gradient-to-t from-leve-success via-green-500 to-green-400';
        default:
          return 'bg-gradient-to-t from-green-500 via-green-400 to-green-300';
      }
    }
    
    if (status === 'Em Andamento' || isCurrent) {
      switch (theme) {
        case 'dark':
          return 'bg-gradient-to-t from-yellow-500 via-yellow-400 to-yellow-300';
        case 'light':
          return 'bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400';
        case 'leve-saude':
          return 'bg-gradient-to-t from-leve-accent via-orange-500 to-orange-400';
        default:
          return 'bg-gradient-to-t from-yellow-500 via-yellow-400 to-yellow-300';
      }
    }
    
    // Não Iniciado - usar cores mais visíveis
    switch (theme) {
      case 'dark':
        return 'bg-gradient-to-t from-gray-600 via-gray-500 to-gray-400';
      case 'light':
        return 'bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100';
      case 'leve-saude':
        return 'bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100';
      default:
        return 'bg-gradient-to-t from-gray-600 via-gray-500 to-gray-400';
    }
  };

  // Função para obter classes de borda baseado no tema
  const getBorderClasses = (): string => {
    switch (theme) {
      case 'dark':
        return 'border-surface-border';
      case 'light':
        return 'border-surface-border';
      case 'leve-saude':
        return 'border-surface-border';
      default:
        return 'border-surface-border';
    }
  };

  return (
    <div 
      className={cn("flex items-end gap-1 sm:gap-2 relative", className)}
      role="list"
      aria-label={ariaLabel || "Fases do SDLC"}
    >
      {/* Conexões entre fases - apenas em telas médias/grandes */}
      {pillars.map((pillar, index) => {
        if (index === pillars.length - 1) return null;
        const nextPillar = pillars[index + 1];
        const isCompleted = pillar.status === 'Concluído' && nextPillar.status === 'Concluído';
        const isPartiallyCompleted = pillar.status === 'Concluído' || nextPillar.status === 'Concluído';
        
        // Calcular posição baseada no índice
        // Mobile: 56px (w-14) + 4px (gap-1) = 60px por pilar
        // sm: 64px (w-16) + 8px (gap-2) = 72px por pilar  
        // md+: 80px (w-20) + 8px (gap-2) = 88px por pilar
        const leftMobile = `calc(${index * 60}px + 56px)`;
        const leftSm = `calc(${index * 72}px + 64px)`;
        const leftMd = `calc(${index * 88}px + 80px)`;
        
        const connectionColor = isCompleted 
          ? 'rgb(34, 197, 94)' // green-500
          : isPartiallyCompleted 
            ? 'rgb(234, 179, 8)' // yellow-500
            : 'rgb(156, 163, 175)'; // gray-400
        
        return (
          <motion.div
            key={`connection-${index}`}
            className="hidden sm:block absolute top-1/2 h-0.5 -translate-y-1/2 w-1 sm:w-1.5 md:w-2"
            style={{
              left: leftMd, // Default para md+
              backgroundColor: connectionColor
            }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: pillar.delay + 0.3,
              ease: 'easeOut'
            }}
          />
        );
      })}

      {pillars.map((pillar, index) => {
        const isLast = index === pillars.length - 1;
        const gradientClasses = getGradientClasses(pillar.status, pillar.isCurrent);
        const progressPercentage = pillar.progressPercentage ?? (pillar.status === 'Concluído' ? 100 : pillar.status === 'Em Andamento' ? 50 : 0);
        
        // Tooltip content
        const tooltipContent = (
          <div className="space-y-1">
            <div className="font-semibold text-white">{pillar.label}</div>
            {pillar.description && (
              <div className="text-xs text-gray-200">{pillar.description}</div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-gray-300">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                pillar.status === 'Concluído' ? 'bg-green-500/30 text-green-200' :
                pillar.status === 'Em Andamento' ? 'bg-yellow-500/30 text-yellow-200' :
                'bg-gray-500/30 text-gray-200'
              }`}>
                {pillar.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-300">Progresso:</span>
              <span className="text-xs font-semibold text-white">{progressPercentage}%</span>
            </div>
          </div>
        );
        
        return (
          <Tooltip
            key={pillar.label}
            content={tooltipContent}
            position="top"
            delay={300}
            ariaLabel={`${pillar.label}: ${pillar.status}, ${progressPercentage}% completo`}
          >
            <div
              className={cn(
                "flex flex-col rounded-md h-64 sm:h-80 md:h-96 w-14 sm:w-16 md:w-20 border transition-all duration-300",
                getBorderClasses(),
                pillar.isCurrent && "ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20",
                "hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 cursor-pointer touch-manipulation"
              )}
              role="listitem"
              tabIndex={0}
              aria-label={`Fase ${pillar.label}: ${pillar.status}, ${progressPercentage}% completo`}
              aria-current={pillar.isCurrent ? 'step' : undefined}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {!isLast && (
                <div className="h-full rounded-md"></div>
              )}
              <motion.div
                className={cn(
                  gradientClasses,
                  isLast ? "rounded-md h-full" : "rounded-b-md",
                  pillar.height,
                  "relative flex flex-col items-center justify-end",
                  "shadow-inner"
                )}
                style={{ 
                  transformOrigin: "bottom",
                  ...pillar.heightStyle
                }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.8,
                  delay: pillar.delay,
                  ease: [0.4, 0, 0.2, 1],
                }}
                animate={pillar.isCurrent ? {
                  boxShadow: [
                    "0 0 0px rgba(234, 179, 8, 0)",
                    "0 0 8px rgba(234, 179, 8, 0.5)",
                    "0 0 0px rgba(234, 179, 8, 0)"
                  ]
                } : {}}
              >
                {/* Ícone */}
                {pillar.icon && (
                  <motion.div
                    className={cn(
                      "text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2",
                      pillar.status === 'Não Iniciado' ? "text-text-primary" : "text-white"
                    )}
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: pillar.delay + 0.5,
                    }}
                  >
                    {pillar.icon}
                  </motion.div>
                )}

                {/* Percentual de progresso */}
                {progressPercentage > 0 && (
                  <motion.div
                    className={cn(
                      "text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1",
                      pillar.status === 'Não Iniciado' ? "text-text-primary" : "text-white"
                    )}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: pillar.delay + 0.6,
                    }}
                  >
                    {progressPercentage}%
                  </motion.div>
                )}

                {/* Label */}
                <motion.p
                  className={cn(
                    "text-center text-[10px] sm:text-xs font-medium px-0.5 sm:px-1 leading-tight",
                    pillar.status === 'Não Iniciado' 
                      ? "text-text-primary" 
                      : "text-white",
                    index === 0 ? "pt-1 sm:pt-2" :
                    index === 1 ? "pt-2 sm:pt-4" :
                    index === 2 ? "pt-3 sm:pt-6" :
                    index === 3 ? "pt-4 sm:pt-8" :
                    "pt-5 sm:pt-10"
                  )}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.3,
                    delay: pillar.delay + 0.4,
                  }}
                >
                  {pillar.label}
                </motion.p>

                {/* Badge de fase atual */}
                {pillar.isCurrent && (
                  <motion.div
                    className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-yellow-500 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shadow-md"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: pillar.delay + 0.8,
                    }}
                  >
                    Atual
                  </motion.div>
                )}
              </motion.div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

ProcessPillars.displayName = 'ProcessPillars';

