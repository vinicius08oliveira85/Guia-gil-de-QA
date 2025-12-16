/**
 * Componente principal do assistente virtual Rolaf
 * Integra todos os componentes e gerencia o estado do assistente
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { useRolaf } from '../../hooks/useRolaf';
import { RolafAvatar, RolafAvatarState } from './RolafAvatar';
import { RolafTooltip } from './RolafTooltip';
import { RolafTour } from './RolafTour';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Modal } from '../common/Modal';

interface RolafAssistantProps {
  currentView?: string;
  className?: string;
}

/**
 * Componente de configurações do Rolaf
 */
const RolafSettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  preferences: ReturnType<typeof useRolaf>['preferences'];
  onUpdate: ReturnType<typeof useRolaf>['updateRolafPreferences'];
}> = ({ isOpen, onClose, preferences, onUpdate }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações do Rolaf"
      size="md"
    >
      <div className="space-y-4">
        {/* Ativar/Desativar */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-base font-semibold text-base-content">
              Ativar Rolaf
            </label>
            <p className="text-sm text-base-content/70">
              Mostrar dicas e assistência do Rolaf
            </p>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
          />
        </div>

        {/* Frequência de dicas */}
        <div>
          <label className="text-base font-semibold text-base-content block mb-2">
            Frequência de Dicas
          </label>
          <p className="text-sm text-base-content/70 mb-2">
            Mostrar nova dica a cada:
          </p>
          <select
            className="select select-bordered w-full"
            value={preferences.tipsFrequency}
            onChange={(e) => onUpdate({ tipsFrequency: Number(e.target.value) })}
          >
            <option value={2}>2 minutos</option>
            <option value={5}>5 minutos</option>
            <option value={10}>10 minutos</option>
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
          </select>
        </div>

        {/* Posição */}
        <div>
          <label className="text-base font-semibold text-base-content block mb-2">
            Posição na Tela
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map((pos) => (
              <button
                key={pos}
                className={`btn btn-sm ${preferences.position === pos ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => onUpdate({ position: pos })}
                type="button"
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4 border-t border-base-300">
          <button
            onClick={onClose}
            className="btn btn-primary"
            type="button"
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const RolafAssistant: React.FC<RolafAssistantProps> = ({
  currentView,
  className = ''
}) => {
  const {
    state,
    currentTip,
    preferences,
    isVisible,
    showTip,
    hideTip,
    startTour,
    stopTour,
    minimize,
    maximize,
    updateRolafPreferences,
    toggleEnabled
  } = useRolaf(currentView);

  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  // Determina estado do avatar baseado no estado do Rolaf
  const getAvatarState = (): RolafAvatarState => {
    if (state === 'showing-tour') return 'talking';
    if (state === 'showing-tip') return 'talking';
    if (state === 'minimized') return 'idle';
    return 'idle';
  };

  // Ajusta posição para mobile
  const position = isMobile ? 'bottom-right' : preferences.position;

  // Não renderiza se desabilitado e não está em tour
  if (!preferences.enabled && state !== 'showing-tour') {
    return null;
  }

  return (
    <>
      {/* Tour */}
      {state === 'showing-tour' && (
        <RolafTour
          onComplete={stopTour}
          onSkip={stopTour}
          position={position}
        />
      )}

      {/* Assistente principal (dicas e avatar) */}
      {state !== 'showing-tour' && (
        <AnimatePresence>
          {(isVisible || state === 'minimized') && (
            <motion.div
              className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4' : position === 'bottom-left' ? 'bottom-4 left-4' : position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4'} z-50 ${className}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <div className="flex flex-col items-end gap-4">
                {/* Tooltip com dica */}
                {state === 'showing-tip' && currentTip && (
                  <RolafTooltip
                    tip={currentTip}
                    position={position}
                    onClose={hideTip}
                    onNext={() => {
                      hideTip();
                      setTimeout(() => showTip(), 500);
                    }}
                  />
                )}

                {/* Avatar com menu flutuante quando minimizado */}
                {state === 'minimized' ? (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <RolafAvatar
                      state={getAvatarState()}
                      size={isMobile ? 'sm' : 'md'}
                      onClick={maximize}
                    />
                    {/* Badge de notificação */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-base-100"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                ) : (
                  <div className="relative">
                    <RolafAvatar
                      state={getAvatarState()}
                      size={isMobile ? 'sm' : 'md'}
                      onClick={() => {
                        if (currentTip) {
                          hideTip();
                        } else {
                          showTip();
                        }
                      }}
                    />
                    
                    {/* Menu de ações quando visível */}
                    {state === 'showing-tip' && (
                      <motion.div
                        className="absolute bottom-full right-0 mb-2 bg-base-100 border border-base-300 rounded-lg shadow-lg p-1 min-w-[120px]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <button
                          onClick={() => {
                            hideTip();
                            startTour();
                          }}
                          className="btn btn-ghost btn-sm w-full justify-start gap-2"
                          type="button"
                        >
                          <HelpCircle size={16} />
                          Iniciar Tour
                        </button>
                        <button
                          onClick={() => setShowSettings(true)}
                          className="btn btn-ghost btn-sm w-full justify-start gap-2"
                          type="button"
                        >
                          <Settings size={16} />
                          Configurações
                        </button>
                        <button
                          onClick={minimize}
                          className="btn btn-ghost btn-sm w-full justify-start gap-2"
                          type="button"
                        >
                          <Minimize2 size={16} />
                          Minimizar
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal de configurações */}
      <RolafSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onUpdate={updateRolafPreferences}
      />
    </>
  );
};

RolafAssistant.displayName = 'RolafAssistant';

