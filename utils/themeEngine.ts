import { ThemePreferences } from '../types';
import { getThemePreferences as getThemePrefs } from './preferencesService';

let previewStyleElement: HTMLStyleElement | null = null;

export const getThemePreferences = getThemePrefs;

export const applyThemePreview = (preferences: ThemePreferences): void => {
    if (!previewStyleElement) {
        previewStyleElement = document.createElement('style');
        previewStyleElement.id = 'theme-preview';
        document.head.appendChild(previewStyleElement);
    }

    let css = ':root, .dark, .light {';

    // Only apply custom colors if they are set (don't override base theme variables)
    if (preferences.customColors) {
        if (preferences.customColors.accent) {
            css += `--accent-color: ${preferences.customColors.accent};`;
            css += `--accent-light: ${adjustColorBrightness(preferences.customColors.accent, 20)};`;
            css += `--accent-dark: ${adjustColorBrightness(preferences.customColors.accent, -20)};`;
        }
        if (preferences.customColors.primary) {
            css += `--primary-color: ${preferences.customColors.primary};`;
        }
        // Only override base theme colors if custom colors are explicitly set
        if (preferences.customColors.background) {
            css += `--bg-color: ${preferences.customColors.background};`;
        }
        if (preferences.customColors.surface) {
            css += `--surface-color: ${preferences.customColors.surface};`;
        }
        if (preferences.customColors.textPrimary) {
            css += `--text-primary: ${preferences.customColors.textPrimary};`;
        }
        if (preferences.customColors.textSecondary) {
            css += `--text-secondary: ${preferences.customColors.textSecondary};`;
        }
    }

    // Apply spacing (using CSS variables)
    if (preferences.spacing !== 1) {
        css += `--spacing-multiplier: ${preferences.spacing};`;
    }

    // Apply border radius
    if (preferences.borderRadius !== 6) {
        css += `--border-radius: ${preferences.borderRadius}px;`;
    }

    css += '}';

    // Apply contrast and font size to body/html (not to root variables)
    if (preferences.contrast !== 100 || preferences.fontSize !== 1 || preferences.opacity !== 100) {
        css += 'html {';
        if (preferences.contrast !== 100) {
            css += `filter: contrast(${preferences.contrast}%);`;
        }
        if (preferences.fontSize !== 1) {
            css += `font-size: ${preferences.fontSize}rem;`;
        }
        if (preferences.opacity !== 100) {
            css += `opacity: ${preferences.opacity / 100};`;
        }
        css += '}';
    }

    // Apply spacing multiplier to common spacing classes
    css += `
        .p-1 { padding: calc(0.25rem * var(--spacing-multiplier, 1)); }
        .p-2 { padding: calc(0.5rem * var(--spacing-multiplier, 1)); }
        .p-3 { padding: calc(0.75rem * var(--spacing-multiplier, 1)); }
        .p-4 { padding: calc(1rem * var(--spacing-multiplier, 1)); }
        .p-6 { padding: calc(1.5rem * var(--spacing-multiplier, 1)); }
        .m-1 { margin: calc(0.25rem * var(--spacing-multiplier, 1)); }
        .m-2 { margin: calc(0.5rem * var(--spacing-multiplier, 1)); }
        .m-3 { margin: calc(0.75rem * var(--spacing-multiplier, 1)); }
        .m-4 { margin: calc(1rem * var(--spacing-multiplier, 1)); }
        .m-6 { margin: calc(1.5rem * var(--spacing-multiplier, 1)); }
        .gap-2 { gap: calc(0.5rem * var(--spacing-multiplier, 1)); }
        .gap-3 { gap: calc(0.75rem * var(--spacing-multiplier, 1)); }
        .gap-4 { gap: calc(1rem * var(--spacing-multiplier, 1)); }
    `;

    previewStyleElement.textContent = css;
};

export const clearThemePreview = (): void => {
    if (previewStyleElement) {
        previewStyleElement.remove();
        previewStyleElement = null;
    }
};

export const applyTheme = (preferences: ThemePreferences): void => {
    applyThemePreview(preferences);
    // Theme is applied via CSS variables and will persist
};

const adjustColorBrightness = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

