import type { Meta, StoryObj } from '@storybook/react';
import {
  ShieldCheck,
  Zap,
  Eye,
  Cog,
  Globe,
  Smartphone,
  Lock,
  ScanSearch,
  FileCheck,
  Layers,
  BarChart3,
  Puzzle,
  Target,
  MonitorSmartphone,
  ScrollText,
  Lightbulb,
  Code2,
  Fingerprint,
  LayoutGrid,
  GaugeCircle,
  ServerCrash,
  HardDrive,
  Workflow,
  ListChecks,
  TestTubes,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

type TestType = {
  label: string;
  variant: 'error' | 'warning' | 'info' | 'success' | 'outline';
  icon: LucideIcon;
};

type TestCategory = {
  title: string;
  description: string;
  tests: TestType[];
};

const testCategories: TestCategory[] = [
  {
    title: 'Seguranca',
    description: 'Testes criticos de seguranca e vulnerabilidades.',
    tests: [
      { label: 'Teste de Seguranca', variant: 'error', icon: ShieldCheck },
      { label: 'Teste de Autenticacao', variant: 'error', icon: Fingerprint },
      { label: 'Analise de Vulnerabilidades', variant: 'error', icon: ScanSearch },
      { label: 'Teste de Penetracao', variant: 'error', icon: Lock },
    ],
  },
  {
    title: 'Performance e Carga',
    description: 'Testes de desempenho, stress e capacidade do sistema.',
    tests: [
      { label: 'Teste de Performance', variant: 'warning', icon: Zap },
      { label: 'Teste de Desempenho', variant: 'warning', icon: GaugeCircle },
      { label: 'Teste de Performance Mobile', variant: 'warning', icon: Smartphone },
      { label: 'Teste de Carga', variant: 'warning', icon: BarChart3 },
      { label: 'Teste de Stress', variant: 'warning', icon: ServerCrash },
      { label: 'Teste de Capacidade', variant: 'warning', icon: HardDrive },
    ],
  },
  {
    title: 'Funcional e Integracao',
    description: 'Testes de funcionalidade, integracao e regressao.',
    tests: [
      { label: 'Teste Funcional', variant: 'info', icon: Cog },
      { label: 'Teste de Integracao', variant: 'info', icon: Puzzle },
      { label: 'Teste de Regressao', variant: 'info', icon: Layers },
      { label: 'Teste de Regressao Automatizado', variant: 'info', icon: Layers },
      { label: 'Regressao', variant: 'info', icon: Layers },
      { label: 'Unitario', variant: 'info', icon: Code2 },
      { label: 'Integracao', variant: 'info', icon: Puzzle },
      { label: 'API', variant: 'info', icon: Workflow },
      { label: 'Teste de Contrato', variant: 'info', icon: FileCheck },
    ],
  },
  {
    title: 'E2E e Sistema',
    description: 'Testes ponta a ponta, de sistema e smoke/sanity.',
    tests: [
      { label: 'Teste E2E', variant: 'info', icon: Globe },
      { label: 'Teste E2E Automatizado', variant: 'info', icon: Globe },
      { label: 'Sistema', variant: 'info', icon: MonitorSmartphone },
      { label: 'Smoke Test', variant: 'info', icon: TestTubes },
      { label: 'Sanity Test', variant: 'info', icon: TestTubes },
    ],
  },
  {
    title: 'Validacao e Aceitacao',
    description: 'Testes de validacao, aceitacao e criterios de aceitacao.',
    tests: [
      { label: 'Teste de Validacao', variant: 'success', icon: FileCheck },
      { label: 'Validacao de User Stories', variant: 'success', icon: ScrollText },
      { label: 'Aceitacao', variant: 'success', icon: ListChecks },
      { label: 'Definicao de Criterios de Aceitacao', variant: 'success', icon: Target },
    ],
  },
  {
    title: 'Usabilidade e Acessibilidade',
    description: 'Testes de experiencia do usuario e acessibilidade.',
    tests: [
      { label: 'Teste de Usabilidade', variant: 'success', icon: Eye },
      { label: 'Usabilidade', variant: 'success', icon: Eye },
      { label: 'Teste de Acessibilidade', variant: 'success', icon: LayoutGrid },
    ],
  },
  {
    title: 'Compatibilidade e Dispositivos',
    description: 'Testes de compatibilidade entre navegadores e dispositivos.',
    tests: [
      { label: 'Teste de Compatibilidade', variant: 'outline', icon: MonitorSmartphone },
      { label: 'Teste de Compatibilidade de Navegadores', variant: 'outline', icon: Globe },
      { label: 'Teste de Dispositivos', variant: 'outline', icon: Smartphone },
      { label: 'Teste de Gestos', variant: 'outline', icon: Smartphone },
    ],
  },
  {
    title: 'Analise e Exploratorio',
    description: 'Analises, testes exploratorios e de design.',
    tests: [
      { label: 'Teste Exploratorio', variant: 'outline', icon: Lightbulb },
      { label: 'Teste Caixa Branca', variant: 'outline', icon: TestTubes },
      { label: 'Analise de Requisitos', variant: 'outline', icon: ScrollText },
      { label: 'Analise de Casos de Uso', variant: 'outline', icon: Target },
      { label: 'Teste de Design', variant: 'outline', icon: LayoutGrid },
    ],
  },
];

const allTests = testCategories.flatMap((c) => c.tests);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-base-content tracking-tight">
      {children}
    </h2>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-base-content/70">{children}</p>;
}

function ShowcaseCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-base-200 bg-base-100 p-6 ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

/** Mapeia variante do showcase para variante do Badge do projeto (outline -> default) */
function badgeVariant(
  v: TestType['variant']
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (v === 'outline') return 'default';
  return v;
}

export function BadgeShowcase() {
  return (
    <div className="flex flex-col gap-12">
      {/* Legenda */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionTitle>Legenda de Cores</SectionTitle>
          <SectionDescription>
            Mapeamento de variante por criticidade do teste.
          </SectionDescription>
        </div>
        <ShowcaseCard className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50">
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Cor
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Variante
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Grupo
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Exemplo
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  variant: 'error' as const,
                  group: 'Seguranca',
                  example: 'Teste de Penetracao',
                },
                {
                  variant: 'warning' as const,
                  group: 'Performance / Carga',
                  example: 'Teste de Stress',
                },
                {
                  variant: 'info' as const,
                  group: 'Funcional / E2E / Sistema',
                  example: 'Teste Funcional',
                },
                {
                  variant: 'success' as const,
                  group: 'Validacao / Usabilidade',
                  example: 'Aceitacao',
                },
                {
                  variant: 'outline' as const,
                  group: 'Compatibilidade / Exploratorio',
                  example: 'Teste de Design',
                },
              ].map((item) => (
                <tr
                  key={item.variant}
                  className="border-b border-base-200 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.variant === 'outline' ? 'default' : item.variant}
                      appearance="pill"
                    >
                      {item.variant}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-base-content/70">
                    {item.variant}
                  </td>
                  <td className="px-4 py-3 text-base-content">{item.group}</td>
                  <td className="px-4 py-3 text-base-content/70">
                    {item.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ShowcaseCard>
      </section>

      {/* Todos os 40 badges */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionTitle>Todos os Tipos de Teste</SectionTitle>
          <SectionDescription>
            Visualizacao completa com icone (pill).
          </SectionDescription>
        </div>
        <ShowcaseCard>
          <div className="flex flex-wrap items-center gap-2">
            {allTests.map((t, i) => {
              const Icon = t.icon;
              return (
                <Badge
                  key={`${t.label}-${i}`}
                  variant={badgeVariant(t.variant)}
                  appearance="pill"
                  className="inline-flex items-center gap-1.5"
                >
                  <Icon className="size-3" />
                  {t.label}
                </Badge>
              );
            })}
          </div>
        </ShowcaseCard>
      </section>

      {/* Por Categoria */}
      {testCategories.map((cat) => (
        <section key={cat.title} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <SectionTitle>{cat.title}</SectionTitle>
            <SectionDescription>{cat.description}</SectionDescription>
          </div>
          <ShowcaseCard>
            <div className="flex flex-col gap-5">
              {/* Solid com icone (pill) */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-base-content/70 uppercase tracking-wider">
                  Pill + Icone
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cat.tests.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <Badge
                        key={`solid-${i}`}
                        variant={badgeVariant(t.variant)}
                        appearance="pill"
                        className="inline-flex items-center gap-1.5"
                      >
                        <Icon className="size-3" />
                        {t.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Solid sem icone */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-base-content/70 uppercase tracking-wider">
                  Pill (texto)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cat.tests.map((t, i) => (
                    <Badge
                      key={`text-${i}`}
                      variant={badgeVariant(t.variant)}
                      appearance="pill"
                    >
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Soft / Pastel */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-base-content/70 uppercase tracking-wider">
                  Soft / Pastel
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cat.tests.map((t, i) => {
                    const Icon = t.icon;
                    const softClass: string = {
                      error:
                        'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300',
                      warning:
                        'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
                      info: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
                      success:
                        'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300',
                      outline:
                        'border-base-300 bg-base-200/60 text-base-content',
                    }[t.variant];
                    return (
                      <Badge
                        key={`soft-${i}`}
                        variant="default"
                        className={`inline-flex items-center gap-1.5 rounded-full ${softClass}`}
                      >
                        <Icon className="size-3" />
                        {t.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Outline colorido */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-base-content/70 uppercase tracking-wider">
                  Outline colorido
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cat.tests.map((t, i) => {
                    const Icon = t.icon;
                    const outlineClass: string = {
                      error: 'border-red-500 text-red-600 dark:text-red-400',
                      warning: 'border-amber-500 text-amber-700 dark:text-amber-400',
                      info: 'border-blue-500 text-blue-600 dark:text-blue-400',
                      success: 'border-green-500 text-green-600 dark:text-green-400',
                      outline: 'border-base-300 text-base-content',
                    }[t.variant];
                    return (
                      <Badge
                        key={`outline-${i}`}
                        variant="default"
                        className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent ${outlineClass}`}
                      >
                        <Icon className="size-3" />
                        {t.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </ShowcaseCard>
        </section>
      ))}

      {/* Tabela de referencia completa */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionTitle>Referencia Completa</SectionTitle>
          <SectionDescription>
            Tabela com todos os tipos, variante e codigo.
          </SectionDescription>
        </div>
        <ShowcaseCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50">
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Tipo de Teste
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Badge
                </th>
                <th className="px-4 py-3 text-left font-medium text-base-content/70">
                  Variante
                </th>
              </tr>
            </thead>
            <tbody>
              {testCategories.flatMap((cat) =>
                cat.tests.map((t, i) => {
                  const Icon = t.icon;
                  const globalIndex =
                    testCategories
                      .slice(0, testCategories.indexOf(cat))
                      .reduce((acc, c) => acc + c.tests.length, 0) +
                    i +
                    1;
                  return (
                    <tr
                      key={`ref-${cat.title}-${i}`}
                      className="border-b border-base-200 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-base-content/70 tabular-nums">
                        {globalIndex}
                      </td>
                      <td className="px-4 py-2.5 text-base-content">
                        {t.label}
                      </td>
                      <td className="px-4 py-2.5 text-base-content/70">
                        {cat.title}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={badgeVariant(t.variant)}
                          appearance="pill"
                          className="inline-flex items-center gap-1.5"
                        >
                          <Icon className="size-3" />
                          {t.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs text-base-content/70">
                          {t.variant}
                        </code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ShowcaseCard>
      </section>
    </div>
  );
}

const meta: Meta<typeof BadgeShowcase> = {
  title: 'Showcase/Badge (Tipos de Teste)',
  component: BadgeShowcase,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BadgeShowcase>;

export const TiposDeTeste: Story = {
  render: () => <BadgeShowcase />,
};
