import React, { useState } from 'react';
import { SettingsModal } from '../settings/SettingsModal';

// Exemplo de itens de navegação que usam a lógica de 'activeTab'
const navPills = [{ id: 'dashboard', label: 'Dashboard' }];

export const Header: React.FC = () => {
  // Estado antigo que causava o problema para o botão de Configurações
  const [activeTab, setActiveTab] = useState('dashboard');

  // 1. Estado dedicado para a visibilidade do painel de configurações.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 flex items-center justify-between p-2 border-b bg-background/80 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img alt="Logo QA Agile Guide" className="h-10 w-auto sm:h-12 flex-shrink-0" src="/logo@erasebg-transformed.png" />
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold leading-tight truncate">QA Agile Guide</p>
            <p className="text-xs text-base-content/60 truncate hidden sm:block">Gestão de QA ágil, métricas e automação</p>
          </div>
        </div>

        <nav role="navigation" aria-label="Menu principal" className="flex items-center gap-2">
          {/* Mapeamento dos itens de navegação normais */}
          {navPills.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-pressed={activeTab === item.id}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeTab === item.id ? 'bg-base-200 text-blue-600' : 'hover:bg-surface-hover'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* 2. Separação de Interesses: O botão de Configurações agora é um componente de ação independente. */}
          <button
            onClick={() => setIsSettingsOpen(true)} // 3. Altera o estado 'isSettingsOpen'.
            className={`relative flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
              isSettingsOpen ? 'bg-base-200 text-blue-600' : 'hover:bg-surface-hover'
            }`}
            aria-label="Configurações"
            aria-pressed={isSettingsOpen} // Acessibilidade: O estado pressionado reflete se o painel está aberto.
            aria-controls="settings-panel" // Acessibilidade: Aponta para o ID do painel que ele controla.
            type="button"
          >
            <svg className="lucide lucide-settings" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span
              className="overflow-hidden transition-all duration-300"
              style={{ width: isSettingsOpen ? 'auto' : 0, opacity: isSettingsOpen ? 1 : 0, marginLeft: isSettingsOpen ? '8px' : 0 }}
            >
              Configurações
            </span>
          </button>
        </nav>

        {/* ... Outros elementos do Header ... */}
      </header>

      {/* 4. O componente de Modal é renderizado condicionalmente. */}
      {isSettingsOpen && <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)} // A função de fechar atualiza o estado.
      />}
    </>
  );
};