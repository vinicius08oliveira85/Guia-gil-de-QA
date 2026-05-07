# Roteiro de testes (`TestCase`)

Este documento descreve o modelo de caso de teste no app, como dados legados são tratados e como usar filtros/relatórios de forma consistente.

## Campos principais

| Campo | Descrição |
| --- | --- |
| `action` | O que executar (roteiro; pode incluir passos numerados em texto). |
| `parameters` | Parâmetros necessários: massa de dados, pré-requisitos, contas, texto livre. |
| `expectedResult` | Resultado esperado. |
| `observedResult` | Resultado obtido na execução (preenchimento humano). |
| `status` | `Not Run`, `Passed`, `Failed`, `Blocked`. |

## Campos opcionais (auditoria e filtros)

| Campo | Descrição |
| --- | --- |
| `executionKind` | `manual`, `automated` ou `mixed`. Quando **definido**, substitui a heurística de “automatizado” nas métricas e exportações. Se **omitido**, o sistema infere pelo texto de `action` + `parameters` (palavras-chave como Selenium, Cypress, Postman, etc.). |
| `environment` | Ambiente estruturado para gráficos/filtros (ex.: Homologação). |
| `suite` | Suíte estruturada para filtros/relatórios. |

Alternativa ao uso dos campos estruturados: incluir linhas no texto de **parâmetros**, herdadas de importações antigas:

- `Ambiente: <nome>`
- `Suíte: <nome>`

As funções `getTestCaseEnvironment` e `getTestCaseSuite` (`utils/testCaseMigration.ts`) consideram primeiro os campos opcionais e, se vazios, extraem essas linhas do texto.

## Colunas úteis na importação Excel

Além das colunas de ação, parâmetros e resultados, são reconhecidas entre outras:

- **Resultado obtido** / Resultado Observado (legado)
- **Tipo execução** / Execução — valores como manual, automatizado, misto
- **Ambiente (estruturado)** / **Suíte (estruturado)** — preenchem `environment` e `suite`

## Exportação CSV/Excel

As exportações incluem **Tipo execução**, **Ambiente**, **Suíte** quando preenchidos, e **Automatizado (estimado)** (`Sim`/`Não`), combinando `executionKind` quando existir ou a heurística de texto caso contrário.

Na lista de tarefas, cada caso (`TestCaseItem`) mostra chips compactos para **tipo de execução** (quando `executionKind` está definido), **Ambiente** e **Suíte**, usando os mesmos valores dos filtros (`getTestCaseEnvironment` / `getTestCaseSuite`).

## Migração de dados antigos

Objetos salvos com `description`, `steps`, `isAutomated`, `testEnvironment`, etc. são convertidos por `migrateTestCase` ao carregar, importar ou normalizar respostas da IA. Não é necessário converter projetos manualmente.
