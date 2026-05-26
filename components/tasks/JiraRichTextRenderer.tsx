import React from 'react';
import { JiraAttachment } from './JiraAttachment';

interface JiraRichTextRendererProps {
  content: any; // Pode ser string (Markdown) ou Objeto (ADF)
  attachments?: Array<{ id?: string; filename: string; url: string; mimeType: string }>;
}

/**
 * Renderiza conteúdo rico do Jira (ADF ou Markdown simplificado).
 * Identifica imagens embutidas e as substitui pelo componente JiraAttachment.
 */
export const JiraRichTextRenderer: React.FC<JiraRichTextRendererProps> = ({
  content,
  attachments = [],
}) => {
  // Caso 1: Conteúdo é string (Markdown ou Texto simples)
  if (typeof content === 'string') {
    // Regex simples para encontrar padrão !imagem.png! do Jira
    const parts = content.split(/(![^!]+!)/g);

    return (
      <div className="prose prose-sm max-w-none text-[var(--leve-header-text)]">
        {parts.map((part, index) => {
          const imageMatch = part.match(/^!([^!]+)!$/);
          if (imageMatch) {
            const filename = imageMatch[1].split('|')[0]; // Remove parâmetros como |width=200
            const attachment = attachments.find(a => a.filename === filename);

            if (attachment) {
              return (
                <div key={index} className="my-2 inline-block">
                  <JiraAttachment
                    id={attachment.id ?? attachment.filename}
                    url={attachment.url}
                    filename={attachment.filename}
                    mimeType={attachment.mimeType}
                  />
                </div>
              );
            }
          }
          // Renderiza texto normal (aqui poderia entrar um parser de markdown completo)
          return (
            <span key={index} className="whitespace-pre-wrap">
              {part}
            </span>
          );
        })}
      </div>
    );
  }

  // Caso 2: Conteúdo é Objeto ADF (Atlassian Document Format)
  if (content && typeof content === 'object' && content.type === 'doc') {
    return (
      <div className="prose prose-sm max-w-none space-y-2 text-[var(--leve-header-text)]">
        {content.content?.map((node: any, index: number) => (
          <ADFNodeRenderer key={index} node={node} attachments={attachments} />
        ))}
      </div>
    );
  }

  return null;
};

// Renderizador Recursivo de Nós ADF
const ADFNodeRenderer: React.FC<{ node: any; attachments: any[] }> = ({ node, attachments }) => {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="my-1">
          {node.content?.map((child: any, i: number) => (
            <ADFNodeRenderer key={i} node={child} attachments={attachments} />
          )) || <br />}
        </p>
      );

    case 'text': {
      const text = node.text;
      let className = '';
      let href: string | undefined;
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === 'strong') className += ' font-bold';
          if (mark.type === 'em') className += ' italic';
          if (mark.type === 'code')
            className += ' rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] px-1 font-mono';
          if (mark.type === 'link') {
            href = mark.attrs?.href;
          }
        });
      }
      const content = <span className={className}>{text}</span>;
      if (href) {
        return (
          <a href={href} className="link link-primary" target="_blank" rel="noreferrer">
            {content}
          </a>
        );
      }
      return content;
    }

    case 'mediaSingle':
      return (
        <div className="my-3">
          {node.content?.map((child: any, i: number) => (
            <ADFNodeRenderer key={i} node={child} attachments={attachments} />
          ))}
        </div>
      );

    case 'media':
      // Tenta encontrar o anexo correspondente pelo ID ou coleção (lógica simplificada)
      // Em um cenário real, mapearíamos o 'id' do nó media para a URL do anexo
      return (
        <div className="text-xs italic text-[var(--leve-header-text-muted)]">
          [Mídia: {node.attrs?.id || 'Desconhecida'}]
        </div>
      );

    default:
      return null;
  }
};
