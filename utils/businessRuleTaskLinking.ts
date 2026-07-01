import type { BusinessRule, JiraTask, Project } from '../types';

/** Resolve ids de regras vinculadas à task (direto e via rule.linkedTaskIds). */
export function getLinkedBusinessRuleIdsForTask(
  project: Project,
  task: Pick<JiraTask, 'id' | 'linkedBusinessRuleIds'>
): string[] {
  const ids = new Set(task.linkedBusinessRuleIds ?? []);
  for (const rule of project.businessRules ?? []) {
    if ((rule.linkedTaskIds ?? []).includes(task.id)) {
      ids.add(rule.id);
    }
  }
  return [...ids];
}

export function isTaskLinkedToBusinessRule(
  project: Project,
  taskId: string,
  ruleId: string
): boolean {
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return false;
  return getLinkedBusinessRuleIdsForTask(project, task).includes(ruleId);
}

/** Vincula task à regra (bidirecional). A regra permanece no projeto. */
export function linkTaskToBusinessRule(
  project: Project,
  taskId: string,
  ruleId: string
): Project {
  const rule = project.businessRules.find(r => r.id === ruleId);
  if (!rule) return project;

  const linkedTaskIds = new Set(rule.linkedTaskIds ?? []);
  linkedTaskIds.add(taskId);
  return applyBusinessRuleTaskLinks(project, ruleId, [...linkedTaskIds]);
}

/** Desvincula task da regra (bidirecional). A regra permanece no projeto. */
export function unlinkTaskFromBusinessRule(
  project: Project,
  taskId: string,
  ruleId: string
): Project {
  const rule = project.businessRules.find(r => r.id === ruleId);
  if (!rule) {
    const tasks = project.tasks.map(task => {
      if (task.id !== taskId) return task;
      const next = (task.linkedBusinessRuleIds ?? []).filter(id => id !== ruleId);
      if (next.length === 0) {
        const { linkedBusinessRuleIds: _removed, ...rest } = task;
        return rest as JiraTask;
      }
      return { ...task, linkedBusinessRuleIds: next };
    });
    return { ...project, tasks };
  }

  const linkedTaskIds = (rule.linkedTaskIds ?? []).filter(id => id !== taskId);
  return applyBusinessRuleTaskLinks(project, ruleId, linkedTaskIds);
}

/**
 * Sincroniza vínculos bidirecionais entre regra e tasks.
 */
export function applyBusinessRuleTaskLinks(
  project: Project,
  ruleId: string,
  linkedTaskIds: string[]
): Project {
  const linkedSet = new Set(linkedTaskIds);
  const rules = project.businessRules.map(rule => {
    if (rule.id !== ruleId) return rule;
    return { ...rule, linkedTaskIds: [...linkedSet] };
  });

  const tasks = project.tasks.map(task => {
    const current = new Set(task.linkedBusinessRuleIds ?? []);
    const wasLinked = current.has(ruleId);
    const shouldLink = linkedSet.has(task.id);

    if (wasLinked && !shouldLink) {
      current.delete(ruleId);
    } else if (!wasLinked && shouldLink) {
      current.add(ruleId);
    } else {
      return task;
    }

    const linkedBusinessRuleIds = [...current];
    return {
      ...task,
      ...(linkedBusinessRuleIds.length > 0 ? { linkedBusinessRuleIds } : {}),
    };
  });

  return { ...project, businessRules: rules, tasks };
}

export function removeBusinessRuleFromProject(
  project: Project,
  ruleId: string
): Project {
  const rule = project.businessRules.find(r => r.id === ruleId);
  if (!rule) return project;

  const linkedIds = new Set(rule.linkedTaskIds ?? []);
  const businessRules = project.businessRules.filter(r => r.id !== ruleId);
  const tasks = project.tasks.map(task => {
    if (!linkedIds.has(task.id) && !(task.linkedBusinessRuleIds ?? []).includes(ruleId)) {
      return task;
    }
    const next = (task.linkedBusinessRuleIds ?? []).filter(id => id !== ruleId);
    return {
      ...task,
      ...(next.length > 0 ? { linkedBusinessRuleIds: next } : {}),
    };
  });

  return { ...project, businessRules, tasks };
}

export function getTasksForBusinessRule(project: Project, rule: BusinessRule): JiraTask[] {
  const ids = new Set(rule.linkedTaskIds ?? []);
  return project.tasks.filter(t => ids.has(t.id));
}
