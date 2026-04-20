import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "../../utils/cn";
import { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (id: string | null) => void;
  /** Conteúdo opcional renderizado antes das abas, dentro do mesmo container pill. */
  leadingContent?: React.ReactNode;
  /** Chamado quando o usuário clica fora do container (para recolher leadingContent expansível, etc.). */
  onOutsideClick?: () => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? ".75rem" : ".5rem",
    paddingRight: isSelected ? ".75rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

/**
 * Componente ExpandableTabs com efeito de expansão animado
 * 
 * @example
 * ```tsx
 * <ExpandableTabs 
 *   tabs={[
 *     { title: "Settings", icon: Settings },
 *     { title: "Notifications", icon: Bell }
 *   ]}
 *   activeColor="text-blue-500"
 * />
 * ```
 */
export const ExpandableTabs: React.FC<ExpandableTabsProps> = ({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  leadingContent,
  onOutsideClick,
}) => {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef as React.RefObject<HTMLElement>, () => {
    setSelected(null);
    onChange?.(null);
    onOutsideClick?.();
  });

  const handleSelect = (index: number, id: string) => {
    setSelected(index);
    onChange?.(id);
  };

  const Separator = () => (
    <div className="mx-0.5 h-[20px] w-px bg-base-200" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-full border border-base-300 bg-base-100/70 p-0.5 shadow-sm backdrop-blur",
        className
      )}
    >
      {leadingContent}
      {leadingContent != null && (
        <div className="mx-0.5 h-[20px] w-px bg-base-200" aria-hidden="true" />
      )}
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isExpanded = hoveredIndex === index;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isExpanded}
            onClick={() => handleSelect(index, tab.id)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            transition={transition}
            className={cn(
              "relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold outline-none sm:justify-start",
              "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
              selected === index
                ? cn("bg-primary/15", activeColor)
                : "text-base-content/70 hover:bg-base-200/80 hover:text-base-content hover:ring-2 hover:ring-primary/20"
            )}
            aria-label={tab.title}
            aria-pressed={selected === index}
            type="button"
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};

ExpandableTabs.displayName = 'ExpandableTabs';
