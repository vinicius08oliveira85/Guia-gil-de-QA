# Guia de Teste - Configuração do Supabase

Este documento fornece um checklist para testar se a configuração do Supabase está funcionando corretamente.

## Pré-requisitos

- Todas as variáveis de ambiente configuradas no Vercel
- Deploy realizado no Vercel após configurar as variáveis
- Acesso ao Supabase Dashboard

## Checklist de Teste

### 1. Verificar Status na Interface

- [ ] Acesse a aplicação no Vercel
- [ ] Vá em **Configurações** (ícone de engrenagem)
- [ ] Clique na aba **Supabase**
- [ ] Verifique se aparece **"Configurado"** em verde
- [ ] Verifique se todas as variáveis mostram status correto

**Resultado esperado:** Badge verde "Configurado" e todas as variáveis mostrando status positivo.

### 2. Verificar Console do Navegador

- [ ] Abra o console do navegador (F12)
- [ ] Procure por mensagens relacionadas ao Supabase
- [ ] Verifique se não há erros de CORS
- [ ] Verifique se não há erros de timeout

**Mensagens esperadas:**
- ✅ "Supabase configurado via proxy"
- ❌ Não deve aparecer: "Supabase não configurado" ou erros de CORS

### 3. Testar Salvamento de Projeto

- [ ] Abra ou crie um projeto na aplicação
- [ ] Clique no botão **"Salvar no Supabase"**
- [ ] Verifique se aparece uma mensagem de sucesso (toast)
- [ ] Verifique se o botão mostra estado de loading durante o salvamento

**Resultado esperado:** Mensagem de sucesso "Projeto salvo no Supabase com sucesso!"

### 4. Verificar Dados no Supabase

- [ ] Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/vebpalhcvzbbzmdzglag
- [ ] Vá em **Table Editor** > **projects**
- [ ] Verifique se o projeto salvo aparece na tabela
- [ ] Verifique se os dados estão corretos (id, name, description, data)

**Resultado esperado:** Projeto aparece na tabela `projects` com todos os dados.

### 5. Verificar Logs do Vercel

- [ ] Acesse o Vercel Dashboard
- [ ] Vá em **Deployments** > Selecione o último deployment
- [ ] Clique em **Functions** > `api/supabaseProxy`
- [ ] Verifique os logs para erros

**Resultado esperado:** Logs mostrando requisições bem-sucedidas (status 200).

### 6. Testar Sincronização

- [ ] Clique no botão **"Sync Supabase"** no dashboard de projetos
- [ ] Verifique se projetos do Supabase são carregados
- [ ] Verifique se não há erros no console

**Resultado esperado:** Projetos do Supabase são carregados e exibidos.

## Troubleshooting

### Problema: Status mostra "Não Configurado"

**Possíveis causas:**
1. Variável `VITE_SUPABASE_PROXY_URL` não está configurada
2. Deploy não foi realizado após adicionar variáveis
3. Variável está com valor incorreto (deve ser `/api/supabaseProxy`)

**Solução:**
- Verifique se `VITE_SUPABASE_PROXY_URL` está configurada no Vercel
- Faça um novo deploy
- Verifique o valor da variável (deve ser `/api/supabaseProxy`)

### Problema: Erro de CORS

**Possíveis causas:**
1. Proxy não está funcionando
2. Variável `VITE_SUPABASE_PROXY_URL` não está configurada

**Solução:**
- Verifique se `VITE_SUPABASE_PROXY_URL` está configurada
- Verifique se a função `api/supabaseProxy.ts` está sendo deployada
- Verifique logs do Vercel para erros na função

### Problema: Erro "Supabase não configurado" no proxy

**Possíveis causas:**
1. `SUPABASE_URL` não está configurada no Vercel
2. `SUPABASE_SERVICE_ROLE_KEY` não está configurada no Vercel
3. Variáveis não estão disponíveis para as serverless functions

**Solução:**
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
- Certifique-se de que as variáveis estão marcadas para "All Environments"
- Faça um novo deploy

### Problema: Timeout ao salvar

**Possíveis causas:**
1. Projeto muito grande
2. Conexão lenta
3. Timeout muito curto

**Solução:**
- Verifique o tamanho do projeto
- Verifique a conexão de internet
- Verifique logs do Vercel para erros de timeout

## Verificação Rápida

Execute este código no console do navegador para verificar a configuração:

```javascript
// Verificar variáveis de ambiente
console.log('VITE_SUPABASE_PROXY_URL:', import.meta.env.VITE_SUPABASE_PROXY_URL);
console.log('VITE_PUBLIC_SUPABASE_URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL);

// Testar chamada ao proxy
fetch('/api/supabaseProxy', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => console.log('Proxy response:', data))
  .catch(err => console.error('Proxy error:', err));
```

**Resultado esperado:** 
- Variáveis mostram valores corretos
- Proxy retorna `{ success: true, projects: [...] }` ou `{ success: false, error: ... }` (mas não erro de CORS)

## Próximos Passos

Após confirmar que tudo está funcionando:
- ✅ Projetos podem ser salvos no Supabase
- ✅ Dados estão persistidos na nuvem
- ✅ Sincronização entre dispositivos funciona
- ✅ Backup automático dos dados

