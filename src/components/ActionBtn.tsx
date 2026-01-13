import React from 'react';

interface ActionBtnProps {
    icon: React.ReactNode;
    label: string;
    color?: string;
    onClick?: () => void;
    id?: string;
}

export const ActionBtn: React.FC<ActionBtnProps> = ({ icon, label, color = "text-slate-400", onClick, id }) => (
    <button id={id} onClick={onClick} className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center gap-2 sm:gap-2.5 hover:bg-slate-50 transition-all ${color} group`}>
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
        <span className="text-[10px] font-bold font-sans tracking-widest uppercase">{label}</span>
    </button>
);
