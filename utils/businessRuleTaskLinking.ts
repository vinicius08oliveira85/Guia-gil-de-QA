import type { BusinessRule, JiraTask, Project } from '../types';

/** Verifica vínculo bidirecional entre task e regra. */
export function isBusinessRuleLinkedToTask(task: JiraTask, rule: BusinessRule): boolean {
  return (
    (task.linkedBusinessRuleIds ?? []).includes(rule.id) ||
    (rule.linkedTaskIds ?? []).includes(task.id)
  );
}

/** Resolve ids de regras vinculadas à task (direto + reverso na regra). */
export function getLinkedBusinessRuleIdsForTask(task: JiraTask, project: Project): string[] {
  const ids = new Set(task.linkedBusinessRuleIds ?? []);
  for (const rule of project.businessRules ?? []) {
    if ((rule.linkedTaskIds ?? []).includes(task.id)) {
      ids.add(rule.id);
    }
  }
  return [...ids];
}

/** Indica se a regra entra no prompt por categoria vinculada na task (legado). */
export function isBusinessRuleCoveredByTaskCategory(task: JiraTask, rule: BusinessRule): boolean {
  const categories = new Set(
    (task.linkedBusinessRuleCategories ?? []).map(c => String(c).trim()).filter(Boolean)
  );
  if (categories.size === 0) return false;
  return categories.has((rule.category ?? '').trim());
}

/**
 * Vincula ou desvincula uma regra da task (sincroniza linkedTaskIds na regra).
 */
export function toggleBusinessRuleTaskLink(
  project: Project,
  taskId: string,
  ruleId: string,
  linked: boolean
): Project {
  const rule = project.businessRules.find(r => r.id === ruleId);
  if (!rule) return project;

  const linkedTaskIds = new Set(rule.linkedTaskIds ?? []);
  if (linked) {
    linkedTaskIds.add(taskId);
  } else {
    linkedTaskIds.delete(taskId);
  }

  return applyBusinessRuleTaskLinks(project, ruleId, [...linkedTaskIds]);
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
    const { linkedBusinessRuleIds: _prev, ...taskRest } = task;
    return {
      ...taskRest,
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
    const { linkedBusinessRuleIds: _prev, ...taskRest } = task;
    return {
      ...taskRest,
      ...(next.length > 0 ? { linkedBusinessRuleIds: next } : {}),
    };
  });

  return { ...project, businessRules, tasks };
}

export function getTasksForBusinessRule(project: Project, rule: BusinessRule): JiraTask[] {
  const ids = new Set(rule.linkedTaskIds ?? []);
  return project.tasks.filter(t => ids.has(t.id));
}
