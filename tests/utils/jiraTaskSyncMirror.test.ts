import { describe, it, expect } from 'vitest';
import type { JiraTask, Project } from '../../types';
import {
  alignTaskStatusesFromJira,
  mergeJiraSyncedTaskFields,
} from '../../utils/jiraTaskSyncMirror';
import { propagateJiraTaskUpdatesToLinkedProjects } from '../../utils/jiraCrossProjectSync';

describe('jiraTaskSyncMirror', () => {
  it('alinha status interno com jiraStatus', () => {
    const tasks: JiraTask[] = [
      {
        id: 'SIS-1',
        title: 'T',
        description: '',
        type: 'Tarefa',
        status: 'To Do',
        jiraStatus: 'Concluído',
        testCases: [],
      },
    ];

    const { tasks: aligned, correctedCount } = alignTaskStatusesFromJira(tasks);
    expect(correctedCount).toBe(1);
    expect(aligned[0].status).toBe('Done');
  });

  it('preserva guia Dev ao espelhar campos Jira', () => {
    const local: JiraTask = {
      id: 'SIS-2',
      title: 'Old',
      description: '',
      type: 'Tarefa',
      status: 'In Progress',
      jiraStatus: 'Em Andamento',
      testCases: [],
      devGuidance: {
        overview: 'Guia',
        prerequisites: [],
        implementationSteps: [],
        cursorAgentMasterPrompt: 'prompt',
      },
    };
    const synced: JiraTask = {
      ...local,
      title: 'New title',
      jiraStatus: 'Concluído',
      status: 'Done',
    };

    const merged = mergeJiraSyncedTaskFields(local, synced);
    expect(merged.title).toBe('New title');
    expect(merged.jiraStatus).toBe('Concluído');
    expect(merged.devGuidance?.overview).toBe('Guia');
  });
});

describe('jiraCrossProjectSync', () => {
  it('propaga status Jira para projeto vinculado com mesma issue', () => {
    const sharedTask: JiraTask = {
      id: 'SIS-10',
      title: 'Shared',
      description: '',
      type: 'Tarefa',
      status: 'In Progress',
      jiraStatus: 'Em Andamento',
      testCases: [],
    };

    const devProject: Project = {
      id: 'dev-1',
      name: 'Dev',
      description: '',
      workflow: 'dev',
      tasks: [{ ...sharedTask }],
      documents: [],
      businessRules: [],
      phases: [],
    };

    const qaProject: Project = {
      id: 'qa-1',
      name: 'QA',
      description: '',
      workflow: 'qa',
      tasks: [{ ...sharedTask }],
      documents: [],
      businessRules: [],
      phases: [],
    };

    const syncedDev: Project = {
      ...devProject,
      tasks: [
        {
          ...sharedTask,
          jiraStatus: 'Concluído',
          status: 'Done',
        },
      ],
    };

    const merged = propagateJiraTaskUpdatesToLinkedProjects(syncedDev, [qaProject, syncedDev]);
    const qaUpdated = merged.find(p => p.id === 'qa-1');
    expect(qaUpdated?.tasks[0].jiraStatus).toBe('Concluído');
    expect(qaUpdated?.tasks[0].status).toBe('Done');
  });
});
