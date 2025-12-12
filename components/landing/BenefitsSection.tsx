import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Rocket, DollarSign, Heart, Award, Target } from 'lucide-react';

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
    title: 'Produtividade Aumentada',
    description:
      'Automatize tarefas repetitivas e foque no que realmente importa. Reduza o tempo gasto em gestão manual em até 70%.',
    highlight: '70% mais rápido',
    color: 'text-primary',
    bgGradient: 'from-primary/10 to-primary/5',
  },
  {
    icon: DollarSign,
    title: 'Economia de Custos',
    description:
      'Identifique problemas antes que se tornem críticos. Reduza retrabalho e custos de correção com detecção precoce.',
    highlight: 'Redução de custos',
    color: 'text-secondary',
    bgGradient: 'from-secondary/10 to-secondary/5',
  },
  {
    icon: Heart,
    title: 'Qualidade Superior',
    description:
      'Garanta a qualidade do seu software desde o início. Metodologias ágeis e práticas de Shift-Left integradas.',
    highlight: 'Qualidade garantida',
    color: 'text-accent',
    bgGradient: 'from-accent/10 to-accent/5',
  },
];

/**
 * Benefits Section - Layout alternado (zigzag) com benefícios do produto
 * Design persuasivo com ilustrações e texto convincente
 */
export const BenefitsSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-base-100 to-base-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header da seção */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content mb-4">
            Por que escolher o QA Agile Guide?
          </h2>
          <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto">
            Resultados reais que fazem a diferença no seu dia a dia
          </p>
        </motion.div>

        {/* Lista de benefícios com layout alternado */}
        <div className="space-y-16 md:space-y-24">
          {benefits.map((benefit, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
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

                  <button className="btn btn-ghost text-primary hover:bg-primary/10 group">
                    Saiba mais
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { icon: Target, value: '100%', label: 'Cobertura de Testes' },
            { icon: Award, value: '24/7', label: 'Disponibilidade' },
            { icon: Rocket, value: '10x', label: 'Mais Rápido' },
            { icon: Heart, value: '99%', label: 'Satisfação' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
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

