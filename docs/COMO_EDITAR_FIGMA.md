# 🎨 Como Editar Layout no Figma

Guia completo para editar layouts, botões, fontes e outros elementos no Figma e sincronizar com o projeto.

## 📋 Índice

1. [Acessar o Arquivo Figma](#acessar-o-arquivo-figma)
2. [Editar Cores e Paleta](#editar-cores-e-paleta)
3. [Editar Tipografia (Fontes)](#editar-tipografia-fontes)
4. [Editar Espaçamentos](#editar-espaçamentos)
5. [Editar Componentes (Botões, Cards, etc)](#editar-componentes)
6. [Usar Variáveis do Figma](#usar-variáveis-do-figma)
7. [Sincronizar Mudanças](#sincronizar-mudanças)

---

## 🔗 Acessar o Arquivo Figma

### Seu Arquivo Atual

**URL do Figma:**
```
https://www.figma.com/make/BnNDG2oJPvckiNda3H4MLt/Botão-Atraente-para-Elementos
```

**File Key:** `BnNDG2oJPvckiNda3H4MLt`

### Como Acessar

1. Abra o link acima no navegador
2. Faça login no Figma (se necessário)
3. Você verá o arquivo de design

---

## 🎨 Editar Cores e Paleta

### Método 1: Usando Variáveis do Figma (Recomendado)

1. **Criar/Editar Variáveis:**
   - No Figma, vá em **Design** → **Variables** (ou pressione `Shift + I`)
   - Clique em **+** para criar nova variável
   - Escolha o tipo: **Color**

2. **Organizar por Categoria:**
   ```
   color/
     accent/
       primary
       secondary
     semantic/
       success
       warning
       error
       info
     background/
       base
       muted
   ```

3. **Aplicar Variáveis:**
   - Selecione um elemento (botão, card, etc)
   - No painel direito, clique na cor
   - Escolha a variável criada

### Método 2: Editar Cores Diretamente

1. Selecione o elemento
2. No painel direito, clique na cor
3. Ajuste usando:
   - Seletor de cores
   - Valores HEX/RGB
   - Opacidade

### Convenções de Nomenclatura

Para sincronização automática, use esta estrutura:
```
color/[categoria]/[nome]
```

Exemplos:
- `color/accent/primary`
- `color/semantic/success`
- `color/background/base`

---

## ✍️ Editar Tipografia (Fontes)

### 1. Criar Estilos de Texto

1. Selecione um texto
2. Configure:
   - **Font Family** (ex: Inter, Poppins)
   - **Font Size** (ex: 16px, 24px)
   - **Font Weight** (ex: Regular, Bold)
   - **Line Height** (ex: 1.5, 1.6)
   - **Letter Spacing** (ex: 0, -0.5px)

3. No painel direito, clique em **Text styles** → **+**
4. Nomeie o estilo (ex: "Heading 1", "Body", "Label")

### 2. Usar Variáveis para Tamanhos

1. Crie variáveis de tamanho:
   ```
   typography/
     fontSize/
       display
       pageTitle
       sectionTitle
       body
       label
   ```

2. Aplique nos textos

### 3. Editar Fontes Existentes

1. Selecione o texto
2. No painel direito, ajuste:
   - **Font**: Escolha a fonte
   - **Size**: Tamanho
   - **Weight**: Peso (Regular, Medium, Bold)
   - **Line height**: Altura da linha

---

## 📏 Editar Espaçamentos

### 1. Usar Variáveis de Espaçamento

1. Crie variáveis:
   ```
   spacing/
     xs (6px)
     sm (8px)
     md (12px)
     lg (16px)
     xl (20px)
     2xl (28px)
   ```

2. Aplique em:
   - Padding de elementos
   - Margens entre componentes
   - Gaps em layouts

### 2. Editar Espaçamentos Manualmente

1. Selecione o elemento
2. No painel direito, ajuste:
   - **Padding**: Espaçamento interno
   - **Margin**: Espaçamento externo (usando Auto Layout)

### 3. Auto Layout (Recomendado)

1. Selecione o frame/container
2. Clique em **Auto Layout** (ou `Shift + A`)
3. Configure:
   - **Padding**: Espaçamento interno
   - **Gap**: Espaçamento entre filhos
   - **Direction**: Horizontal ou Vertical

---

## 🧩 Editar Componentes (Botões, Cards, etc)

### 1. Editar Componente Principal

1. Localize o componente no arquivo
2. Clique duas vezes para entrar no componente
3. Faça as alterações desejadas
4. Todas as instâncias serão atualizadas automaticamente

### 2. Criar Variantes

1. Selecione o componente
2. No painel direito, clique em **Variants**
3. Crie variantes (ex: Primary, Secondary, Ghost)
4. Configure propriedades (ex: Size: Small, Medium, Large)

### 3. Editar Botões

**Exemplo: Botão Primário**

1. Selecione o botão
2. Edite:
   - **Background**: Cor de fundo
   - **Text**: Cor e estilo do texto
   - **Border Radius**: Cantos arredondados
   - **Padding**: Espaçamento interno
   - **Shadow**: Sombra (opcional)

3. Use variáveis para cores:
   - Background: `color/accent/primary`
   - Text: `color/text/primary`

### 4. Editar Cards

1. Selecione o card
2. Edite:
   - **Background**: Cor de fundo
   - **Border**: Borda
   - **Shadow**: Sombra
   - **Padding**: Espaçamento interno
   - **Border Radius**: Cantos arredondados

---

## 🔄 Usar Variáveis do Figma

### Por Que Usar Variáveis?

✅ **Sincronização Automática**: Mudanças são refletidas no código
✅ **Consistência**: Mesmas cores/valores em todo o design
✅ **Manutenção Fácil**: Altere uma vez, atualize em todos os lugares

### Como Criar Variáveis

1. **Abrir Painel de Variáveis:**
   - `Shift + I` ou **Design** → **Variables**

2. **Criar Nova Variável:**
   - Clique em **+**
   - Escolha o tipo (Color, Number, String, Boolean)
   - Nomeie seguindo a convenção: `categoria/nome`

3. **Organizar em Grupos:**
   - Arraste variáveis para criar grupos
   - Exemplo: `color/accent/primary`

### Convenções para Sincronização

Para que as variáveis sejam sincronizadas automaticamente:

```
color/[categoria]/[nome]
spacing/[tamanho]
typography/[propriedade]/[nome]
radius/[tamanho]
```

**Exemplos:**
- ✅ `color/accent/primary`
- ✅ `spacing/md`
- ✅ `typography/fontSize/body`
- ✅ `radius/sm`

---

## 🔄 Sincronizar Mudanças

### Opção 1: Sincronização Automática (GitHub Actions)

1. **Faça suas alterações no Figma**
2. **Aguarde sincronização automática:**
   - Executa diariamente às 2h UTC
   - Ou quando você faz push em `tokens/design-tokens.json`

3. **Verificar:**
   - Vá em **Actions** no GitHub
   - Veja o workflow "Sync Figma Tokens"

### Opção 2: Sincronização Manual

1. **No GitHub:**
   - Vá em **Actions** → **Sync Figma Tokens**
   - Clique em **Run workflow**
   - Aguarde a execução

2. **Resultado:**
   - Tokens atualizados em `tokens/design-tokens.json`
   - CSS e Tailwind config gerados
   - Deploy automático no Vercel

### Opção 3: Via API do Vercel

1. **Chamar a API:**
   ```bash
   POST /api/sync-figma-tokens
   {
     "fileKey": "BnNDG2oJPvckiNda3H4MLt"
   }
   ```

---

## 📝 Dicas e Boas Práticas

### ✅ Faça

- Use **Variáveis** para cores, espaçamentos e tipografia
- Siga as **convenções de nomenclatura**
- Organize variáveis em **grupos lógicos**
- Use **Auto Layout** para espaçamentos consistentes
- Crie **componentes** para elementos reutilizáveis

### ❌ Evite

- Cores hardcoded (sem variáveis)
- Espaçamentos aleatórios
- Nomes de variáveis inconsistentes
- Componentes não organizados

### 🎯 Workflow Recomendado

1. **Designer no Figma:**
   - Cria/edita design usando variáveis
   - Organiza seguindo convenções
   - Testa visualmente

2. **Sincronização:**
   - GitHub Actions sincroniza automaticamente
   - Ou dispara manualmente

3. **Desenvolvedor:**
   - Recebe tokens atualizados
   - Usa no código
   - Deploy automático

---

## 🔍 Verificar Mudanças

### No Figma

1. **Version History:**
   - Clique em **File** → **Version History**
   - Veja todas as alterações

2. **Comments:**
   - Adicione comentários nas mudanças
   - Documente decisões de design

### No GitHub

1. **Commits:**
   - Veja commits automáticos do workflow
   - Mensagem: "chore: sync design tokens from Figma"

2. **Arquivo de Tokens:**
   - Abra `tokens/design-tokens.json`
   - Veja valores atualizados

---

## 🆘 Troubleshooting

### Variáveis não sincronizam

- ✅ Verifique se segue a convenção de nomenclatura
- ✅ Confirme que são variáveis locais (não de biblioteca)
- ✅ Verifique se o file key está correto

### Cores não aparecem no código

- ✅ Aguarde sincronização automática
- ✅ Execute sincronização manual
- ✅ Verifique se tokens foram gerados

### Mudanças não refletem

- ✅ Verifique se fez commit das mudanças no Figma
- ✅ Confirme que secrets estão configurados no GitHub
- ✅ Veja logs do workflow no GitHub Actions

---

## 📚 Recursos Adicionais

- [Figma Variables Documentation](https://help.figma.com/hc/en-us/articles/15339657135383)
- [Figma Auto Layout Guide](https://help.figma.com/hc/en-us/articles/5731384052759)
- [Figma Components Guide](https://help.figma.com/hc/en-us/articles/5579474826519)

---

**Última atualização**: 03/12/2025

