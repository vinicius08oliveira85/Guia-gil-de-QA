import { describe, it, expect, beforeEach } from 'vitest';
import {
  addGeminiKey,
  getGeminiKeysConfig,
  getGeminiConfig,
  getGeminiEnvKeyInfo,
  maskGeminiApiKey,
  removeGeminiKey,
  reorderGeminiKeys,
  saveGeminiConfig,
  updateGeminiKey,
} from '../../services/geminiConfigService';

describe('geminiConfigService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addGeminiKey persiste entrada com nome e prioridade', () => {
    addGeminiKey({ name: 'Conta A', apiKey: 'AIzaSyABCDEFGHIJ' });
    const config = getGeminiKeysConfig();
    expect(config.keys).toHaveLength(1);
    expect(config.keys[0].name).toBe('Conta A');
    expect(config.keys[0].priority).toBe(0);
  });

  it('saveGeminiConfig legado upsert na primeira chave', () => {
    saveGeminiConfig({ apiKey: 'AIzaSyOLDKEY123456' });
    saveGeminiConfig({ apiKey: 'AIzaSyNEWKEY123456' });
    expect(getGeminiConfig()?.apiKey).toBe('AIzaSyNEWKEY123456');
    expect(getGeminiKeysConfig().keys).toHaveLength(1);
  });

  it('reorderGeminiKeys altera ordem de fallback', () => {
    const a = addGeminiKey({ name: 'A', apiKey: 'AIzaSyAAAAAAAAAA' });
    const b = addGeminiKey({ name: 'B', apiKey: 'AIzaSyBBBBBBBBBB' });
    reorderGeminiKeys([b.id, a.id]);
    const names = getGeminiKeysConfig().keys.map(k => k.name);
    expect(names).toEqual(['B', 'A']);
  });

  it('updateGeminiKey e removeGeminiKey funcionam', () => {
    const entry = addGeminiKey({ name: 'Temp', apiKey: 'AIzaSyTEMPKEY1234' });
    updateGeminiKey(entry.id, { name: 'Renomeada', enabled: false });
    expect(getGeminiKeysConfig().keys[0].name).toBe('Renomeada');
    expect(getGeminiKeysConfig().keys[0].enabled).toBe(false);
    expect(removeGeminiKey(entry.id)).toBe(true);
    expect(getGeminiKeysConfig().keys).toHaveLength(0);
  });

  it('migra formato legado gemini_api_key', () => {
    localStorage.setItem('gemini_api_key', JSON.stringify({ apiKey: 'AIzaSyLEGACYKEY12' }));
    const config = getGeminiKeysConfig();
    expect(config.keys).toHaveLength(1);
    expect(config.keys[0].name).toBe('Principal');
    expect(localStorage.getItem('gemini_api_keys')).toBeTruthy();
    expect(localStorage.getItem('gemini_api_key')).toBeNull();
  });

  it('maskGeminiApiKey mascara chave longa', () => {
    expect(maskGeminiApiKey('AIzaSy1234567890abcd')).toContain('…');
  });

  it('getGeminiEnvKeyInfo retorna null sem variável de ambiente', () => {
    expect(getGeminiEnvKeyInfo()).toBeNull();
  });
});
