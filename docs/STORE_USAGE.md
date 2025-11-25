# Guia de Uso do Store (Zustand)

Este documento explica como usar o store global de projetos no QA Agile Guide.

## Visão Geral

O store centraliza o gerenciamento de estado de projetos e tarefas, eliminando prop drilling e facilitando o compartilhamento de estado entre componentes.

## Uso Básico

### Importar o Store

```tsx
import { useProjectsStore } from '../store/projectsStore';
```

### Acessar Estado

```tsx
const { projects, selectedProjectId, isLoading } = useProjectsStore();
```

### Usar Ações

```tsx
const { loadProjects, createProject, updateProject } = useProjectsStore();

// Carregar projetos
await loadProjects();

// Criar projeto
await createProject('Novo Projeto', 'Descrição');

// Atualizar projeto
await updateProject(updatedProject);
```

## Hook Auxiliar: useProject

Para simplificar o uso em componentes que trabalham com um projeto específico:

```tsx
import { useProject } from '../hooks/useProject';

const MyComponent = ({ projectId }: { projectId: string }) => {
  const { project, updateProject, addTask, updateTask, deleteTask } = useProject(projectId);

  if (!project) {
    return <div>Projeto não encontrado</div>;
  }

  const handleAddTask = async () => {
    await addTask(newTask);
  };

  return (
    <div>
      <h1>{project.name}</h1>
      {/* ... */}
    </div>
  );
};
```

## Ações Disponíveis

### Projetos

- `loadProjects()` - Carrega todos os projetos
- `createProject(name, description, templateId?)` - Cria novo projeto
- `updateProject(project)` - Atualiza projeto existente
- `deleteProject(projectId)` - Remove projeto
- `selectProject(projectId | null)` - Seleciona projeto
- `getSelectedProject()` - Retorna projeto selecionado
- `importProject(project)` - Importa projeto (ex: do Jira)

### Tarefas

- `addTaskToProject(projectId, task)` - Adiciona tarefa ao projeto
- `updateTaskInProject(projectId, taskId, updates)` - Atualiza tarefa
- `deleteTaskFromProject(projectId, taskId)` - Remove tarefa

## Estado do Store

```typescript
interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: Error | null;
  // ... ações
}
```

## Exemplos

### Componente que Lista Projetos

```tsx
const ProjectsList = () => {
  const { projects, isLoading, loadProjects } = useProjectsStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
```

### Componente que Edita Projeto

```tsx
const ProjectEditor = ({ projectId }: { projectId: string }) => {
  const { project, updateProject } = useProject(projectId);

  const handleSave = async (formData: ProjectFormData) => {
    if (!project) return;
    
    await updateProject({
      ...project,
      ...formData,
    });
  };

  // ...
};
```

## Middleware

O store inclui middleware para logging automático de mudanças de estado (apenas em desenvolvimento).

## Boas Práticas

1. **Use o hook `useProject`** quando trabalhar com um projeto específico
2. **Trate erros** - O store não mostra toasts automaticamente
3. **Use `getSelectedProject()`** para obter projeto selecionado sem re-render
4. **Evite acessar o store diretamente** fora de componentes React

## Migração de Componentes

Veja [MIGRATION_TO_STORE.md](MIGRATION_TO_STORE.md) para guia completo de migração.

