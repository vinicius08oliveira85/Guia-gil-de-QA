/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

/** File System Access API (Chromium) — usado em backup local. */
interface Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle[]>;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  /** Chave da API Google Gemini (exposta no bundle Vite; use apenas chaves restritas por domínio/referrer). */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Fallback sem prefixo VITE (alguns ambientes de build). */
  readonly GEMINI_API_KEY?: string;
  /** Opcional: sobrescreve o modelo padrão (ex.: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash-latest). */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
