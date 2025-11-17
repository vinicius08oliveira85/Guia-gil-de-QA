
import React from 'react';

export const Header = React.memo(() => (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-teal-500 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h1 className="text-xl font-bold text-white">QA Agile Guide</h1>
            </div>
        </div>
    </header>
));
