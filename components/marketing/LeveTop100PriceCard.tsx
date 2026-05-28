import { cn } from '../../utils/cn';

export interface LeveTop100PriceCardProps {
  href?: string;
  backgroundImageUrl?: string;
  price?: string;
  footnote?: string;
  className?: string;
}

/**
 * Card promocional Leve Top 100 — tokens neumórficos (`--leve-header-*`, `--project-card-*`).
 * Substitui markup legado (`text-white`, `font-arialmt`, `#fb4c00`).
 */
export function LeveTop100PriceCard({
  href = '#',
  backgroundImageUrl,
  price = 'R$ 150,81',
  footnote = 'Plano QC empresarial, com coparticipação, sem obstetrícia, 19-23 anos, a partir de 2 vidas.',
  className,
}: LeveTop100PriceCardProps) {
  return (
    <div className={cn('font-sans', className)}>
      <a href={href} className="block no-underline">
        <div
          className={cn(
            'project-card-neu-shell leve-neu-surface relative flex h-[468px] flex-col justify-between',
            'overflow-hidden rounded-[var(--leve-header-radius)] bg-cover bg-center bg-no-repeat',
            'py-5 pl-6 pr-8 shadow-[var(--leve-neu-raised)]'
          )}
          style={backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})` } : undefined}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--leve-neu-surface)_40%,transparent)]"
            aria-hidden
          />

          <div className="relative z-[1]">
            <h3 className="text-2xl text-[var(--leve-header-text)] sm:text-4xl">
              Leve <strong>Top 100</strong>
            </h3>
            <p className="mt-5 text-lg text-[var(--project-card-text)]">
              O cuidado que sua saúde precisa, por um preço que cabe no seu bolso.
            </p>

            <div className="pt-5">
              <p className="font-sans font-semibold text-[var(--leve-header-text)]">
                a partir de <br />
                <span className="text-3xl font-bold text-[var(--leve-header-accent)]">{price}</span>
              </p>
            </div>

            <div className="mt-8">
              <p className="flex items-center font-sans text-sm font-semibold uppercase text-[var(--project-card-text)]">
                Saiba mais
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-4 h-4 w-4 fill-[var(--leve-header-text)]"
                  viewBox="0 0 12.396 12.396"
                  aria-hidden
                >
                  <path
                    data-name="Path 10"
                    d="M6.2 0 5.071 1.127l4.266 4.266H0V7h9.337l-4.266 4.269L6.2 12.4l6.2-6.2z"
                  />
                </svg>
              </p>
            </div>
          </div>

          <p className="relative z-[1] text-sm text-[var(--project-card-text-muted)]">{footnote}</p>
        </div>
      </a>
    </div>
  );
}
