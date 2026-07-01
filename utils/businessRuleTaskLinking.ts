import type { BusinessRule, JiraTask, Project } from '../types';

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
