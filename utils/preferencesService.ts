import { UserPreferences, NotificationPreferences, KeyboardShortcutPreferences, ExportPreferences } from '../types';
import { logger } from './logger';

const STORAGE_KEY = 'qa_user_preferences';

// Default preferences
const defaultNotificationPreferences: NotificationPreferences = {
  bugCreated: true,
  testFailed: true,
  deadlineApproaching: true,
  taskAssigned: true,
  commentAdded: true,
  taskCompleted: true,
};

const defaultKeyboardShortcuts: KeyboardShortcutPreferences = {
  search: { key: 'k', ctrl: true },
  newProject: { key: 'n', ctrl: true },
  save: { key: 's', ctrl: true },
  focusSearch: { key: 'f', ctrl: true },
  closeModal: { key: 'Escape' },
};

const defaultExportPreferences: ExportPreferences = {
  defaultFormat: 'markdown',
  defaultIncludeMetrics: true,
  defaultIncludeTasks: true,
  defaultIncludeTestCases: true,
  templates: [],
};

const defaultPreferences: UserPreferences = {
  notifications: defaultNotificationPreferences,
  keyboardShortcuts: defaultKeyboardShortcuts,
  export: defaultExportPreferences,
};

type PreferencesUpdate = {
  notifications?: Partial<NotificationPreferences>;
  keyboardShortcuts?: Partial<KeyboardShortcutPreferences>;
  export?: Partial<ExportPreferences>;
};

export const getPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultPreferences;
    }
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all properties exist
    return {
      notifications: { ...defaultNotificationPreferences, ...parsed.notifications },
      keyboardShortcuts: { ...defaultKeyboardShortcuts, ...parsed.keyboardShortcuts },
      export: { ...defaultExportPreferences, ...parsed.export },
    };
  } catch (error) {
    logger.error('Error loading preferences', 'preferencesService', error);
    return defaultPreferences;
  }
};

export const savePreferences = (preferences: PreferencesUpdate): void => {
  try {
    const current = getPreferences();
    const updated = {
      ...current,
      ...preferences,
      notifications: { ...current.notifications, ...preferences.notifications },
      keyboardShortcuts: { ...current.keyboardShortcuts, ...preferences.keyboardShortcuts },
      export: { ...current.export, ...preferences.export },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: updated }));
  } catch (error) {
    logger.error('Error saving preferences', 'preferencesService', error);
  }
};

export const resetPreferences = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: defaultPreferences }));
  } catch (error) {
    logger.error('Error resetting preferences', 'preferencesService', error);
  }
};

export const getNotificationPreferences = (): NotificationPreferences => {
  return getPreferences().notifications;
};

export const getKeyboardShortcutPreferences = (): KeyboardShortcutPreferences => {
  return getPreferences().keyboardShortcuts;
};

export const getExportPreferences = (): ExportPreferences => {
  return getPreferences().export;
};

export const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>): void => {
  savePreferences({ notifications: prefs });
};

export const updateKeyboardShortcutPreferences = (prefs: Partial<KeyboardShortcutPreferences>): void => {
  savePreferences({ keyboardShortcuts: prefs });
};

export const updateExportPreferences = (prefs: Partial<ExportPreferences>): void => {
  savePreferences({ export: prefs });
};

