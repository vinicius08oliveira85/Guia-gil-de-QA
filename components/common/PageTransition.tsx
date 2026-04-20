import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Chave para o AnimatePresence (ex.: id da aba). Não use a prop especial `key` do React aqui. */
  transitionKey: string;
  className?: string;
}

/**
 * Componente para animações de transição de página
 *
 * @example
 * ```tsx
 * <PageTransition transitionKey={activeTab}>
 *   <Component />
 * </PageTransition>
 * ```
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Componente para transição de lista (stagger effect)
 */
export const ListTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Item de lista com animação
 */
export const ListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

