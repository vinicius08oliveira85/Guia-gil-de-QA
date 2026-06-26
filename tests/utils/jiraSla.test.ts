import { describe, expect, it } from 'vitest';
import {
  classifyJiraSlaDisplay,
  classifyTaskSlaFromJiraSlas,
  formatJiraSlaChipLabel,
  getJiraSlaShortName,
  getJiraSlaToneClass,
} from '../../utils/jiraSla';
import { classifyTaskSla } from '../../utils/jiraFilasMetrics';
import type { JiraTask, JiraTaskSla } from '../../types';
import { normalizeJiraSlaApiItem } from '../../services/jira/sla';

const NOW = new Date('2026-06-26T12:00:00.000Z').getTime();

function makeSla(overrides: Partial<JiraTaskSla>): JiraTaskSla {
  return {
    name: 'Time to resolution',
    phase: 'ongoing',
    breached: false,
    ...overrides,
  };
}

describe('jiraSla utils', () => {
  it('normaliza SLA em andamento da API', () => {
    const sla = normalizeJiraSlaApiItem({
      name: 'Time to first response',
      ongoingCycle: {
        breached: false,
        breachTime: { iso8601: '2026-07-06T14:03:00.000Z' },
        goalDuration: { friendly: '12h' },
      },
    });

    expect(sla.name).toBe('Time to first response');
    expect(sla.phase).toBe('ongoing');
    expect(sla.breached).toBe(false);
    expect(sla.deadlineAt).toBe('2026-07-06T14:03:00.000Z');
    expect(sla.goalFriendly).toBe('em até 12h');
  });

  it('normaliza SLA concluído atendido', () => {
    const sla = normalizeJiraSlaApiItem({
      name: 'Time to first response',
      completedCycles: [
        {
          breached: false,
          stopTime: { iso8601: '2026-06-24T15:38:00.000Z' },
          goalDuration: { friendly: '12h' },
        },
      ],
    });

    expect(sla.phase).toBe('completed');
    expect(sla.breached).toBe(false);
    expect(classifyJiraSlaDisplay(sla, NOW)).toBe('met');
    expect(getJiraSlaToneClass('met')).toBe('text-success');
  });

  it('classifica SLA estourado em andamento', () => {
    const sla = makeSla({
      breached: true,
      deadlineAt: '2026-06-25T10:00:00.000Z',
    });
    expect(classifyJiraSlaDisplay(sla, NOW)).toBe('breached');
    expect(getJiraSlaToneClass('breached')).toBe('text-error');
  });

  it('classifica SLA em risco pela data limite', () => {
    const sla = makeSla({
      deadlineAt: '2026-06-27T00:00:00.000Z',
    });
    expect(classifyJiraSlaDisplay(sla, NOW, 48)).toBe('atRisk');
  });

  it('usa nomes curtos nos chips', () => {
    expect(getJiraSlaShortName('Time to resolution')).toBe('Resolução');
    const label = formatJiraSlaChipLabel(
      makeSla({ deadlineAt: '2026-07-06T14:03:00.000Z' }),
      'onTrack'
    );
    expect(label).toContain('Resolução:');
  });

  it('classifyTaskSla prioriza SLAs do Jira sobre dueDate', () => {
    const task: JiraTask = {
      id: 'SUS-1',
      title: 'Teste',
      description: '',
      status: 'In Progress',
      testCases: [],
      type: 'Tarefa',
      dueDate: '2026-07-10T00:00:00.000Z',
      jiraSlas: [
        makeSla({
          breached: true,
          deadlineAt: '2026-06-25T00:00:00.000Z',
        }),
      ],
    };

    expect(classifyTaskSlaFromJiraSlas(task.jiraSlas!, NOW)).toBe('overdue');
    expect(classifyTaskSla(task, NOW)).toBe('overdue');
  });
});
