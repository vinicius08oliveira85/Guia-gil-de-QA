# Guia de Contribuição

Obrigado por considerar contribuir com o QA Agile Guide!

## Como Contribuir

### 1. Fork e Clone

```bash
git clone https://github.com/seu-usuario/qa-agile-guide.git
cd qa-agile-guide
```

### 2. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

### 3. Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm test

# Verificar tipos
npm run type-check

# Lint
npm run lint
```

### 4. Criar Branch

```bash
git checkout -b feature/nova-funcionalidade
```

### 5. Fazer Mudanças

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize documentação quando necessário
- Use commits descritivos

### 6. Verificar Antes de Commitar

```bash
# Formatar código
npm run format

# Verificar lint
npm run lint:fix

# Executar testes
npm test

# Verificar tipos
npm run type-check
```

### 7. Push e Pull Request

```bash
git push origin feature/nova-funcionalidade
```

## Padrões de Código

### TypeScript

- Use tipos explícitos
- Evite `any`
- Use interfaces para objetos
- Documente funções públicas com JSDoc

### React

- Use componentes funcionais
- Use hooks customizados quando apropriado
- Otimize com `React.memo` quando necessário
- Mantenha componentes pequenos e focados

### Testes

- Teste comportamento, não implementação
- Meta de cobertura: 70%+
- Use Testing Library para componentes
- Mock dependências externas

### Commits

Use mensagens descritivas:

```
feat: adiciona validação de formulário
fix: corrige bug no carregamento de projetos
docs: atualiza README
refactor: reorganiza estrutura de pastas
test: adiciona testes para useErrorHandler
```

## Estrutura de Pull Request

1. **Título claro**: Descreva a mudança
2. **Descrição**: Explique o que e por quê
3. **Testes**: Liste testes adicionados/modificados
4. **Checklist**: Verifique itens relevantes

## Dúvidas?

Abra uma issue ou entre em contato!

