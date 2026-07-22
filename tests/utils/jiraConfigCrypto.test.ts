import { describe, it, expect } from 'vitest';
import { encryptConfig, decryptConfig } from '../../utils/jiraConfigCrypto';
import type { JiraConfig } from '../../services/jira/types';

describe('jiraConfigCrypto', () => {
  const config: JiraConfig = {
    url: 'https://mycompany.atlassian.net',
    email: 'user@company.com',
    apiToken: 'my-secret-token-12345',
  };

  it('encryptConfig ofusca o apiToken', () => {
    const encrypted = encryptConfig(config);
    expect(encrypted.apiToken).not.toBe(config.apiToken);
    expect(encrypted.apiToken).toMatch(/^enc:.+/);
    expect(encrypted.url).toBe(config.url);
    expect(encrypted.email).toBe(config.email);
  });

  it('decryptConfig reverte o ofuscamento', () => {
    const encrypted = encryptConfig(config);
    const decrypted = decryptConfig(encrypted);
    expect(decrypted.apiToken).toBe(config.apiToken);
    expect(decrypted.url).toBe(config.url);
    expect(decrypted.email).toBe(config.email);
  });

  it('decryptConfig retorna config original se não estiver ofuscada', () => {
    const result = decryptConfig(config);
    expect(result).toEqual(config);
  });

  it('encrypt/decrypt roundtrip preserva todo o objeto', () => {
    const encrypted = encryptConfig(config);
    const decrypted = decryptConfig(encrypted);
    expect(decrypted).toEqual(config);
  });
});
