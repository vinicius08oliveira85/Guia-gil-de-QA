# Configuração PWA - QA Agile Guide

## Status

✅ PWA configurado e pronto para uso!

O aplicativo foi transformado em um Progressive Web App (PWA) instalável no Android.

## O que foi implementado

- ✅ Plugin `vite-plugin-pwa` instalado e configurado
- ✅ `manifest.json` criado com todas as configurações
- ✅ Service Worker configurado com estratégias de cache
- ✅ Meta tags PWA adicionadas no `index.html`
- ✅ Utilitários PWA criados (`utils/pwa.ts`)
- ✅ Componente de instalação criado (`InstallPWAButton`)
- ✅ Inicialização automática do PWA

## Gerar Ícones PWA

Os ícones são necessários para que o PWA funcione corretamente. Você precisa criar os seguintes arquivos na pasta `public/icons/`:

### Tamanhos necessários:

1. **icon-192x192.png** - Ícone padrão (192x192 pixels)
2. **icon-512x512.png** - Ícone grande para splash screen (512x512 pixels)
3. **icon-maskable-192x192.png** - Ícone maskable (192x192 pixels com padding de ~10%)
4. **icon-maskable-512x512.png** - Ícone maskable grande (512x512 pixels com padding de ~10%)

### Ferramentas para gerar ícones:

#### Opção 1: RealFaviconGenerator (Recomendado)
1. Acesse: https://realfavicongenerator.net/
2. Faça upload do logo (`public/logo@erasebg-transformed.png`)
3. Configure as opções:
   - Android Chrome: Ativado
   - Maskable icons: Ativado
4. Baixe o pacote gerado
5. Extraia os ícones para `public/icons/`

#### Opção 2: PWA Builder Image Generator
1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload do logo
3. Baixe os ícones gerados
4. Coloque em `public/icons/`

#### Opção 3: Maskable.app
1. Acesse: https://maskable.app/
2. Faça upload do logo
3. Ajuste o padding (recomendado: 10%)
4. Baixe os ícones maskable
5. Coloque em `public/icons/`

#### Opção 4: Manual (usando imagem existente)
Se o logo já estiver no tamanho correto, você pode:
1. Copiar `logo@erasebg-transformed.png` para `public/icons/icon-192x192.png`
2. Redimensionar para 512x512 e salvar como `icon-512x512.png`
3. Criar versões maskable com padding usando um editor de imagens

### Nota sobre ícones maskable

Ícones maskable são necessários para Android. Eles devem ter:
- Padding de ~10% ao redor do conteúdo principal
- Conteúdo importante no centro (safe zone)
- Formato PNG com transparência

## Como funciona

### Instalação no Android

1. **Abrir no Chrome Android**: Acesse o app no navegador Chrome
2. **Prompt automático**: O Chrome mostrará um banner "Adicionar à tela inicial"
3. **Ou usar botão**: Use o componente `<InstallPWAButton />` no app
4. **Instalar**: Toque em "Instalar" ou "Adicionar"
5. **Pronto**: O app aparecerá na tela inicial como app nativo

### Funcionalidades PWA

- ✅ **Instalável**: Pode ser instalado no Android
- ✅ **Offline**: Funciona offline com cache de assets
- ✅ **Atualização automática**: Atualiza quando há nova versão
- ✅ **Modo standalone**: Abre sem barra de endereço (parece app nativo)
- ✅ **Cache inteligente**: 
  - Assets estáticos: Cache First
  - APIs: Network First
  - Imagens: Cache First

### Service Worker

O service worker é gerado automaticamente pelo `vite-plugin-pwa` e:
- Cacheia assets estáticos
- Permite funcionamento offline
- Atualiza automaticamente quando há nova versão
- Gerencia cache de APIs e recursos externos

## Testar PWA

### 1. Teste Local (Development)

```bash
npm run dev
```

O PWA funciona em `localhost` mesmo sem HTTPS.

### 2. Teste de Build

```bash
npm run build
npm run preview
```

### 3. Teste no Android

1. Faça deploy no Vercel (ou outro servidor HTTPS)
2. Acesse no Chrome Android
3. Verifique se aparece o prompt de instalação
4. Instale o app
5. Teste funcionamento offline

### 4. Audit Lighthouse

1. Abra Chrome DevTools
2. Vá em "Lighthouse"
3. Selecione "Progressive Web App"
4. Execute o audit
5. Verifique score (deve ser > 90)

## Componentes Disponíveis

### InstallPWAButton

Componente para facilitar instalação do app:

```tsx
import { InstallPWAButton } from './components/common/InstallPWAButton';

// No seu componente
<InstallPWAButton variant="primary" size="md" />
```

O botão:
- Aparece automaticamente quando o app pode ser instalado
- Desaparece após instalação
- Mostra estado de carregamento durante instalação

### Utilitários PWA

```tsx
import { 
  isAppInstalled, 
  canInstallApp, 
  installApp,
  checkForUpdates,
  forceUpdate 
} from './utils/pwa';

// Verificar se está instalado
if (isAppInstalled()) {
  console.log('App está instalado como PWA');
}

// Verificar se pode instalar
if (canInstallApp()) {
  await installApp();
}

// Verificar atualizações
const hasUpdate = await checkForUpdates();
if (hasUpdate) {
  forceUpdate(); // Recarrega com nova versão
}
```

## Requisitos

- ✅ **HTTPS obrigatório**: PWA só funciona em HTTPS (exceto localhost)
- ✅ **Service Worker**: Gerado automaticamente pelo plugin
- ✅ **Manifest**: Configurado e acessível
- ✅ **Ícones**: Devem estar em `public/icons/` (veja seção acima)

## Troubleshooting

### App não aparece como instalável

1. Verifique se está em HTTPS (ou localhost)
2. Verifique se os ícones existem em `public/icons/`
3. Verifique se o `manifest.json` está acessível
4. Limpe cache do navegador
5. Verifique console do navegador para erros

### Service Worker não registra

1. Verifique se `navigator.serviceWorker` está disponível
2. Verifique console para erros
3. Verifique se o build foi feito corretamente
4. Limpe cache do service worker em DevTools > Application > Service Workers

### App não funciona offline

1. Verifique se o service worker está ativo
2. Verifique se os assets estão sendo cacheados
3. Verifique estratégia de cache no `vite.config.ts`
4. Teste em modo avião após primeiro carregamento

### Avisos no console (esperados)

- **"Banner not shown: beforeinstallpromptevent.preventDefault()"**  
  O app usa um botão customizado de instalação (`InstallPWAButton`). O `prompt()` só é chamado quando o usuário clica em "Instalar App". Esse aviso é esperado e pode ser ignorado.

- **"A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"**  
  Erro típico de **extensões do navegador** (Chrome: gerenciadores de senha, tradutores, etc.), não do app. Não requer alteração no código.

## Próximos Passos

1. ✅ Gerar ícones PWA (veja seção acima)
2. ✅ Fazer build e deploy
3. ✅ Testar instalação no Android
4. ✅ Verificar funcionamento offline
5. ✅ Executar audit Lighthouse

## Referências

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

