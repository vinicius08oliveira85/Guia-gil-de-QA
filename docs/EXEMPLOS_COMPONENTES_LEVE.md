# Exemplos Práticos - Componentes Leve Saúde

Este documento contém exemplos práticos de HTML + CSS prontos para uso dos componentes do sistema de design Leve Saúde.

## Botão Primário

### HTML

```html
<button class="btn-primary-leve">Agendar consulta</button>
```

### CSS (já incluído no index.css)

```css
.btn-primary-leve {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: var(--fw-medium);
  font-size: var(--fs-body);
  border: none;
  box-shadow: var(--shadow-md);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}

.btn-primary-leve:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(16, 150, 133, 0.2);
  transform: translateY(-1px);
}

.btn-primary-leve:disabled {
  background: var(--color-surface);
  color: var(--color-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Estados

#### Hover

```html
<button class="btn-primary-leve">Agendar consulta</button>
<!-- Estado hover aplicado automaticamente -->
```

#### Disabled

```html
<button class="btn-primary-leve" disabled>Agendar consulta</button>
```

#### Focus

```html
<button class="btn-primary-leve">Agendar consulta</button>
<!-- Estado focus aplicado automaticamente ao navegar com Tab -->
```

## Botão Secundário

### HTML

```html
<button class="btn-secondary-leve">Saiba mais</button>
```

### CSS (já incluído no index.css)

```css
.btn-secondary-leve {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 0.625rem 1.125rem;
  border-radius: var(--radius-md);
  font-weight: var(--fw-medium);
  font-size: var(--fs-body);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}

.btn-secondary-leve:hover {
  background: rgba(16, 150, 133, 0.06);
  border-color: var(--color-primary-dark);
  color: var(--color-primary-dark);
}
```

## Botão Ghost

### HTML

```html
<button class="btn-ghost-leve">Cancelar</button>
```

### CSS (já incluído no index.css)

```css
.btn-ghost-leve {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid transparent;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: var(--fw-medium);
  font-size: var(--fs-body);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}

.btn-ghost-leve:hover {
  background: rgba(16, 150, 133, 0.06);
}
```

## Input

### HTML - Estado Normal

```html
<div>
  <label for="nome" class="label-leve">Nome completo</label>
  <input type="text" id="nome" class="input-leve" placeholder="Digite seu nome" />
</div>
```

### HTML - Estado de Erro

```html
<div>
  <label for="email" class="label-leve">E-mail</label>
  <input
    type="email"
    id="email"
    class="input-leve error"
    placeholder="seu@email.com"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" class="text-sm text-red-600 mt-1" role="alert">
    Por favor, insira um e-mail válido
  </p>
</div>
```

### HTML - Estado de Sucesso

```html
<div>
  <label for="cpf" class="label-leve">CPF</label>
  <input
    type="text"
    id="cpf"
    class="input-leve success"
    placeholder="000.000.000-00"
    value="123.456.789-00"
  />
  <p class="text-sm text-green-600 mt-1">CPF válido</p>
</div>
```

### CSS (já incluído no index.css)

```css
.input-leve {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: var(--fs-body);
  font-family: var(--font-body);
  font-weight: var(--fw-regular);
  color: var(--color-text);
  line-height: var(--lh-comfortable);
  transition: all var(--transition-base);
}

.input-leve:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(16, 150, 133, 0.06);
}

.input-leve.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
}

.input-leve.success {
  border-color: var(--color-success);
  box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.1);
}

.label-leve {
  font-size: var(--fs-small);
  color: var(--color-text);
  font-weight: var(--fw-medium);
  margin-bottom: 0.25rem;
  display: block;
  font-family: var(--font-body);
}
```

## Card de Informação

### HTML - Card Padrão

```html
<div class="card-leve">
  <h4 class="card-title">Plano Leve Saúde</h4>
  <p class="card-text">
    Informações rápidas e claras sobre cobertura e contatos. Caso precise, ligue para (11)
    0000-0000.
  </p>
  <button class="btn-ghost-leve">Saiba mais</button>
</div>
```

### HTML - Card Informativo

```html
<div class="card-info-leve">
  <h4 class="card-title">Dicas de Preparação</h4>
  <p class="card-text">
    Chegue 15 minutos antes do horário agendado. Traga um documento com foto e seu cartão do plano.
  </p>
</div>
```

### CSS (já incluído no index.css)

```css
.card-leve {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.card-leve:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.card-leve .card-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-semibold);
  color: var(--color-primary-deep);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-heading);
}

.card-leve .card-text {
  font-size: var(--fs-body);
  color: var(--color-text);
  line-height: var(--lh-comfortable);
  font-family: var(--font-body);
}

.card-info-leve {
  background: var(--color-soft-bg);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card-info-leve .card-title {
  color: var(--color-success);
  font-weight: var(--fw-semibold);
}
```

## Exemplo Completo - Formulário de Agendamento

### HTML

```html
<div class="leve-saude">
  <div class="container" style="max-width: 600px; margin: 2rem auto; padding: 2rem;">
    <h1>Agendar Consulta</h1>

    <form>
      <div style="margin-bottom: 1.5rem;">
        <label for="nome" class="label-leve">Nome completo</label>
        <input
          type="text"
          id="nome"
          class="input-leve"
          placeholder="Digite seu nome completo"
          required
        />
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label for="email" class="label-leve">E-mail</label>
        <input type="email" id="email" class="input-leve" placeholder="seu@email.com" required />
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label for="telefone" class="label-leve">Telefone</label>
        <input type="tel" id="telefone" class="input-leve" placeholder="(11) 00000-0000" required />
      </div>

      <div style="margin-bottom: 2rem;">
        <label for="data" class="label-leve">Data preferencial</label>
        <input type="date" id="data" class="input-leve" required />
      </div>

      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button type="submit" class="btn-primary-leve">Agendar consulta</button>
        <button type="button" class="btn-secondary-leve">Cancelar</button>
      </div>
    </form>
  </div>
</div>
```

## Exemplo Completo - Página com Header e Footer

### HTML

```html
<!DOCTYPE html>
<html lang="pt-BR" class="leve-saude">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Leve Saúde - Agendamento</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <!-- Header -->
    <header class="leve-saude bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 1rem 2rem;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="/logo.svg" alt="Leve Saúde" style="height: 40px;" />
            <div>
              <h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Leve Saúde</h1>
              <p style="font-size: 0.875rem; color: var(--color-muted); margin: 0;">
                Cuidando da sua saúde
              </p>
            </div>
          </div>
          <nav style="display: flex; gap: 2rem;">
            <a href="#" style="color: var(--color-text); text-decoration: none; font-weight: 500;"
              >Início</a
            >
            <a href="#" style="color: var(--color-text); text-decoration: none; font-weight: 500;"
              >Sobre</a
            >
            <a href="#" style="color: var(--color-text); text-decoration: none; font-weight: 500;"
              >Contato</a
            >
          </nav>
          <button class="btn-primary-leve">Agendar consulta</button>
        </div>
      </div>
    </header>

    <!-- Conteúdo Principal -->
    <main style="min-height: calc(100vh - 200px); padding: 3rem 0;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
        <h1>Bem-vindo ao Leve Saúde</h1>
        <p style="font-size: 1.125rem; line-height: 1.75; margin-bottom: 2rem;">
          Oferecemos cuidados de saúde de qualidade com foco no bem-estar dos nossos pacientes.
        </p>

        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 3rem;"
        >
          <div class="card-leve">
            <h4 class="card-title">Consultas</h4>
            <p class="card-text">
              Agende sua consulta de forma rápida e fácil através do nosso sistema online.
            </p>
            <button class="btn-ghost-leve" style="margin-top: 1rem;">Saiba mais</button>
          </div>

          <div class="card-info-leve">
            <h4 class="card-title">Dicas de Saúde</h4>
            <p class="card-text">
              Mantenha-se informado com nossas dicas e orientações para uma vida mais saudável.
            </p>
          </div>

          <div class="card-leve">
            <h4 class="card-title">Planos</h4>
            <p class="card-text">
              Conheça nossos planos de saúde e escolha o que melhor se adapta às suas necessidades.
            </p>
            <button class="btn-ghost-leve" style="margin-top: 1rem;">Ver planos</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="leve-saude"
      style="background-color: var(--color-primary-deep); color: var(--color-white); padding: 3rem 0; margin-top: 4rem;"
    >
      <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 0 2rem;">
        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem;"
        >
          <div>
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Contato</h3>
            <p style="font-size: 0.875rem; margin: 0.5rem 0;">Telefone: (11) 0000-0000</p>
            <p style="font-size: 0.875rem; margin: 0.5rem 0;">E-mail: contato@levesaude.com.br</p>
          </div>
          <div>
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
              Links Rápidos
            </h3>
            <a
              href="#"
              style="display: block; color: var(--color-white); text-decoration: none; font-size: 0.875rem; margin: 0.5rem 0;"
              >Sobre nós</a
            >
            <a
              href="#"
              style="display: block; color: var(--color-white); text-decoration: none; font-size: 0.875rem; margin: 0.5rem 0;"
              >Planos</a
            >
            <a
              href="#"
              style="display: block; color: var(--color-white); text-decoration: none; font-size: 0.875rem; margin: 0.5rem 0;"
              >Agendamento</a
            >
          </div>
        </div>
        <div
          style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 1.5rem; text-align: center;"
        >
          <p style="font-size: 0.875rem; margin: 0;">
            © 2024 Leve Saúde. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  </body>
</html>
```

## Responsividade Mobile

### Ajustes para Mobile

```css
@media (max-width: 640px) {
  .leve-saude h1 {
    font-size: 1.75rem; /* Reduzido de 2.25rem */
  }

  .leve-saude h2 {
    font-size: 1.5rem; /* Reduzido de 1.75rem */
  }

  .btn-primary-leve,
  .btn-secondary-leve,
  .btn-ghost-leve {
    min-height: 44px; /* Mantém touch target mínimo */
    padding: 0.75rem 1rem;
    font-size: var(--fs-body);
  }

  .input-leve {
    padding: 0.875rem 1rem; /* Padding maior em mobile */
    font-size: var(--fs-body);
  }

  .card-leve {
    padding: var(--spacing-md);
  }
}
```

## Dicas de Uso

1. **Sempre use a classe `.leve-saude`** no elemento raiz ou container principal
2. **Mantenha o contraste adequado** - use as variáveis CSS definidas
3. **Teste em diferentes dispositivos** - especialmente mobile
4. **Valide acessibilidade** - use ferramentas como WebAIM Contrast Checker
5. **Siga a hierarquia tipográfica** - use h1-h4 para títulos, body para texto

## Validação de Contraste

Use estas ferramentas para validar o contraste:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

Todos os componentes foram testados e atendem aos requisitos WCAG AA.
