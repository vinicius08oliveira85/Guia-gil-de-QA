import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'jira' | 'supabase' | 'ai';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // Form States
  const [theme, setTheme] = useState('system');
  const [jiraHost, setJiraHost] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Load saved values when modal opens
  useEffect(() => {
    if (isOpen) {
      setTheme(localStorage.getItem('theme') || 'system');
      setJiraHost(localStorage.getItem('jira_host') || '');
      setJiraEmail(localStorage.getItem('jira_email') || '');
      setJiraToken(localStorage.getItem('jira_token') || '');
      setSupabaseUrl(localStorage.getItem('supabase_url') || '');
      setSupabaseKey(localStorage.getItem('supabase_key') || '');
      setGeminiKey(localStorage.getItem('gemini_key') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('jira_host', jiraHost);
    localStorage.setItem('jira_email', jiraEmail);
    localStorage.setItem('jira_token', jiraToken);
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    localStorage.setItem('gemini_key', geminiKey);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      id="settings-panel"
      containerClassName="z-50"
      title="Configurações"
      ariaLabelledBy="settings-modal-title"
    >
      <div className="p-6">
        {/* Tabs Navigation */}
        <div role="tablist" className="tabs tabs-boxed mb-6 bg-base-200/50 p-1">
          <a 
            role="tab" 
            className={`tab ${activeTab === 'general' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Geral
          </a>
          <a 
            role="tab" 
            className={`tab ${activeTab === 'jira' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('jira')}
          >
            Jira
          </a>
          <a 
            role="tab" 
            className={`tab ${activeTab === 'supabase' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            Supabase
          </a>
          <a 
            role="tab" 
            className={`tab ${activeTab === 'ai' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            IA (Gemini)
          </a>
        </div>

        {/* Tab Content */}
        <div className="min-h-[320px]">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 id="settings-modal-title" className="heading-section mb-4">
                Configurações Gerais
              </h2>
              <div className="form-control w-full">
                <label htmlFor="theme-select" className="label">
                  <span className="label-text font-medium text-text-secondary">Tema da Interface</span>
                </label>
                <select
                  id="theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="select select-bordered w-full bg-surface border-surface-border focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="system">Padrão do Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'jira' && (
            <div className="space-y-5">
              <h2 className="heading-section mb-4">Integração Jira</h2>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">Host (URL)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="ex: empresa.atlassian.net" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={jiraHost}
                  onChange={(e) => setJiraHost(e.target.value)}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">E-mail do Usuário</span>
                </label>
                <input 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">API Token</span>
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-5">
              <h2 className="heading-section mb-4">Integração Supabase</h2>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">Project URL</span>
                </label>
                <input 
                  type="text" 
                  placeholder="https://xyz.supabase.co" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">API Key / Anon Key</span>
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              <h2 className="heading-section mb-4">Inteligência Artificial</h2>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-text-secondary">Gemini API Key</span>
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-bordered w-full bg-surface border-surface-border"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="btn">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};