import React from 'react';
import { ButtonLeve } from './ButtonLeve';

interface HeaderLeveSaudeProps {
  logoUrl?: string;
  logoAlt?: string;
  navItems?: Array<{ label: string; href: string }>;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

/**
 * Header Leve Saúde - Componente de cabeçalho seguindo a identidade visual
 */
export const HeaderLeveSaude = React.memo<HeaderLeveSaudeProps>(({
  logoUrl = '/Logo_Moderno_Leve-removebg-preview.png',
  logoAlt = 'Leve Saúde',
  navItems = [],
  ctaLabel = 'Agendar consulta',
  onCtaClick,
}) => {
  return (
    <header 
      className="leve-saude sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}
      role="banner"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-10 w-auto logo-leve-shadow"
              loading="lazy"
            />
          )}
          <div>
            <h1 style={{ 
              fontSize: 'var(--fs-h4)', 
              fontWeight: 'var(--fw-semibold)', 
              color: 'var(--color-text)',
              margin: 0 
            }}>
              Leve Saúde
            </h1>
            <p style={{ 
              fontSize: 'var(--fs-small)', 
              color: 'var(--color-muted)',
              margin: 0 
            }}>
              Cuidando da sua saúde
            </p>
          </div>
        </div>
        
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navegação principal">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                style={{
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  fontWeight: 'var(--fw-medium)',
                  transition: 'color var(--transition-base)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text)'}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
        
        {ctaLabel && (
          <div className="flex items-center gap-4">
            <ButtonLeve 
              variant="primary" 
              onClick={onCtaClick}
              aria-label={ctaLabel}
            >
              {ctaLabel}
            </ButtonLeve>
          </div>
        )}
      </div>
    </header>
  );
});

HeaderLeveSaude.displayName = 'HeaderLeveSaude';

