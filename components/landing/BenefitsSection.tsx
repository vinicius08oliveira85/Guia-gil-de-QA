import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Rocket, DollarSign, Heart, Award, Target } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlight: string;
  color: string;
  bgGradient: string;
}

const benefits: Benefit[] = [
  {
    icon: Rocket,
    title: 'Menos overhead, mais execução',
    description:
      'Saia do modo “planilha + checklist solto”. Use templates, padrões e automações para manter o QA fluindo sem perda de contexto.',
    highlight: 'Fluxo padronizado',
    color: 'text-primary',
    bgGradient: 'from-primary/10 to-primary/5',
  },
  {
    icon: DollarSign,
    title: 'Rastreabilidade e decisão',
    description:
      'Melhore a tomada de decisão com métricas e evidências acessíveis. Reduza o “achismo” em priorização, release e risco.',
    highlight: 'Visão executiva',
    color: 'text-secondary',
    bgGradient: 'from-secondary/10 to-secondary/5',
  },
  {
    icon: Heart,
    title: 'Qualidade com consistência',
    description:
      'Aplique práticas ágeis e Shift-Left desde cedo, com artefatos e indicadores que ajudam a manter previsibilidade e alinhamento.',
    highlight: 'Shift-Left',
    color: 'text-accent',
    bgGradient: 'from-accent/10 to-accent/5',
  },
];

/**
 * Benefits Section - Layout alternado (zigzag) com benefícios do produto
 * Design persuasivo com ilustrações e texto convincente
 */
export const BenefitsSection: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="benefits-section" className="py-20 md:py-32 bg-gradient-to-b from-base-100 to-base-200 scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Impacto no dia a dia"
          title="Menos esforço operacional, mais clareza de qualidade"
          description="Padronize o processo, aumente rastreabilidade e gere relatórios com consistência — sem depender de planilhas e checklists dispersos."
          className="mb-16"
        />

        {/* Lista de benefícios com layout alternado */}
        <div className="space-y-16 md:space-y-24">
          {benefits.map((benefit, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 50 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12 lg:gap-16`}
              >
                {/* Conteúdo de texto */}
                <div className={`flex-1 ${isEven ? 'md:text-left' : 'md:text-right'} text-center md:text-left`}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                    <span className={`font-semibold ${benefit.color}`}>{benefit.highlight}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-4">
                    {benefit.title}
                  </h3>

                  <p className="text-lg text-base-content/70 leading-relaxed mb-6 max-w-xl">
                    {benefit.description}
                  </p>

                  <a href="#features-section" className="btn btn-ghost text-primary hover:bg-primary/10 group">
                    Ver como funciona
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Ilustração/Placeholder */}
                <div className="flex-1 w-full">
                  <div
                    className={`relative h-64 md:h-80 lg:h-96 rounded-3xl bg-gradient-to-br ${benefit.bgGradient} border border-base-300 overflow-hidden`}
                  >
                    {/* Placeholder visual - pode ser substituído por imagem real */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <benefit.icon className={`w-24 h-24 md:w-32 md:h-32 ${benefit.color} opacity-20 mx-auto mb-4`} />
                        <div className="w-32 h-32 md:w-48 md:h-48 bg-base-300/50 rounded-full mx-auto blur-2xl" />
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
                    <div className="absolute bottom-4 left-4 w-20 h-20 bg-secondary/20 rounded-full blur-xl" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats section */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { icon: Target, value: 'Templates', label: 'Início rápido com padrões' },
            { icon: Award, value: 'PDF', label: 'Exportação e relatórios' },
            { icon: Rocket, value: 'Jira', label: 'Integração opcional' },
            { icon: Heart, value: 'Supabase', label: 'Sincronização cloud opcional' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-base-200 border border-base-300 hover:border-primary/30 transition-all duration-300"
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-base-content mb-2">{stat.value}</div>
              <div className="text-sm text-base-content/70">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

