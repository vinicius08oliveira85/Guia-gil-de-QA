import { getJiraConfig } from '../services/jiraService';

export interface JiraAttachmentInput {
    id: string;
    filename: string;
    url: string;
    mimeType?: string;
}

/**
 * Busca o conteúdo de um anexo do Jira via proxy e retorna como data URL (para exibir em img, etc.).
 * Retorna null se não houver config Jira ou se o fetch falhar.
 */
export async function fetchJiraAttachmentAsDataUrl(attachment: JiraAttachmentInput): Promise<string | null> {
    const jiraConfig = getJiraConfig();
    if (!jiraConfig) return null;

    const endpoint = `/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
    const response = await fetch('/api/jira-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: jiraConfig.url,
            email: jiraConfig.email,
            apiToken: jiraConfig.apiToken,
            endpoint,
            method: 'GET',
        }),
    });

    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
    });
}
