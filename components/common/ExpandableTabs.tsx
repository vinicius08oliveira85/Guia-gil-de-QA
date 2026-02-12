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
}) => {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number, id: string) => {
    setSelected(index);
    onChange?.(id);
  };

  const Separator = () => (
    <div className="mx-0.5 h-[20px] w-px bg-base-300" aria-hidden="true" />
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
        <div className="mx-0.5 h-[20px] w-px bg-base-300" aria-hidden="true" />
      )}
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => handleSelect(index, tab.id)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300",
              selected === index
                ? cn("bg-base-200", activeColor)
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            )}
            aria-label={tab.title}
            aria-pressed={selected === index}
            type="button"
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {selected === index && (
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
