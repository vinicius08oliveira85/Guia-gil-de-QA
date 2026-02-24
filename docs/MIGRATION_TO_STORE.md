# Migração para Zustand Store

Este guia mostra como migrar componentes que usam estado local para o store global.

## Antes (Estado Local)

```tsx
// App.tsx
const [projects, setProjects] = useState<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

const handleCreateProject = async (name: string) => {
  const newProject = await addProject(name, '');
  setProjects([...projects, newProject]);
};
```

## Depois (Store Global)

```tsx
// App.tsx
import { useProjectsStore } from '../store/projectsStore';

const { projects, selectedProjectId, loadProjects, createProject, selectProject } =
  useProjectsStore();

// Carregar projetos ao montar
useEffect(() => {
  loadProjects();
}, [loadProjects]);

// Criar projeto
const handleCreateProject = async (name: string) => {
  await createProject(name, '');
};
```

## Benefícios

1. **Menos prop drilling**: Estado acessível em qualquer componente
2. **Código mais limpo**: Lógica centralizada
3. **Melhor performance**: Re-renders otimizados
4. **Fácil de testar**: Store pode ser mockado

## Exemplo Completo

```tsx
import { useProjectsStore } from '../store/projectsStore';

export const MyComponent = () => {
  const { projects, isLoading, error, loadProjects, createProject } = useProjectsStore();

  useEffect(() => {
    if (projects.length === 0) {
      loadProjects();
    }
  }, [projects.length, loadProjects]);

  const handleCreate = async () => {
    try {
      await createProject('Novo Projeto', 'Descrição');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
```
