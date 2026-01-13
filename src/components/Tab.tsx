import React from 'react';

interface TabProps {
    label: string;
    active: boolean;
    onClick: () => void;
    id?: string;
}

export const Tab: React.FC<TabProps> = ({ label, active, onClick, id }) => (
    <button
        id={id}
        onClick={onClick}
        className={`py-6 relative text-[10px] sm:text-xs font-bold font-sans tracking-[0.1em] md:tracking-[0.2em] transition-all shrink-0 whitespace-nowrap ${active ? 'text-black' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-full shadow-[0_-4px_10px_rgba(0,0,0,0.2)]" />
        )}
    </button>
);
