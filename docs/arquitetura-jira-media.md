# Arquitetura de Tratamento de Mídia do Jira

## Visão Geral

Esta arquitetura foi projetada para abstrair a lógica de tratamento de anexos e renderização de conteúdo do Jira de forma escalável, segura e modular.

## Componentes Principais

### 1. Serviço de Mídia (`services/jiraMediaService.ts`)

**Responsabilidades:**

- Detecção automática de tipos de mídia (imagem, PDF, documento, etc)
- Resolução segura de URLs de anexos do Jira
- Gerenciamento de cache de URLs
- Validação de URLs do Jira

**Padrão:** Singleton para garantir uma única instância

**Uso:**

```typescript
import { jiraMediaService } from '../services/jiraMediaService';

const mediaType = jiraMediaService.detectMediaType(filename, mimeType);
const mediaInfo = jiraMediaService.getMediaInfo(attachment, jiraUrl);
```

### 2. Hook de Mídia (`hooks/useJiraMedia.ts`)

**Responsabilidades:**

- Abstrair lógica de carregamento de mídia com autenticação
- Gerenciar estado de loading, erro e sucesso
- Usar proxy do Jira quando necessário
- Limpar recursos (blob URLs) automaticamente

**Uso:**

```typescript
const { objectUrl, loading, error, mediaInfo } = useJiraMedia(attachmentId, filename, size);
```

### 3. Componente Polimórfico (`components/common/FilePreview.tsx`)

**Responsabilidades:**

- Decidir automaticamente como renderizar baseado no tipo de mídia
- Renderizar preview de imagens ou ícones para outros tipos
- Gerenciar estados de loading e erro
- Preparado para extensão com novos tipos de visualizadores

**Uso:**

```typescript
<FilePreview
    attachmentId={id}
    filename={filename}
    size={size}
    mediaType="image"
/>
```

### 4. Sanitizador de Conteúdo (`utils/jiraContentSanitizer.ts`)

**Responsabilidades:**

- Sanitizar HTML do Jira de forma segura
- Processar imagens embutidas (Markdown e ADF)
- Extrair URLs de imagens
- Prevenir XSS e conteúdo malicioso

**Uso:**

```typescript
const sanitized = JiraContentSanitizer.sanitize(html, {
  allowImages: true,
  processJiraImages: true,
  jiraAttachments,
  jiraUrl,
});
```

### 5. Visualizador de Mídia (`components/common/MediaViewer.tsx`)

**Responsabilidades:**

- Modal para visualização de mídia em tela cheia
- Preparado para suportar diferentes visualizadores (PDF, documentos, etc)
- Gerenciar ações (download, abrir externo)

**Uso:**

```typescript
<MediaViewer
    attachmentId={id}
    filename={filename}
    mediaType="pdf"
    isOpen={isOpen}
    onClose={handleClose}
/>
```

## Fluxo de Dados

```
Jira API
    ↓
jiraMediaService (detecta tipo, resolve URL)
    ↓
useJiraMedia (carrega com autenticação via proxy)
    ↓
FilePreview (renderiza baseado no tipo)
    ↓
UI (exibe preview ou ícone)
```

## Extensibilidade

### Adicionar Novo Tipo de Visualizador

1. **Adicionar tipo em `jiraMediaService.ts`:**

```typescript
export type MediaType = 'image' | 'pdf' | 'video' | 'audio' | ...;
```

2. **Atualizar detecção:**

```typescript
detectMediaType(filename: string, mimeType?: string): MediaType {
    // Adicionar lógica para novo tipo
}
```

3. **Criar componente de preview:**

```typescript
export const VideoPreview: React.FC<VideoPreviewProps> = ({ ... }) => {
    // Implementar preview de vídeo
};
```

4. **Atualizar FilePreview:**

```typescript
if (mediaType === 'video') {
    return <VideoPreview {...props} />;
}
```

### Adicionar Suporte a PDF Viewer

1. Instalar biblioteca (ex: `react-pdf` ou `pdf.js`)
2. Criar componente `PDFViewer.tsx`
3. Integrar em `MediaViewer.tsx`
4. Atualizar `FilePreview` para usar o novo visualizador

## Segurança

- **Sanitização:** Todo HTML é sanitizado antes de renderização
- **Autenticação:** URLs do Jira sempre passam pelo proxy autenticado
- **XSS Prevention:** Escape de caracteres HTML perigosos
- **CORS:** Requisições via proxy evitam problemas de CORS

## Performance

- **Lazy Loading:** Imagens carregam apenas quando visíveis
- **Cache:** URLs resolvidas são cacheadas
- **Cleanup:** Blob URLs são revogadas automaticamente
- **Intersection Observer:** Para lazy loading avançado

## Testes

Para testar a arquitetura:

1. **Teste de Detecção de Tipo:**

```typescript
const type = jiraMediaService.detectMediaType('document.pdf');
expect(type).toBe('pdf');
```

2. **Teste de Sanitização:**

```typescript
const sanitized = JiraContentSanitizer.sanitize('<script>alert("xss")</script>');
expect(sanitized.html).not.toContain('<script>');
```

3. **Teste de Hook:**

```typescript
const { result } = renderHook(() => useJiraMedia(id, filename));
expect(result.current.loading).toBe(true);
```

## Novas Funcionalidades Implementadas

### 1. Cache Persistente de Imagens (`services/imageCacheService.ts`)

**Responsabilidades:**

- Armazenar blobs de imagens em IndexedDB
- Gerenciar quota e limpeza automática (LRU)
- Cache com metadata (timestamp, tamanho, MIME type)
- Limpeza automática de entradas expiradas

**Uso:**

```typescript
import { imageCacheService } from '../services/imageCacheService';

// Obter do cache
const cached = await imageCacheService.get(url);
if (cached.fromCache) {
  // Usar blob do cache
}

// Salvar no cache
await imageCacheService.set(url, blob, mimeType);

// Estatísticas
const stats = await imageCacheService.getStats();
```

**Configuração:**

- Tamanho máximo: 100MB (padrão)
- Idade máxima: 7 dias (padrão)
- Máximo de entradas: 1000 (padrão)

### 2. Suporte a Thumbnails

**Implementação:**

- `jiraMediaService.getThumbnailUrl()` - Obtém URL de thumbnail do Jira
- `jiraMediaService.hasThumbnail()` - Verifica disponibilidade
- `useJiraMedia` carrega thumbnail primeiro, depois imagem completa
- `FilePreview` exibe thumbnail inicialmente, carrega imagem completa ao hover/clique

**Uso:**

```typescript
const thumbnailUrl = jiraMediaService.getThumbnailUrl(
  attachmentId,
  filename,
  jiraUrl,
  200, // width
  200 // height
);

const { thumbnailUrl, loadingThumbnail } = useJiraMedia(id, filename, size, {
  includeThumbnail: true,
});
```

### 3. PDF Viewer (`components/common/PDFViewer.tsx`)

**Funcionalidades:**

- Visualização de PDFs com `react-pdf`
- Navegação de páginas (anterior/próxima)
- Controles de zoom (50% - 300%)
- Rotação (0°, 90°, 180°, 270°)
- Download e abrir externo
- Renderização de texto e anotações

**Uso:**

```typescript
<PDFViewer
    url={pdfUrl}
    filename="document.pdf"
    onDownload={handleDownload}
    onOpenExternal={handleOpenExternal}
/>
```

**Integração:**

- Integrado em `MediaViewer` para visualização em modal
- Suporta PDFs do Jira via proxy autenticado

### 4. Video Viewer (`components/common/VideoViewer.tsx`)

**Funcionalidades:**

- Player de vídeo com controles customizados
- Play/Pause
- Controle de volume e mute
- Tela cheia
- Download e abrir externo

**Uso:**

```typescript
<VideoViewer
    url={videoUrl}
    filename="video.mp4"
    mimeType="video/mp4"
    onDownload={handleDownload}
    onOpenExternal={handleOpenExternal}
/>
```

### 5. Audio Viewer (`components/common/AudioViewer.tsx`)

**Funcionalidades:**

- Player de áudio completo
- Play/Pause
- Barra de progresso com seek
- Controle de volume e mute
- Exibição de tempo atual e duração total
- Download e abrir externo

**Uso:**

```typescript
<AudioViewer
    url={audioUrl}
    filename="audio.mp3"
    mimeType="audio/mpeg"
    onDownload={handleDownload}
    onOpenExternal={handleOpenExternal}
/>
```

### 6. Testes Unitários

**Cobertura:**

- ✅ `tests/services/jiraMediaService.test.ts` - Detecção de tipos, resolução de URLs, cache
- ✅ `tests/hooks/useJiraMedia.test.ts` - Carregamento, estados, cleanup
- ✅ `tests/utils/jiraContentSanitizer.test.ts` - Sanitização, processamento de imagens, XSS
- ✅ `tests/components/common/FilePreview.test.tsx` - Renderização, interações, estados
- ✅ `tests/components/common/MediaViewer.test.tsx` - Modal, renderização de tipos, ações

**Executar testes:**

```bash
npm test
npm run test:coverage
```

## Fluxo de Dados Atualizado

```
Jira API
    ↓
jiraMediaService (detecta tipo, resolve URL, obtém thumbnail)
    ↓
imageCacheService (verifica cache persistente)
    ↓
useJiraMedia (carrega thumbnail primeiro, depois imagem completa via proxy)
    ↓
FilePreview (renderiza thumbnail, carrega imagem completa ao hover)
    ↓
MediaViewer (visualização em modal com PDFViewer/VideoViewer/AudioViewer)
    ↓
UI (exibe preview ou visualizador completo)
```

## Performance

- **Cache Persistente:** Imagens são cacheadas em IndexedDB para carregamento instantâneo
- **Thumbnails:** Carregamento rápido com thumbnails, imagem completa sob demanda
- **Lazy Loading:** Imagens carregam apenas quando visíveis
- **Cleanup Automático:** Cache LRU remove entradas antigas automaticamente
- **Blob URLs:** Gerenciamento automático de memória

## Segurança

- **Sanitização:** Todo HTML é sanitizado antes de renderização
- **Autenticação:** URLs do Jira sempre passam pelo proxy autenticado
- **XSS Prevention:** Escape de caracteres HTML perigosos
- **CORS:** Requisições via proxy evitam problemas de CORS
- **Cache Seguro:** Blobs são armazenados localmente, não expostos

## Próximos Passos

- [ ] Implementar visualização de documentos Word/Excel
- [ ] Adicionar suporte a streaming de vídeo
- [ ] Implementar cache offline com Service Worker
- [ ] Adicionar métricas de performance do cache
- [ ] Criar testes de integração end-to-end
