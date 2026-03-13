import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Project, JiraTask, TaskTestStatus } from '../types';
import {
    getStatusFilterOptions,
    getPriorityFilterOptions,
    taskMatchesStatusName,
    taskMatchesPriorityName,
    getEffectiveTestStatus,
    getTaskComparator,
    type TaskSortBy,
    type TaskGroupBy,
} from '../components/tasks/tasksViewHelpers';

const TASKS_FILTERS_STORAGE_KEY = 'tasks_filters';

export interface UseTaskFiltersResult {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    debouncedSearchQuery: string;
    statusFilter: string[];
    setStatusFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    priorityFilter: string[];
    setPriorityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    typeFilter: string[];
    setTypeFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    testStatusFilter: TaskTestStatus[];
    setTestStatusFilter: (v: TaskTestStatus[] | ((prev: TaskTestStatus[]) => TaskTestStatus[])) => void;
    qualityFilter: string[];
    setQualityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    sortBy: TaskSortBy;
    setSortBy: (v: TaskSortBy) => void;
    groupBy: TaskGroupBy;
    setGroupBy: (v: TaskGroupBy) => void;
    filteredTasks: JiraTask[];
    counts: {
        status: (statusName: string) => number;
        priority: (priorityName: string) => number;
        type: (type: string) => number;
        testStatus: (status: TaskTestStatus) => number;
        quality: (type: string) => number;
    };
    activeFiltersCount: number;
    clearAllFilters: () => void;
    statusOptions: string[];
    priorityOptions: string[];
}

export function useTaskFilters(project: Project): UseTaskFiltersResult {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounceValue(searchQuery, 300);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [testStatusFilter, setTestStatusFilter] = useState<TaskTestStatus[]>([]);
    const [qualityFilter, setQualityFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<TaskSortBy>('id');
    const [groupBy, setGroupBy] = useState<TaskGroupBy>('none');
    const filtersRestoredForProjectRef = useRef<string | null>(null);

    const statusOptions = useMemo(() => getStatusFilterOptions(project), [project]);
    const priorityOptions = useMemo(() => getPriorityFilterOptions(project), [project]);

    useEffect(() => {
        if (!project?.id) return;
        const key = `${TASKS_FILTERS_STORAGE_KEY}_${project.id}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw) as Record<string, unknown>;
                if (data && typeof data === 'object') {
                    if (Array.isArray(data.statusFilter)) setStatusFilter(data.statusFilter as string[]);
                    if (Array.isArray(data.priorityFilter)) setPriorityFilter(data.priorityFilter as string[]);
                    if (Array.isArray(data.typeFilter)) setTypeFilter(data.typeFilter as string[]);
                    if (Array.isArray(data.testStatusFilter)) setTestStatusFilter(data.testStatusFilter as TaskTestStatus[]);
                    if (Array.isArray(data.qualityFilter)) setQualityFilter(data.qualityFilter as string[]);
                    if (typeof data.searchQuery === 'string') setSearchQuery(data.searchQuery);
                    if (typeof data.sortBy === 'string' && ['id', 'status', 'priority', 'createdAt', 'title'].includes(data.sortBy)) {
                        setSortBy(data.sortBy as TaskSortBy);
                    }
                    if (typeof data.groupBy === 'string' && ['none', 'status', 'priority', 'type'].includes(data.groupBy)) {
                        setGroupBy(data.groupBy as TaskGroupBy);
                    }
                }
            }
        } catch {
            // ignorar dados inválidos
        }
        filtersRestoredForProjectRef.current = project.id;
    }, [project?.id]);

    useEffect(() => {
        if (!project?.id || filtersRestoredForProjectRef.current !== project.id) return;
        const key = `${TASKS_FILTERS_STORAGE_KEY}_${project.id}`;
        const payload = {
            statusFilter,
            priorityFilter,
            typeFilter,
            testStatusFilter,
            qualityFilter,
            searchQuery,
            sortBy,
            groupBy,
        };
        localStorage.setItem(key, JSON.stringify(payload));
    }, [project?.id, statusFilter, priorityFilter, typeFilter, testStatusFilter, qualityFilter, searchQuery, sortBy, groupBy]);

    const filteredTasks = useMemo(() => {
        return project.tasks.filter(task => {
            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const matchesId = (task.id || '').toLowerCase().includes(query);
                const matchesTitle = (task.title || '').toLowerCase().includes(query);
                if (!matchesId && !matchesTitle) return false;
            }
            if (statusFilter.length > 0 && !statusFilter.some(name => taskMatchesStatusName(task, name, project))) return false;
            if (priorityFilter.length > 0 && !priorityFilter.some(name => taskMatchesPriorityName(task, name, project))) return false;
            if (typeFilter.length > 0 && !typeFilter.includes(task.type)) return false;
            if (testStatusFilter.length > 0 && !testStatusFilter.includes(getEffectiveTestStatus(task, project.tasks))) return false;
            if (qualityFilter.length > 0) {
                const hasBDD = task.bddScenarios && task.bddScenarios.length > 0;
                const hasTestCases = task.testCases && task.testCases.length > 0;
                const hasAutomated = task.testCases?.some(tc => tc.isAutomated);
                const hasManual = task.testCases?.some(tc => !tc.isAutomated);
                const matchesQuality = qualityFilter.some(filter => {
                    switch (filter) {
                        case 'with-bdd': return hasBDD;
                        case 'without-bdd': return !hasBDD;
                        case 'with-tests': return hasTestCases;
                        case 'without-tests': return !hasTestCases;
                        case 'automated': return hasAutomated;
                        case 'manual': return hasManual;
                        default: return false;
                    }
                });
                if (!matchesQuality) return false;
            }
            return true;
        });
    }, [project, project.tasks, debouncedSearchQuery, statusFilter, priorityFilter, typeFilter, testStatusFilter, qualityFilter]);

    const counts = useMemo(() => {
        const allTasks = project.tasks;
        return {
            status: (statusName: string) => allTasks.filter(t => taskMatchesStatusName(t, statusName, project)).length,
            priority: (priorityName: string) => allTasks.filter(t => taskMatchesPriorityName(t, priorityName, project)).length,
            type: (type: string) => allTasks.filter(t => t.type === type).length,
            testStatus: (status: TaskTestStatus) => allTasks.filter(t => getEffectiveTestStatus(t, allTasks) === status).length,
            quality: (type: string) => {
                switch (type) {
                    case 'with-bdd': return allTasks.filter(t => t.bddScenarios?.length).length;
                    case 'without-bdd': return allTasks.filter(t => !t.bddScenarios?.length).length;
                    case 'with-tests': return allTasks.filter(t => t.testCases?.length).length;
                    case 'without-tests': return allTasks.filter(t => !t.testCases?.length).length;
                    case 'automated': return allTasks.filter(t => t.testCases?.some(tc => tc.isAutomated)).length;
                    case 'manual': return allTasks.filter(t => t.testCases?.some(tc => !tc.isAutomated)).length;
                    default: return 0;
                }
            }
        };
    }, [project.tasks, project.settings?.jiraStatuses, project.settings?.jiraPriorities, project]);

    const activeFiltersCount = statusFilter.length + priorityFilter.length + typeFilter.length + testStatusFilter.length + qualityFilter.length;

    const clearAllFilters = useCallback(() => {
        setStatusFilter([]);
        setPriorityFilter([]);
        setTypeFilter([]);
        setTestStatusFilter([]);
        setQualityFilter([]);
        setSearchQuery('');
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        debouncedSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        typeFilter,
        setTypeFilter,
        testStatusFilter,
        setTestStatusFilter,
        qualityFilter,
        setQualityFilter,
        sortBy,
        setSortBy,
        groupBy,
        setGroupBy,
        filteredTasks,
        counts,
        activeFiltersCount,
        clearAllFilters,
        statusOptions,
        priorityOptions,
    };
}
