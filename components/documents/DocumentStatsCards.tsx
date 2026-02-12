import React from 'react';
import { FileText, TestTube, Compass, File } from 'lucide-react';

const CATEGORIES = [
  { id: 'requisitos', label: 'REQUISITOS', bgClass: 'bg-brand-purple', icon: FileText },
  { id: 'testes', label: 'TESTES', bgClass: 'bg-brand-orange', icon: TestTube },
  { id: 'arquitetura', label: 'ARQUITETURA', bgClass: 'bg-brand-blue', icon: Compass },
  { id: 'outros', label: 'OUTROS', bgClass: 'bg-slate-500 dark:bg-slate-600', icon: File },
] as const;

export interface DocumentStatsCardsProps {
  categoryCounts: Record<string, number>;
}

export const DocumentStatsCards: React.FC<DocumentStatsCardsProps> = ({ categoryCounts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Contagem de documentos por categoria">
      {CATEGORIES.map(({ id, label, bgClass, icon: Icon }) => (
        <div
          key={id}
          role="listitem"
          className={`${bgClass} p-6 rounded-[12px] text-white relative overflow-hidden group hover-glow transition-all cursor-default`}
          aria-label={`${label}: ${categoryCounts[id] ?? 0} documento(s)`}
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">{label}</p>
            <p className="text-4xl font-bold mt-1">{categoryCounts[id] ?? 0}</p>
          </div>
          <Icon
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 opacity-20 transition-transform group-hover:scale-110"
            aria-hidden
          />
        </div>
      ))}
    </div>
  );
};
