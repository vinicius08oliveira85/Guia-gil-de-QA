import React from 'react';
import { Link } from 'react-router-dom';
import { APP_BRAND, APP_VERSION } from './landingSections';
import {
  landingAccentTextClass,
  landingTextMutedClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

/**
 * Rodapé leve da home (versão + atalho de ajuda).
 */
export const LandingHomeFooter = React.memo(() => (
  <footer
    className={cn(
      'mt-2 flex w-full flex-col items-center gap-1 text-center text-xs font-medium',
      landingTextMutedClass
    )}
  >
    <p>
      {APP_BRAND.title}
      {APP_VERSION ? ` · v${APP_VERSION}` : ''}
    </p>
    <p>
      <Link
        to="/projects"
        className={cn(
          'font-semibold underline-offset-2 hover:underline',
          landingAccentTextClass,
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
        )}
      >
        Como começar
      </Link>
      {' · '}
      <Link
        to="/settings"
        className={cn(
          'font-semibold underline-offset-2 hover:underline',
          landingAccentTextClass,
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
        )}
      >
        Configurações
      </Link>
    </p>
  </footer>
));

LandingHomeFooter.displayName = 'LandingHomeFooter';
