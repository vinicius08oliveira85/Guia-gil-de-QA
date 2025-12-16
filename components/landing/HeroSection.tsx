import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Target } from 'lucide-react';

/**
 * Hero Section - Primeira impressão da landing page
 * Design moderno inspirado em MCP V0 com hierarquia visual clara
 */
export const HeroSection: React.FC = () => {
  const reduceMotion = useReducedMotion();

  const handleGetStarted = () => {
    // Disparar evento para mostrar dashboard
    window.dispatchEvent(new CustomEvent('show-dashboard'));
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-base-100 via-base-200 to-base-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge/Anúncio */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Templates • métricas • exportação • integrações opcionais</span>
            </div>
          </motion.div>

          {/* Título Principal */}
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-base-content mb-6 leading-tight"
          >
            Gestão de QA{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ágil e Inteligente
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-base-content/70 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Centralize projetos, tarefas, casos de teste e evidências. Acompanhe progresso e riscos em dashboards
            e gere relatórios com consistência — com Jira e Supabase como integrações opcionais.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <button
              onClick={handleGetStarted}
              className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              Abrir Meus Projetos
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleLearnMore}
              className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold rounded-full border-2 hover:bg-base-200 transition-all duration-300"
            >
              Ver funcionalidades
            </button>
          </motion.div>

          {/* Features rápidas */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16"
          >
            {[
              { icon: Zap, text: 'Templates e padrões', color: 'text-primary' },
              { icon: Target, text: 'Métricas e relatórios', color: 'text-secondary' },
              { icon: Sparkles, text: 'IA assistida (opcional)', color: 'text-accent' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-base-200/50 backdrop-blur-sm border border-base-300 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
                <span className="text-base-content font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 10, 0] }}
          transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-base-content/30 rounded-full flex justify-center p-2"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 12, 0] }}
            transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-base-content/50 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

