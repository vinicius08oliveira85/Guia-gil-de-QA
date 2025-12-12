import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, ArrowUp } from 'lucide-react';

interface FooterLink {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const footerLinks: FooterLink[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#features-section' },
      { label: 'Benefícios', href: '#benefits-section' },
      { label: 'Começar', href: '#cta-section' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Templates de projeto', href: '#features-section' },
      { label: 'Dashboard e métricas', href: '#features-section' },
      { label: 'Exportação e relatórios', href: '#features-section' },
    ],
  },
  {
    title: 'Integrações',
    links: [
      { label: 'Jira (opcional)', href: '#features-section' },
      { label: 'Supabase (opcional)', href: '#features-section' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos', href: '#terms' },
      { label: 'Privacidade', href: '#privacy' },
    ],
  },
];

const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: '#', label: 'Email' },
];

/**
 * Footer - Rodapé da landing page
 * Links organizados, redes sociais e copyright
 */
export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-base-200 border-t border-base-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-base-content mb-4">QA Agile Guide</h3>
              <p className="text-base-content/70 mb-6 max-w-sm">
                Plataforma para organizar QA ágil com templates, métricas, relatórios e integrações opcionais.
              </p>
              {/* Social links */}
              <div className="flex gap-4" aria-label="Links sociais">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Links sections */}
          {footerLinks.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="font-semibold text-base-content mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-base-content/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-8 border-t border-base-300 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-sm text-base-content/70 text-center md:text-left">
            © {new Date().getFullYear()} QA Agile Guide. Todos os direitos reservados.
          </p>

          <button
            onClick={scrollToTop}
            className="btn btn-ghost btn-sm rounded-full"
            aria-label="Voltar ao topo"
            type="button"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="ml-2">Voltar ao topo</span>
          </button>
        </motion.div>
      </div>
    </footer>
  );
};

