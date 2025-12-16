import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';

/**
 * Wrapper para renderização de componentes com providers necessários
 */
interface TestWrapperProps {
  children: React.ReactNode;
  initialProjects?: Project[];
  selectedProjectId?: string | null;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialProjects = [],
  selectedProjectId = null,
}) => {
  // Inicializar store com estado inicial se fornecido
  React.useEffect(() => {
    if (initialProjects.length > 0 || selectedProjectId !== null) {
      useProjectsStore.setState({
        projects: initialProjects,
        selectedProjectId,
        isLoading: false,
        error: null,
      });
    }
  }, [initialProjects, selectedProjectId]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
};

/**
 * Renderiza um componente com todos os providers necessários
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    initialProjects?: Project[];
    selectedProjectId?: string | null;
  }
) {
  const { initialProjects, selectedProjectId, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper
      initialProjects={initialProjects}
      selectedProjectId={selectedProjectId}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Aguarda até que uma condição seja verdadeira
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condição não foi satisfeita após ${timeout}ms`);
}

/**
 * Simula navegação entre telas
 */
export function simulateNavigation(target: 'landing' | 'dashboard' | 'project', projectId?: string) {
  const store = useProjectsStore.getState();
  
  switch (target) {
    case 'landing':
      store.selectProject(null);
      break;
    case 'dashboard':
      store.selectProject(null);
      break;
    case 'project':
      if (projectId) {
        store.selectProject(projectId);
      }
      break;
  }
}

/**
 * Aguarda até que o store esteja em um estado específico
 */
export async function waitForStoreState(
  predicate: (state: ReturnType<typeof useProjectsStore.getState>) => boolean,
  timeout = 5000
): Promise<void> {
  return waitForCondition(() => {
    const state = useProjectsStore.getState();
    return predicate(state);
  }, timeout);
}

/**
 * Limpa o estado do store
 */
export function resetStore(): void {
  useProjectsStore.setState({
    projects: [],
    selectedProjectId: null,
    isLoading: false,
    error: null,
  });
}

/**
 * Cria um projeto no store
 */
export async function createProjectInStore(
  name: string,
  description: string,
  templateId?: string
): Promise<Project> {
  const store = useProjectsStore.getState();
  return await store.createProject(name, description, templateId);
}

/**
 * Aguarda até que um elemento apareça e desapareça (loading)
 */
export async function waitForLoadingToComplete(
  queryFn: () => HTMLElement | null,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  let wasVisible = false;

  while (Date.now() - startTime < timeout) {
    const element = queryFn();
    if (element) {
      wasVisible = true;
    } else if (wasVisible && !element) {
      // Elemento apareceu e desapareceu
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!wasVisible) {
    throw new Error('Elemento de loading nunca apareceu');
  }
}

/**
 * Simula um delay para testes assíncronos
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extrai texto de um elemento ignorando espaços extras
 */
export function getTextContent(element: HTMLElement | null): string {
  if (!element) return '';
  return element.textContent?.replace(/\s+/g, ' ').trim() || '';
}

