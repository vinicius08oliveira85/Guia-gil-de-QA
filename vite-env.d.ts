/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  /** Chave da API Google Gemini (exposta no bundle Vite; use apenas chaves restritas por domínio/referrer). */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Fallback sem prefixo VITE (alguns ambientes de build). */
  readonly GEMINI_API_KEY?: string;
  /** Opcional: sobrescreve o modelo padrão (ex.: gemini-2.0-flash, gemini-2.0-flash-exp). */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

