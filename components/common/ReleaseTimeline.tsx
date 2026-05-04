import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export type TimeLine_01Entry = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  items?: string[];
  image?: string;
  button?: {
    url: string;
    text: string;
  };
};

export interface TimeLine_01Props {
  title?: string;
  description?: string;
  entries?: TimeLine_01Entry[];
  className?: string;
}

/**
 * Componente Timeline interativo que expande o card ativo no viewport
 *
 * @example
 * ```tsx
 * <ReleaseTimeline
 *   title="Métricas do Dashboard"
 *   entries={timelineEntries}
 * />
 * ```
 */
export const ReleaseTimeline: React.FC<TimeLine_01Props> = ({
  title = 'Dashboard Metrics',
  description = 'Visão geral das métricas e status do projeto',
  entries = [],
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Create stable setters for refs inside map
  const setItemRef = (el: HTMLDivElement | null, i: number) => {
    itemRefs.current[i] = el;
  };

  const setSentinelRef = (el: HTMLDivElement | null, i: number) => {
    sentinelRefs.current[i] = el;
  };

  useEffect(() => {
    if (!sentinelRefs.current.length) return;

    // We observe small sentinels placed near the title of each card. Whichever
    // sentinel is closest to the vertical center of the viewport becomes active.
    // Using IntersectionObserver to track visibility + a rAF loop to pick the closest.
    let frame = 0;
    const updateActiveByProximity = () => {
      frame = requestAnimationFrame(updateActiveByProximity);

      // Compute distance of each sentinel to viewport center
      const centerY = window.innerHeight / 3;
      let bestIndex = 0;
      let bestDist = Infinity;

      sentinelRefs.current.forEach((node, i) => {
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);

        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      });

      if (bestIndex !== activeIndex) setActiveIndex(bestIndex);
    };

    frame = requestAnimationFrame(updateActiveByProximity);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  // Optional: ensure the first card is active on mount
  useEffect(() => {
    setActiveIndex(0);
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-8', className)}>
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-base-content md:text-5xl">
            {title}
          </h1>
          <p className="mb-6 text-base text-base-content/70 md:text-lg">{description}</p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-16 md:mt-24 md:space-y-24">
          {entries.map((entry, index) => {
            const isActive = index === activeIndex;
            const Icon = entry.icon;

            return (
              <div
                key={index}
                className="relative flex flex-col gap-4 md:flex-row md:gap-16"
                ref={el => setItemRef(el, index)}
                aria-current={isActive ? 'true' : 'false'}
              >
                {/* Sticky meta column */}
                <div className="top-8 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors duration-300',
                        isActive ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-base-content">{entry.title}</span>
                      <span className="text-xs text-base-content/70">{entry.subtitle}</span>
                    </div>
                  </div>
                </div>

                {/* Invisible sentinel near the card title to measure proximity to viewport center */}
                <div
                  ref={el => setSentinelRef(el, index)}
                  aria-hidden
                  className="absolute -top-24 left-0 h-12 w-12 opacity-0"
                />

                {/* Content column */}
                <article
                  className={cn(
                    'flex flex-col rounded-2xl border p-4 transition-all duration-300 bg-base-100',
                    isActive ? 'border-primary/30 shadow-lg' : 'border-base-300 shadow-sm'
                  )}
                >
                  {entry.image && (
                    <img
                      src={entry.image}
                      alt={`${entry.title} visual`}
                      className="mb-4 w-full h-72 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}

                  <div className="space-y-4">
                    {/* Header with improved typography */}
                    <div className="space-y-2">
                      <h2
                        className={cn(
                          'text-xl font-semibold tracking-tight',
                          isActive ? 'text-base-content' : 'text-base-content/80'
                        )}
                      >
                        {entry.title}
                      </h2>

                      {/* Improved description with better spacing */}
                      <p className="text-base-content/70">{entry.description}</p>
                    </div>

                    {/* Enhanced expandable content */}
                    <div
                      aria-hidden={!isActive}
                      className={cn(
                        'grid transition-all duration-500 ease-out',
                        isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 pt-2">
                          {entry.items && entry.items.length > 0 && (
                            <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                              <ul className="space-y-2">
                                {entry.items.map((item, itemIndex) => (
                                  <li
                                    key={itemIndex}
                                    className="flex items-start gap-2 text-sm text-base-content"
                                  >
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    <span className="leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {entry.button && (
                            <div className="flex justify-end">
                              <Button
                                variant="default"
                                size="sm"
                                className="group rounded-full font-normal transition-all duration-200"
                                asChild
                              >
                                <a href={entry.button.url} target="_blank" rel="noreferrer">
                                  {entry.button.text}
                                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

ReleaseTimeline.displayName = 'ReleaseTimeline';
