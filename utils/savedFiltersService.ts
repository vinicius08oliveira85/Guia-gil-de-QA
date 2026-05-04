import { TaskTestStatus, TestCase } from '../types';
import { type TaskSortBy, type TaskGroupBy } from '../components/tasks/tasksViewHelpers';

export interface SavedFilterPreset {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  filters: {
    statusFilter: string[];
    priorityFilter: string[];
    typeFilter: string[];
    testStatusFilter: TaskTestStatus[];
    testCaseExecutionStatusFilter?: TestCase['status'][];
    qualityFilter: string[];
    sortBy: TaskSortBy;
    groupBy: TaskGroupBy;
  };
}

const storageKey = (projectId: string) => `saved_filters_${projectId}`;

export function getSavedFilters(projectId: string): SavedFilterPreset[] {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFilter(
  projectId: string,
  name: string,
  filters: SavedFilterPreset['filters']
): SavedFilterPreset {
  const preset: SavedFilterPreset = {
    id: `sf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    projectId,
    createdAt: new Date().toISOString(),
    filters,
  };
  const existing = getSavedFilters(projectId);
  localStorage.setItem(storageKey(projectId), JSON.stringify([...existing, preset]));
  return preset;
}

export function deleteFilter(projectId: string, filterId: string): void {
  const existing = getSavedFilters(projectId);
  localStorage.setItem(
    storageKey(projectId),
    JSON.stringify(existing.filter(f => f.id !== filterId))
  );
}
