import { describe, it, expect } from 'vitest';
import { migrateProject, migrateProjects, CURRENT_PROJECT_SCHEMA_VERSION } from '../../utils/dataMigration';

describe('dataMigration', () => {
  describe('migrateProject', () => {
    it('retorna projeto inalterado quando já na versão atual', () => {
      const project = {
        id: 'proj-1',
        name: 'Teste',
        description: '',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
        _schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      };
      const result = migrateProject(project);
      expect(result._schemaVersion as number).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      expect(result.id).toBe('proj-1');
    });

    it('adiciona _schemaVersion quando ausente', () => {
      const project = {
        id: 'proj-2',
        name: 'Sem versão',
        description: '',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
      };
      const result = migrateProject(project);
      expect(result._schemaVersion as number).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    });

    it('não quebra com dados mínimos', () => {
      const result = migrateProject({ id: 'min', name: 'Mínimo', tasks: [] });
      expect(result.id).toBe('min');
    });

    it('log warning se versão futura', () => {
      const project = {
        id: 'future',
        name: 'Futuro',
        _schemaVersion: 99,
        tasks: [],
      };
      // Não deve lançar erro
      const result = migrateProject(project);
      expect(result._schemaVersion as number).toBe(99);
    });
  });

  describe('migrateProjects', () => {
    it('migra múltiplos projetos', () => {
      const projects = [
        { id: 'p1', name: 'P1', tasks: [] },
        { id: 'p2', name: 'P2', tasks: [], _schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION },
      ];
      const result = migrateProjects(projects);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p2');
    });
  });
});
