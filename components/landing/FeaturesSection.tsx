import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
import { SectionHeader } from '../common/SectionHeader';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: TestTube,
    title: 'Tarefas, testes e evidências',
    description:
      'Estruture tarefas de QA, casos de teste e resultados no mesmo fluxo — com rastreabilidade e histórico.',
    color: 'text-primary',
  },
  {
    icon: FileText,
    title: 'Documentos e padrões',
    description:
      'Centralize estratégia, planos e artefatos do projeto, evitando duplicação e perda de contexto.',
    color: 'text-secondary',
  },
  {
    icon: BarChart3,
    title: 'Métricas e visão executiva',
    description:
      'Dashboards para acompanhar progresso, riscos e qualidade — sem “montagem manual” de relatórios.',
    color: 'text-accent',
  },
  {
    icon: GitBranch,
    title: 'Integração com Jira',
    description:
      'Importe e conecte informações do Jira ao seu fluxo de QA para reduzir retrabalho e manter alinhamento.',
    color: 'text-primary',
  },
  {
    icon: Zap,
    title: 'IA assistida (quando disponível)',
    description:
      'Sugestões e análises para acelerar escrita e revisão de artefatos, com controle humano e transparência.',
    color: 'text-secondary',
  },
  {
    icon: Shield,
    title: 'Sinais de qualidade',
    description:
      'Indicadores e checagens para orientar priorização, prevenção e decisões de release.',
    color: 'text-accent',
  },
  {
    icon: Users,
    title: 'Colaboração e consistência',
    description:
      'Padronize a forma como a equipe registra decisões, evidências e status do QA ao longo do ciclo.',
    color: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Evolução de métricas',
    description:
      'Acompanhe tendências ao longo do tempo para validar melhorias e capturar regressões cedo.',
    color: 'text-secondary',
  },
  {
    icon: Clock,
    title: 'Armazenamento local + cloud opcional',
    description:
      'Funciona localmente (IndexedDB) com possibilidade de sincronização via Supabase quando configurado.',
    color: 'text-accent',
  },
];

/**
 * Features Section - Grid de funcionalidades do produto
 * Layout responsivo com hover states e animações
 */
export const FeaturesSection: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features-section" className="py-20 md:py-32 bg-base-100 scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Capacidades do produto"
          title="Funcionalidades que reduzem atrito no QA"
          description="Centralize projetos, tarefas, testes, documentos e métricas em um fluxo único — com integrações e automações para acelerar o ciclo."
          className="mb-16"
        />

        {/* Grid de features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-base-300 bg-base-200 p-6 lg:p-8"
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                      borderColor: 'rgba(59, 130, 246, 0.35)',
                      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                    }
              }
            >
              {/* Ícone */}
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
              </div>

              {/* Título */}
              <h3 className="mb-3 text-xl font-bold text-base-content group-hover:text-primary">
                {feature.title}
              </h3>

              {/* Descrição */}
              <p className="text-base-content/70 leading-relaxed">{feature.description}</p>

              {/* Decorative element on hover */}
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-primary/5 opacity-0 blur-2xl group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        {/* CTA adicional */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
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
