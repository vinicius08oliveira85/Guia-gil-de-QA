import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "btn-error",
        outline: "btn-outline",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        link: "btn-link",
        brand:
          "rounded-xl bg-brand-orange text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orange-selected-hover focus-visible:outline-brand-orange/40",
        brandOutline:
          "rounded-xl border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus-visible:outline-base-content/20",
      },
      size: {
        default: "btn-md min-h-[44px] sm:min-h-0",
        sm: "btn-sm min-h-[44px] sm:min-h-0",
        lg: "btn-lg",
        icon: "btn-square btn-md px-0 min-h-[44px] min-w-[44px]",
        panel: "px-2.5 py-1.5 text-xs rounded-xl min-h-0 sm:px-3 sm:py-2 sm:text-sm",
        panelSm: "px-2 py-1 text-xs rounded-xl min-h-0 sm:px-2.5 sm:py-1.5 sm:text-sm",
        panelXs: "px-2 py-1 text-xs rounded-lg min-h-0 gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Componente Button reutilizável com variantes
 * 
 * @example
 * ```tsx
 * <Button variant="default" size="sm">Clique aqui</Button>
 * <Button variant="outline" asChild>
 *   <a href="/link">Link</a>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";

export { Button };

