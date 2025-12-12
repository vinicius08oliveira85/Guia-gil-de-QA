import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { logger } from '../../utils/logger';
import { SectionHeader } from '../common/SectionHeader';

/**
 * CTA Section - Call to action principal
 * Seção destacada para conversão com formulário ou botão de ação
 */
export const CTASection: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode integrar com um serviço de email ou API
    logger.info('Email capturado na CTA (mock)', 'Landing/CTASection', { email });
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 3000);
  };

  const handleGetStarted = () => {
    // Navegar para dashboard - remover hash da URL e forçar reload para mostrar dashboard
    if (window.location.hash) {
      window.location.hash = '';
    }
    // Disparar evento customizado para o App.tsx mostrar o dashboard
    window.dispatchEvent(new CustomEvent('show-dashboard'));
  };

  return (
    <section id="cta-section" className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            eyebrow="Próximo passo"
            title={
              <>
                Entre no fluxo e comece a{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  estruturar o QA
                </span>
              </>
            }
            description="Crie um projeto, use templates, organize tarefas e gere evidências/relatórios — com um dashboard para acompanhar riscos e progresso."
            className="mb-12"
          />

          {/* Opções de CTA */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* CTA Principal - Começar Agora */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -30 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-3xl bg-base-100 border-2 border-primary shadow-xl"
            >
              <h3 className="text-2xl font-bold text-base-content mb-4">Acesse o Dashboard</h3>
              <p className="text-base-content/70 mb-6">
                Crie seu primeiro projeto e comece com templates. Funciona localmente e pode sincronizar com Supabase quando configurado.
              </p>
              <button
                onClick={handleGetStarted}
                className="btn btn-primary btn-lg w-full rounded-full group"
              >
                Criar / Abrir Projetos
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="mt-4 flex items-center gap-2 text-sm text-base-content/60">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Sem backend obrigatório</span>
              </div>
            </motion.div>

            {/* CTA Secundário - Newsletter */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 30 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-8 rounded-3xl bg-base-200 border border-base-300"
            >
              <h3 className="text-2xl font-bold text-base-content mb-4">Receba atualizações</h3>
              <p className="text-base-content/70 mb-6">
                Novidades do produto, templates e boas práticas de QA e DevOps.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input input-bordered w-full rounded-full"
                />
                <button
                  type="submit"
                  className="btn btn-secondary btn-lg w-full rounded-full"
                  disabled={isSubmitted}
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Inscrito!
                    </>
                  ) : (
                    'Inscrever-se'
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Features rápidas do CTA */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
          >
            {[
              'Funciona localmente (IndexedDB)',
              'Templates prontos',
              'Integração Jira (opcional)',
              'Sync Supabase (opcional)',
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm text-base-content/70">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

