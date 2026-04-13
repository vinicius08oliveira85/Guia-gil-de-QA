import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export type BackButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>;

/**
 * Botão de retorno padronizado: ghost, sm, ícone ChevronLeft e rótulo configurável (padrão "Voltar").
 */
export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
    ({ className, children = 'Voltar', ...props }, ref) => (
        <Button
            ref={ref}
            type="button"
            variant="ghost"
            size="sm"
            className={cn('gap-1', className)}
            {...props}
        >
            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
            {children}
        </Button>
    ),
);

BackButton.displayName = 'BackButton';
