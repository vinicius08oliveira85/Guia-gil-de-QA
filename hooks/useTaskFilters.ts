import { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Project, JiraTask, TaskTestStatus, TestCase } from '../types';
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

export type TestCaseExecutionStatus = TestCase['status'];

export interface UseTaskFiltersOptions {
    /**
     * Incrementado ao navegar do Dashboard (ou outro lugar) para aplicar
     * `executionStatusNavStatuses` uma vez na aba Tarefas.
     */
    executionStatusNavKey?: number;
    executionStatusNavStatuses?: TestCaseExecutionStatus[];
}

export interface UseTaskFiltersResult {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
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
        caseExecution: (status: TestCaseExecutionStatus) => number;
    };
    testCaseExecutionStatusFilter: TestCaseExecutionStatus[];
    setTestCaseExecutionStatusFilter: (
        v: TestCaseExecutionStatus[] | ((prev: TestCaseExecutionStatus[]) => TestCaseExecutionStatus[])
    ) => void;
    activeFiltersCount: number;
    clearAllFilters: () => void;
    statusOptions: string[];
    priorityOptions: string[];
}

export function useTaskFilters(project: Project, options?: UseTaskFiltersOptions): UseTaskFiltersResult {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [testStatusFilter, setTestStatusFilter] = useState<TaskTestStatus[]>([]);
    const [testCaseExecutionStatusFilter, setTestCaseExecutionStatusFilter] = useState<TestCaseExecutionStatus[]>([]);
    const [qualityFilter, setQualityFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<TaskSortBy>('id');
    const [groupBy, setGroupBy] = useState<TaskGroupBy>('none');
    const filtersRestoredForProjectRef = useRef<string | null>(null);
    const lastExecutionStatusNavKeyRef = useRef(0);

    const statusOptions = useMemo(() => getStatusFilterOptions(project), [project]);
    const priorityOptions = useMemo(() => getPriorityFilterOptions(project), [project]);

    useLayoutEffect(() => {
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
                    if (Array.isArray(data.testCaseExecutionStatusFilter)) {
                        const allowed: TestCaseExecutionStatus[] = ['Not Run', 'Passed', 'Failed', 'Blocked'];
                        const parsed = (data.testCaseExecutionStatusFilter as string[]).filter((x): x is TestCaseExecutionStatus =>
                            (allowed as string[]).includes(x)
                        );
                        setTestCaseExecutionStatusFilter(parsed);
                    }
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
        lastExecutionStatusNavKeyRef.current = 0;
    }, [project?.id]);

    useEffect(() => {
        const navKey = options?.executionStatusNavKey ?? 0;
        if (navKey <= 0 || navKey === lastExecutionStatusNavKeyRef.current) return;
        lastExecutionStatusNavKeyRef.current = navKey;
        const statuses = options?.executionStatusNavStatuses;
        if (statuses && statuses.length > 0) {
            setTestCaseExecutionStatusFilter(statuses);
        }
    }, [options?.executionStatusNavKey, options?.executionStatusNavStatuses]);

    useEffect(() => {
        if (!project?.id || filtersRestoredForProjectRef.current !== project.id) return;
        const key = `${TASKS_FILTERS_STORAGE_KEY}_${project.id}`;
        const payload = {
            statusFilter,
            priorityFilter,
            typeFilter,
            testStatusFilter,
            testCaseExecutionStatusFilter,
            qualityFilter,
            searchQuery,
            sortBy,
            groupBy,
        };
        localStorage.setItem(key, JSON.stringify(payload));
    }, [project?.id, statusFilter, priorityFilter, typeFilter, testStatusFilter, testCaseExecutionStatusFilter, qualityFilter, searchQuery, sortBy, groupBy]);

    const filteredTasks = useMemo(() => {
        const tasks = project?.tasks ?? [];
        const searchTrim = searchQuery.trim();
        return tasks.filter(task => {
            if (searchTrim) {
                const query = searchTrim.toLowerCase();
                const matchesId = (task.id || '').toLowerCase().includes(query);
                const matchesTitle = (task.title || '').toLowerCase().includes(query);
                if (!matchesId && !matchesTitle) return false;
            }
            
            if (statusFilter.length > 0) {
                if (!statusFilter.some(name => taskMatchesStatusName(task, name, project))) return false;
            }
            
            if (priorityFilter.length > 0) {
                if (!priorityFilter.some(name => taskMatchesPriorityName(task, name, project))) return false;
            }
            if (typeFilter.length > 0 && !typeFilter.includes(task.type)) return false;
            if (testStatusFilter.length > 0 && !testStatusFilter.includes(getEffectiveTestStatus(task, project.tasks))) return false;
            if (
                testCaseExecutionStatusFilter.length > 0 &&
                !testCaseExecutionStatusFilter.some((st) => (task.testCases || []).some((tc) => tc.status === st))
            ) {
                return false;
            }
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
    }, [project, project.tasks, searchQuery, statusFilter, priorityFilter, typeFilter, testStatusFilter, testCaseExecutionStatusFilter, qualityFilter]);

    const counts = useMemo(() => {
        const allTasks = project.tasks ?? [];
        return {
            status: (statusName: string) => allTasks.filter(t => taskMatchesStatusName(t, statusName, project)).length,
            priority: (priorityName: string) => allTasks.filter(t => taskMatchesPriorityName(t, priorityName, project)).length,
            type: (type: string) => allTasks.filter(t => t.type === type).length,
            testStatus: (status: TaskTestStatus) => allTasks.filter(t => getEffectiveTestStatus(t, allTasks) === status).length,
            caseExecution: (status: TestCaseExecutionStatus) =>
                allTasks.filter(t => (t.testCases || []).some(tc => tc.status === status)).length,
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

    const chipFiltersCount =
        statusFilter.length +
        priorityFilter.length +
        typeFilter.length +
        testStatusFilter.length +
        testCaseExecutionStatusFilter.length +
        qualityFilter.length;

    const activeFiltersCount = chipFiltersCount + (searchQuery.trim() ? 1 : 0);

    const clearAllFilters = useCallback(() => {
        setStatusFilter([]);
        setPriorityFilter([]);
        setTypeFilter([]);
        setTestStatusFilter([]);
        setTestCaseExecutionStatusFilter([]);
        setQualityFilter([]);
        setSearchQuery('');
        setSortBy('id');
        setGroupBy('none');
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        typeFilter,
        setTypeFilter,
        testStatusFilter,
        setTestStatusFilter,
        testCaseExecutionStatusFilter,
        setTestCaseExecutionStatusFilter,
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
