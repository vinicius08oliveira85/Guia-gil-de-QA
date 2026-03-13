import React from 'react';

/** Fallback para spinner visível quando tema/CSS ainda não carregou (evita tela branca) */
const SPINNER_FALLBACK = '#451e44';

export const Spinner: React.FC<{ small?: boolean }> = React.memo(({ small }) => (
    <div className={`relative ${small ? 'h-5 w-5' : 'h-10 w-10'}`}>
        <div className="absolute inset-0 rounded-full border border-base-content/10" />
        <div
            className={`animate-spin rounded-full border-2 border-transparent ${small ? 'h-5 w-5' : 'h-10 w-10'} border-t-2 border-l-2`}
            style={{
                borderTopColor: `var(--a, var(--p, var(--bc, ${SPINNER_FALLBACK})))`,
                borderLeftColor: `var(--a, var(--p, var(--bc, ${SPINNER_FALLBACK})))`,
                opacity: 0.85,
            }}
        />
    </div>
));
