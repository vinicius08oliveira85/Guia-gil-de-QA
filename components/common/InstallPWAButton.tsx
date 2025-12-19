import React, { useState, useEffect } from 'react';
import { canInstallApp, installApp, isAppInstalled, initializePWA } from '../../utils/pwa';
import { logger } from '../../utils/logger';

/**
 * Botão para instalar o PWA
 * Aparece quando o app pode ser instalado e desaparece após instalação
 */
export const InstallPWAButton: React.FC<{
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className = '', 
  variant = 'primary',
  size = 'md'
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Inicializa PWA listeners
    initializePWA();

    // Verifica se já está instalado
    setIsInstalled(isAppInstalled());

    // Verifica se pode instalar
    setCanInstall(canInstallApp());

    // Listener para quando o app se torna instalável
    const handleInstallable = () => {
      setCanInstall(true);
    };

    // Listener para quando o app é instalado
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (error) {
      logger.error('Erro ao instalar app', 'InstallPWAButton', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Não mostra se já está instalado ou não pode instalar
  if (isInstalled || !canInstall) {
    return null;
  }

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={isInstalling}
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label="Instalar aplicativo"
    >
      {isInstalling ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          <span>Instalando...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span>Instalar App</span>
        </>
      )}
    </button>
  );
};

