import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/windows12Styles";
import { useTheme } from "../../hooks/useTheme";
import { PhaseStatus } from "../../types";

export interface Pillar {
  label: string;
  height: string;
  delay: number;
  status: PhaseStatus;
  isCurrent?: boolean;
}

interface ProcessPillarsProps {
  pillars: Pillar[];
  className?: string;
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
  className 
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
    <div className={cn("flex items-end gap-2 pointer-events-none", className)}>
      {pillars.map((pillar, index) => {
        const isLast = index === pillars.length - 1;
        const gradientClasses = getGradientClasses(pillar.status, pillar.isCurrent);
        
        return (
          <div
            key={pillar.label}
            className={cn(
              "flex flex-col rounded-md h-96 w-20 border",
              getBorderClasses()
            )}
          >
            {!isLast && (
              <div className="h-full rounded-md"></div>
            )}
            <motion.div
              className={cn(
                gradientClasses,
                isLast ? "rounded-md h-full" : "rounded-b-md",
                pillar.height
              )}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.8,
                delay: pillar.delay,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{ transformOrigin: "bottom" }}
            >
              <motion.p
                className={cn(
                  "text-center text-sm font-medium",
                  // Ajustar cor do texto baseado no status para melhor contraste
                  pillar.status === 'Não Iniciado' 
                    ? "text-text-primary" 
                    : "text-white",
                  index === 0 ? "pt-2" :
                  index === 1 ? "pt-4" :
                  index === 2 ? "pt-6" :
                  index === 3 ? "pt-8" :
                  "pt-10"
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
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

ProcessPillars.displayName = 'ProcessPillars';

