import React from 'react';

interface FooterLeveSaudeProps {
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  links?: Array<{ label: string; href: string }>;
  socialLinks?: Array<{ label: string; href: string; icon?: string }>;
  copyright?: string;
}

/**
 * Footer Leve Saúde - Componente de rodapé seguindo a identidade visual
 */
export const FooterLeveSaude = React.memo<FooterLeveSaudeProps>(
  ({
    contactInfo = {
      phone: '(11) 0000-0000',
      email: 'contato@levesaude.com.br',
      address: 'Endereço da clínica',
    },
    links = [],
    socialLinks = [],
    copyright = `© ${new Date().getFullYear()} Leve Saúde. Todos os direitos reservados.`,
  }) => {
    return (
      <footer
        className="leve-saude py-8 mt-12"
        style={{
          backgroundColor: 'var(--color-primary-deep)',
          color: 'var(--color-white)',
        }}
        role="contentinfo"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Informações de Contato */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-sm">
                {contactInfo.phone && (
                  <li>
                    <span className="font-medium">Telefone:</span>{' '}
                    <a href={`tel:${contactInfo.phone}`} className="hover:underline">
                      {contactInfo.phone}
                    </a>
                  </li>
                )}
                {contactInfo.email && (
                  <li>
                    <span className="font-medium">E-mail:</span>{' '}
                    <a href={`mailto:${contactInfo.email}`} className="hover:underline">
                      {contactInfo.email}
                    </a>
                  </li>
                )}
                {contactInfo.address && (
                  <li>
                    <span className="font-medium">Endereço:</span> {contactInfo.address}
                  </li>
                )}
              </ul>
            </div>

            {/* Links Rápidos */}
            {links.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
                <ul className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-sm hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Redes Sociais */}
            {socialLinks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
                <ul className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-sm hover:underline flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.icon && <span>{link.icon}</span>}
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-6 text-center text-sm">
            <p>{copyright}</p>
          </div>
        </div>
      </footer>
    );
  }
);

FooterLeveSaude.displayName = 'FooterLeveSaude';
