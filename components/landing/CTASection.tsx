import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * CTA Section - Call to action principal
 * Seção destacada para conversão com formulário ou botão de ação
 */
export const CTASection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode integrar com um serviço de email ou API
    console.log('Email submitted:', email);
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Pronto para começar?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-base-content mb-6 leading-tight">
              Transforme sua gestão de{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                qualidade hoje
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto mb-8">
              Junte-se a equipes que já estão revolucionando seus processos de QA com automação e inteligência.
            </p>
          </motion.div>

          {/* Opções de CTA */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* CTA Principal - Começar Agora */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-3xl bg-base-100 border-2 border-primary shadow-xl"
            >
              <h3 className="text-2xl font-bold text-base-content mb-4">Comece Agora</h3>
              <p className="text-base-content/70 mb-6">
                Acesso imediato a todas as funcionalidades. Sem necessidade de cartão de crédito.
              </p>
              <button
                onClick={handleGetStarted}
                className="btn btn-primary btn-lg w-full rounded-full group"
              >
                Criar Conta Gratuita
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="mt-4 flex items-center gap-2 text-sm text-base-content/60">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Sem compromisso</span>
              </div>
            </motion.div>

            {/* CTA Secundário - Newsletter */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-8 rounded-3xl bg-base-200 border border-base-300"
            >
              <h3 className="text-2xl font-bold text-base-content mb-4">Receba Atualizações</h3>
              <p className="text-base-content/70 mb-6">
                Fique por dentro das novidades, dicas e melhores práticas de QA.
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
          >
            {[
              'Sem cartão de crédito',
              'Setup em 5 minutos',
              'Suporte 24/7',
              'Cancelamento fácil',
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

