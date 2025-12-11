# Configuração do Figma MCP Server no Cursor

Este guia explica como configurar o Figma MCP Server no Cursor para integrar designs do Figma diretamente no seu workflow de desenvolvimento.

## O que é o Figma MCP Server?

O Figma MCP Server permite que você:
- **Gerar código a partir de frames selecionados**: Selecione um frame no Figma e transforme em código
- **Extrair contexto de design**: Obtenha variáveis, componentes e dados de layout diretamente no seu IDE
- **Recuperar recursos Make**: Colete recursos de código de arquivos Make e forneça ao LLM como contexto
- **Manter componentes consistentes com Code Connect**: Reutilize seus componentes reais para manter a qualidade do código gerado

## Configuração no Cursor

### Método 1: Via Deep Link (Recomendado)

1. Clique no [deep link do Figma MCP server](https://cursor.sh/mcp?server=figma&url=https://mcp.figma.com/mcp)
2. Isso abrirá a configuração MCP no Cursor
3. Clique em **Install** em 'Install MCP Server?'
4. Clique em **Connect** ao lado de Figma para iniciar o processo de autenticação
5. Clique em **Open** na janela de diálogo
6. **Permita o acesso** na janela de autenticação do Figma
7. Comece a usar!

### Método 2: Configuração Manual

1. Abra as configurações do Cursor (⌘ Shift P ou Ctrl Shift P)
2. Selecione **MCP: Open User Configuration** (para usar globalmente) ou **MCP: Open Workspace Folder MCP Configuration** (apenas no workspace atual)
3. Se o arquivo `mcp.json` não existir, você será solicitado a criá-lo
4. Cole o seguinte código no arquivo `mcp.json`:

```json
{
  "inputs": [],
  "servers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

5. Clique em **Start** (acima do nome do servidor MCP)
6. **Permita o acesso** quando solicitado
7. Comece a usar!

## Como Usar

O servidor MCP do Figma é baseado em links. Para usá-lo:

1. **Copie o link** para um frame ou layer no Figma
2. **Cole o link** em uma prompt para o assistente AI
3. O assistente extrairá o node-id necessário e usará o MCP server para obter informações sobre o objeto selecionado

### Exemplo de Prompt

```
Implemente este design do Figma: https://www.figma.com/file/xxxxx/Design?node-id=12345
```

Ou:

```
Gere código React para este componente do Figma: [cole o link aqui]
```

## Melhorando a Saída do MCP Server

Para obter os melhores resultados, recomendamos:

1. **Estruturar seu arquivo Figma**: Organize frames e componentes de forma clara
2. **Escrever prompts efetivos**: Seja específico sobre o que você quer gerar
3. **Adicionar regras customizadas**: Configure regras para guiar o agente
4. **Evitar selecionar frames grandes**: Selecione componentes específicos em vez de frames inteiros

## Autenticação

O servidor remoto requer autenticação OAuth do Figma. Na primeira vez que você usar:

1. Você será redirecionado para a página de autenticação do Figma
2. Faça login na sua conta Figma
3. Permita o acesso ao MCP server
4. Você será redirecionado de volta ao Cursor

## Troubleshooting

### O servidor não está carregando ou a conexão foi perdida

- Verifique se você está autenticado corretamente
- Tente reiniciar o servidor MCP no Cursor
- Verifique sua conexão com a internet

### Está lento ou travado

- Evite selecionar frames muito grandes ou complexos
- Tente selecionar componentes específicos em vez de frames inteiros
- Verifique se há muitas camadas no frame selecionado

### Erro 500

- Verifique se o link do Figma está correto e acessível
- Certifique-se de que você tem permissão para acessar o arquivo Figma
- Tente novamente após alguns segundos

### Imagens pararam de carregar

- Verifique sua conexão com a internet
- Tente reiniciar o servidor MCP
- Verifique se o arquivo Figma ainda está acessível

## Recursos Adicionais

- [Documentação oficial do Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#cursor)
- [Figma MCP Server - Q&A](https://developers.figma.com/docs/figma-mcp-server/q-and-a/)
- [Code Connect Integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)

## Notas Importantes

- Você deve usar um editor de código ou aplicação que suporte servidores MCP (VS Code, Cursor, Claude Code)
- O servidor remoto não requer a instalação do app desktop do Figma
- Você precisa de um link válido do Figma para usar o servidor
- O servidor extrai automaticamente o node-id do link fornecido

