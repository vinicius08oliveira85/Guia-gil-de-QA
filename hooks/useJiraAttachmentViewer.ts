import { useState, useCallback } from 'react';
import { getJiraConfig } from '../services/jiraService';
import { detectFileType } from '../services/fileViewerService';

export type JiraAttachmentView = {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    content?: string;
};

export function useJiraAttachmentViewer() {
    const [viewingJiraAttachment, setViewingJiraAttachment] = useState<JiraAttachmentView | null>(null);
    const [loadingJiraAttachmentId, setLoadingJiraAttachmentId] = useState<string | null>(null);

    const handleViewJiraAttachment = useCallback(async (
        attachment: { id: string; filename: string; url: string; mimeType?: string }
    ) => {
        const isImage = detectFileType(attachment.filename, attachment.mimeType || '') === 'image';
        setLoadingJiraAttachmentId(attachment.id);
        try {
            const jiraConfig = getJiraConfig();
            if (!jiraConfig) {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment, mimeType: attachment.mimeType ?? '' });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
                return;
            }

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

            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setViewingJiraAttachment({
                        ...attachment,
                        mimeType: attachment.mimeType ?? '',
                        content: reader.result as string,
                    });
                    setLoadingJiraAttachmentId(null);
                };
                reader.readAsDataURL(blob);
            } else {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment, mimeType: attachment.mimeType ?? '' });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
            }
        } catch {
            if (isImage) {
                setViewingJiraAttachment({ ...attachment, mimeType: attachment.mimeType ?? '' });
            } else {
                window.open(attachment.url, '_blank');
            }
            setLoadingJiraAttachmentId(null);
        }
    }, []);

    return {
        viewingJiraAttachment,
        setViewingJiraAttachment,
        loadingJiraAttachmentId,
        handleViewJiraAttachment,
    };
}
