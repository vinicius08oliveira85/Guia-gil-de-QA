---
tag: business-rule
status: active
file_origin: services/supabaseService.ts
---

# Verifica se é ambiente de desenvolvimento local / let supabase: SupabaseClient |

**Descrição:** Verifica se é ambiente de desenvolvimento local / let supabase: SupabaseClient | null = null; // Sistema de controle de salvamentos para evitar loops e salvamentos simultâneos const savingProjects = new Map<string, Promise<void>>(); // Rastreia salvamentos em progresso const lastSaveTime = new Map<string, number>(); // Rastreia último tempo de salvamento para debounce const pendingSaves = new Map<string, Project>(); // Fila de salvamentos pendentes (última versão de cada projeto) const saveDebou

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
