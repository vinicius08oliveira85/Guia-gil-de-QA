import { cn } from '../../utils/cn';
import {
  projectTabContentClass,
  projectTabNeuScopeClass,
  projectTabPanelClass,
} from '../common/projectTabNeuUi';

/** Escopo da aba Bloco de Notas (página inteira, não coluna fixa). */
export const notepadViewPageShellClass = cn(
  projectTabNeuScopeClass,
  'notepad-view-page-shell tasks-panel-scope',
  'w-full min-w-0 max-w-none space-y-3 sm:space-y-4 max-md:space-y-2'
);

export const notepadViewContentClass = projectTabContentClass;

/** Painel do editor — alinhado aos painéis das demais abas. */
export const notepadViewPanelClass = cn(projectTabPanelClass, 'flex min-h-[min(72vh,640px)] flex-col overflow-hidden p-0');
