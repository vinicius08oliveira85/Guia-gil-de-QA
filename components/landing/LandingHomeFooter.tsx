import React from 'react';
import { Link } from 'react-router-dom';
import { APP_BRAND, APP_VERSION } from './landingSections';
import {
  landingNeuFooterClass,
  landingNeuLinkBtnClass,
  landingTextMutedClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

/**
 * Rodapé leve da home (versão + atalho de ajuda).
 */
export const LandingHomeFooter = React.memo(() => (
  <footer
    className={cn(
      landingNeuFooterClass,
      'flex w-full flex-col items-center gap-2 text-center text-xs font-medium',
      landingTextMutedClass
    )}
  >
    <p>
      {APP_BRAND.title}
      {APP_VERSION ? ` · v${APP_VERSION}` : ''}
    </p>
    <p className="flex flex-wrap items-center justify-center gap-2">
      <Link to="/projects" className={landingNeuLinkBtnClass} aria-label="Como começar">
        Como começar
      </Link>
      <Link to="/settings" className={landingNeuLinkBtnClass} aria-label="Abrir configurações">
        Configurações
      </Link>
    </p>
  </footer>
));

LandingHomeFooter.displayName = 'LandingHomeFooter';
