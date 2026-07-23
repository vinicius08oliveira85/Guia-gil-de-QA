import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Bell, User, Bookmark, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'alerts', icon: Bell, label: 'Alerts' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export interface FloatingNavProps {
  onNavigate?: (index: number) => void;
  className?: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ onNavigate, className = '' }) => {
  const [active, setActive] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updateIndicator = useCallback(() => {
    const btn = btnRefs.current[active];
    const container = containerRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicatorStyle({
      width: btnRect.width,
      left: btnRect.left - containerRect.left,
    });
  }, [active]);

  useEffect(() => {
    updateIndicator();
    const id = window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-2',
        className
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div
        ref={containerRef}
        className="relative flex items-center justify-between rounded-full border border-gray-200 bg-white px-1 py-2 shadow-xl dark:border-gray-800 dark:bg-neutral-900"
      >
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = active === index;
          return (
            <button
              key={item.id}
              type="button"
              ref={el => { btnRefs.current[index] = el; }}
              onClick={() => { setActive(index); onNavigate?.(index); }}
              className={cn(
                'relative z-10 flex flex-1 flex-col items-center justify-center px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300'
              )}
              aria-current={isActive ? 'true' : undefined}
              aria-label={item.label}
            >
              <span className="z-10">
                <Icon size={22} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-1 hidden text-xs sm:block">{item.label}</span>
            </button>
          );
        })}

        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 z-0 rounded-full bg-blue-500/10 dark:bg-blue-400/20"
          initial={false}
          animate={{ width: indicatorStyle.width, left: indicatorStyle.left }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>
    </div>
  );
};

export default FloatingNav;
