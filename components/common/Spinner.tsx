
import React from 'react';

export const Spinner: React.FC<{ small?: boolean }> = React.memo(({ small }) => (
    <div className={`animate-spin rounded-full border-b-2 border-teal-500 ${small ? 'h-5 w-5' : 'h-8 w-8'}`}></div>
));
