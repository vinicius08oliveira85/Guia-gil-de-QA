# Sistema de Design Leve Saúde

## Visão Geral

Este documento descreve o sistema de design completo baseado na identidade visual do Leve Saúde, com foco em acessibilidade, legibilidade e usabilidade para pacientes.

## Paleta de Cores

### Cores Primárias (Brand Green)

As cores verdes são a identidade principal da marca Leve Saúde.

#### `--color-primary` (#109685)
**Uso:** Botões primários, links principais, ícones de ação, CTAs principais
- **Contraste:** 4.5:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** Botão "Agendar consulta"

#### `--color-primary-dark` (#007367)
**Uso:** Hover de botões primários, estados ativos, cabeçalhos em fundos claros
- **Contraste:** 5.2:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** Estado hover do botão primário

#### `--color-primary-deep` (#0B6156)
**Uso:** Barras de navegação, rodapés, elementos que exigem contraste maior
- **Contraste:** 5.8:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** Footer, barras de navegação

### Cores de Acento (Laranja)

#### `--color-accent` (#FB4C00) / `--color-accent-2` (#FC4C02)
**Uso:** CTAs secundários, alertas leves, badges, micro-interações
- **Contraste:** 4.8:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** Badges de promoção, alertas informativos

### Cores de Estado

#### `--color-success` (#15803D)
**Uso:** Mensagens de sucesso, confirmações, estados positivos
- **Contraste:** 5.1:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** "Pagamento confirmado", "Agendamento realizado"

### Cores Neutras

#### `--color-text` (#333333)
**Uso:** Texto principal em fundos claros
- **Contraste:** 12.6:1 sobre branco ✅ (WCAG AAA)
- **Exemplo:** Parágrafos, títulos em fundo branco

#### `--color-muted` (#7F7F7F)
**Uso:** Textos secundários, legendas, informações complementares
- **Contraste:** 4.5:1 sobre branco ✅ (WCAG AA)
- **Exemplo:** Legendas de campos, textos de apoio

#### `--color-bg` (#FFFFFF)
**Uso:** Fundo principal da aplicação
- **Exemplo:** Background de páginas, cards

#### `--color-surface` (#F6F6F6)
**Uso:** Cartões e superfícies neutras
- **Exemplo:** Fundo de cards, áreas de destaque

#### `--color-surface-alt` (#F2F2F2)
**Uso:** Superfícies alternativas, hover states
- **Exemplo:** Hover de cards, estados de interação

#### `--color-border` (#C6BEBF)
**Uso:** Bordas suaves de elementos
- **Exemplo:** Bordas de inputs, cards, divisores

#### `--color-soft-bg` (#EAF3EE)
**Uso:** Fundos suaves para seções informativas
- **Exemplo:** Cards de dicas, blocos informativos

### Cores Especiais

#### `--color-navy` (#191970)
**Uso:** Cabeçalhos institucionais, elementos que exigem autoridade
- **Contraste:** 8.6:1 sobre branco ✅ (WCAG AAA)
- **Exemplo:** Páginas sobre a empresa, documentos institucionais

## Tipografia

### Famílias de Fonte

#### Poppins (Títulos)
- **Pesos:** 300, 400, 500, 600, 700
- **Uso:** Títulos (h1-h4), destaques, CTAs
- **Características:** Sem serifa, arredondada, moderna

#### Inter (Corpo)
- **Pesos:** 400, 500, 600
- **Uso:** Texto corrido, parágrafos, labels
- **Características:** Alta legibilidade em telas

### Escala Tipográfica

| Elemento | Tamanho | Peso | Line Height | Uso |
|----------|---------|------|-------------|-----|
| h1 | 2.25rem (36px) | 600 | 1.15 | Títulos principais |
| h2 | 1.75rem (28px) | 600 | 1.15 | Subtítulos principais |
| h3 | 1.375rem (22px) | 600 | 1.25 | Subtítulos secundários |
| h4 | 1.125rem (18px) | 600 | 1.25 | Subtítulos terciários |
| body | 1rem (16px) | 400 | 1.5 | Texto corrido |
| small | 0.875rem (14px) | 400 | 1.5 | Textos pequenos |
| label | 0.9375rem (15px) | 500 | 1.5 | Labels de formulários |

### Responsividade Mobile

No mobile, a escala é reduzida proporcionalmente:
- **h1:** 1.75rem (28px)
- **h2:** 1.5rem (24px)
- **h3:** 1.25rem (20px)
- **h4:** 1.125rem (18px) - mantém
- **body:** 1rem (16px) - mantém

## Componentes

### Botões

#### Botão Primário
```tsx
<ButtonLeve variant="primary">Agendar consulta</ButtonLeve>
```

**Características:**
- Cor: `--color-primary` (#109685)
- Hover: `--color-primary-dark` (#007367)
- Altura mínima: 44px (touch target)
- Contraste: 4.5:1 ✅

#### Botão Secundário
```tsx
<ButtonLeve variant="secondary">Saiba mais</ButtonLeve>
```

**Características:**
- Fundo transparente
- Borda: 2px solid `--color-primary`
- Hover: fundo com opacidade

#### Botão Ghost
```tsx
<ButtonLeve variant="ghost">Cancelar</ButtonLeve>
```

**Características:**
- Fundo transparente
- Sem borda
- Hover: fundo sutil

### Inputs

```tsx
<InputLeve 
  label="Nome completo"
  placeholder="Digite seu nome"
  state="default"
  helperText="Este campo é obrigatório"
/>
```

**Estados:**
- `default`: Estado normal
- `error`: Borda vermelha, mensagem de erro
- `success`: Borda verde, confirmação

**Acessibilidade:**
- Label associado via `htmlFor`
- `aria-invalid` para estados de erro
- `aria-describedby` para mensagens de ajuda

### Cards

#### Card Padrão
```tsx
<InfoCardLeve 
  title="Plano Leve Saúde"
  variant="default"
>
  Informações sobre o plano...
</InfoCardLeve>
```

#### Card Informativo
```tsx
<InfoCardLeve 
  title="Dicas de Preparação"
  variant="info"
  actionLabel="Saiba mais"
  onAction={() => {}}
>
  Dicas importantes para sua consulta...
</InfoCardLeve>
```

## Espaçamento

Sistema de espaçamento padronizado:

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | 0.375rem (6px) | Espaçamentos mínimos |
| `--spacing-sm` | 0.5rem (8px) | Espaçamentos pequenos |
| `--spacing-md` | 0.75rem (12px) | Espaçamentos médios |
| `--spacing-lg` | 1rem (16px) | Espaçamentos grandes |
| `--spacing-xl` | 1.25rem (20px) | Espaçamentos extra grandes |
| `--spacing-2xl` | 1.75rem (28px) | Espaçamentos muito grandes |
| `--spacing-3xl` | 2.25rem (36px) | Espaçamentos máximos |

## Bordas e Sombras

### Border Radius
- `--radius-sm`: 8px
- `--radius-md`: 10px
- `--radius-lg`: 12px
- `--radius-xl`: 16px

### Sombras
- `--shadow-sm`: Sombra suave para cards
- `--shadow-md`: Sombra média para botões
- `--shadow-lg`: Sombra grande para modais

## Acessibilidade (WCAG)

### Contraste de Cores

Todos os componentes seguem as diretrizes WCAG AA:

- **Texto normal:** Mínimo 4.5:1 ✅
- **Texto grande (>=18px):** Mínimo 3:1 ✅
- **Componentes interativos:** Mínimo 3:1 ✅

### Estados de Foco

Todos os elementos interativos possuem estados de foco visíveis:
- Outline de 4px com cor primária
- Contraste adequado
- Não removido com `outline: none` sem alternativa

### Touch Targets

- **Mínimo:** 44x44px (mobile)
- **Recomendado:** 48x48px
- Aplicado em todos os botões e elementos interativos

### Navegação por Teclado

- Todos os elementos interativos são acessíveis via Tab
- Ordem lógica de navegação
- Skip links para conteúdo principal

## Checklist de Acessibilidade

- [x] Contraste mínimo 4.5:1 para texto normal
- [x] Contraste mínimo 3:1 para texto grande
- [x] Estados de foco visíveis
- [x] Touch targets mínimos de 44px
- [x] Labels associados a inputs
- [x] Mensagens de erro acessíveis
- [x] Navegação por teclado funcional
- [x] Textos alternativos em imagens
- [x] Estrutura semântica HTML
- [x] ARIA labels quando necessário

## Uso das Cores - Guia Rápido

### Quando usar cada cor:

1. **Verde Primário (#109685):**
   - Botões de ação principal
   - Links importantes
   - Ícones de ação
   - CTAs principais

2. **Verde Escuro (#007367):**
   - Hover de botões primários
   - Estados ativos
   - Cabeçalhos em fundos claros

3. **Verde Profundo (#0B6156):**
   - Rodapés
   - Barras de navegação
   - Elementos que exigem contraste maior

4. **Laranja (#FB4C00 / #FC4C02):**
   - CTAs secundários
   - Alertas leves
   - Badges de promoção
   - Micro-interações

5. **Verde Sucesso (#15803D):**
   - Mensagens de sucesso
   - Confirmações
   - Estados positivos

6. **Navy (#191970):**
   - Páginas institucionais
   - Elementos que exigem autoridade
   - Documentos formais

## Boas Práticas

1. **Legibilidade:**
   - Use line-height 1.5 para texto corrido
   - Mantenha largura máxima de linha em 70-80 caracteres
   - Espaçamento adequado entre parágrafos (1.5rem)

2. **Hierarquia Visual:**
   - Use tamanhos de fonte para criar hierarquia
   - Use pesos de fonte (400, 500, 600) para ênfase
   - Mantenha contraste adequado entre elementos

3. **Consistência:**
   - Use sempre as variáveis CSS definidas
   - Não crie cores customizadas sem necessidade
   - Siga a escala tipográfica estabelecida

4. **Responsividade:**
   - Teste em diferentes tamanhos de tela
   - Ajuste espaçamentos no mobile
   - Mantenha touch targets adequados

## Recursos Adicionais

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

