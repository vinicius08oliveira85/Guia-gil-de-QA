import { UserPreferences, NotificationPreferences, ThemePreferences, KeyboardShortcutPreferences, ExportPreferences } from '../types';

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

const defaultThemePreferences: ThemePreferences = {
  contrast: 100,
  fontSize: 1,
  spacing: 1,
  borderRadius: 6,
  opacity: 100,
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
  theme: defaultThemePreferences,
  keyboardShortcuts: defaultKeyboardShortcuts,
  export: defaultExportPreferences,
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
      theme: { ...defaultThemePreferences, ...parsed.theme },
      keyboardShortcuts: { ...defaultKeyboardShortcuts, ...parsed.keyboardShortcuts },
      export: { ...defaultExportPreferences, ...parsed.export },
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return defaultPreferences;
  }
};

export const savePreferences = (preferences: Partial<UserPreferences>): void => {
  try {
    const current = getPreferences();
    const updated = {
      ...current,
      ...preferences,
      notifications: { ...current.notifications, ...preferences.notifications },
      theme: { ...current.theme, ...preferences.theme },
      keyboardShortcuts: { ...current.keyboardShortcuts, ...preferences.keyboardShortcuts },
      export: { ...current.export, ...preferences.export },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: updated }));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

export const resetPreferences = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: defaultPreferences }));
  } catch (error) {
    console.error('Error resetting preferences:', error);
  }
};

export const getNotificationPreferences = (): NotificationPreferences => {
  return getPreferences().notifications;
};

export const getThemePreferences = (): ThemePreferences => {
  return getPreferences().theme;
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

export const updateThemePreferences = (prefs: Partial<ThemePreferences>): void => {
  savePreferences({ theme: prefs });
};

export const updateKeyboardShortcutPreferences = (prefs: Partial<KeyboardShortcutPreferences>): void => {
  savePreferences({ keyboardShortcuts: prefs });
};

export const updateExportPreferences = (prefs: Partial<ExportPreferences>): void => {
  savePreferences({ export: prefs });
};

