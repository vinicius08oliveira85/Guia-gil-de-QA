import React from 'react';
import { motion } from 'framer-motion';
import {
  TestTube,
  FileText,
  BarChart3,
  GitBranch,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: TestTube,
    title: 'Gestão de Testes',
    description: 'Organize casos de teste, execute testes e acompanhe resultados em tempo real.',
    color: 'text-primary',
  },
  {
    icon: FileText,
    title: 'Documentação Inteligente',
    description: 'Gere documentação automaticamente e mantenha tudo sincronizado.',
    color: 'text-secondary',
  },
  {
    icon: BarChart3,
    title: 'Métricas e Analytics',
    description: 'Dashboards interativos com insights sobre qualidade e progresso.',
    color: 'text-accent',
  },
  {
    icon: GitBranch,
    title: 'Integração DevOps',
    description: 'Conecte-se com Jira, GitHub e outras ferramentas do seu fluxo.',
    color: 'text-primary',
  },
  {
    icon: Zap,
    title: 'Automação Inteligente',
    description: 'IA integrada para sugestões, análises e otimizações automáticas.',
    color: 'text-secondary',
  },
  {
    icon: Shield,
    title: 'Qualidade Garantida',
    description: 'Sistema de semáforo de qualidade e validações automáticas.',
    color: 'text-accent',
  },
  {
    icon: Users,
    title: 'Colaboração em Equipe',
    description: 'Trabalhe em equipe com comentários, atribuições e notificações.',
    color: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Tendências e Previsões',
    description: 'Análise preditiva e identificação de tendências de qualidade.',
    color: 'text-secondary',
  },
  {
    icon: Clock,
    title: 'Tempo Real',
    description: 'Atualizações instantâneas e sincronização em tempo real.',
    color: 'text-accent',
  },
];

/**
 * Features Section - Grid de funcionalidades do produto
 * Layout responsivo com hover states e animações
 */
export const FeaturesSection: React.FC = () => {
  return (
    <section id="features-section" className="py-20 md:py-32 bg-base-100">
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
            Funcionalidades Poderosas
          </h2>
          <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar qualidade de software de forma ágil e eficiente
          </p>
        </motion.div>

        {/* Grid de features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-base-200 border border-base-300 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Ícone */}
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-base-content mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>

              {/* Descrição */}
              <p className="text-base-content/70 leading-relaxed">{feature.description}</p>

              {/* Decorative element on hover */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>

        {/* CTA adicional */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">E muito mais recursos aguardando você</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

