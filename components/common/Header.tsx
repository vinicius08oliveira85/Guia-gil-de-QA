import React from 'react';
import { CompassIcon } from './Icons';

export const Header = React.memo(() => (
    <header className="mica p-3 sm:p-4 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-accent p-2 rounded-lg shadow-md">
                    <CompassIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-text-primary">QA Agile Guide</h1>
            </div>
        </div>
    </header>
));