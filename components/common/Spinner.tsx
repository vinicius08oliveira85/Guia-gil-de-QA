
import React from 'react';

export const Spinner: React.FC<{ small?: boolean }> = React.memo(({ small }) => (
    <div className={`relative ${small ? 'h-5 w-5' : 'h-10 w-10'}`}>
        <div className="absolute inset-0 rounded-full border border-white/10 opacity-60"></div>
        <div
            className={`animate-spin rounded-full border-2 border-transparent ${small ? 'h-5 w-5' : 'h-10 w-10'} border-t-2 border-l-2 border-t-accent border-l-accent/60`}
        ></div>
    </div>
));
