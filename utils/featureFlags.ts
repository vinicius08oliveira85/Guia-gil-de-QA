/**
 * Supabase só é usado quando explicitamente habilitado (`VITE_ENABLE_SUPABASE=true`).
 * `VITE_LOCAL_ONLY=true` força modo 100% local.
 */
export function isSupabaseFeatureEnabled(): boolean {
  if (import.meta.env.VITE_LOCAL_ONLY === 'true') return false;
  return import.meta.env.VITE_ENABLE_SUPABASE === 'true';
}
