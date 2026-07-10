import { describe, it, expect } from 'vitest';
import {
  getJiraStatusColor,
  resolveJiraStatusColorForStorage,
  resolveJiraStatusColorFromPalette,
} from '../../utils/jiraStatusColors';

describe('jiraStatusColors', () => {
  describe('resolveJiraStatusColorForStorage', () => {
    it('prioriza heurística por nome em vez de statusCategory yellow genérico', () => {
      const color = resolveJiraStatusColorForStorage('PENDENTE PROJETO INTERNO', {
        key: 'indeterminate',
        colorName: 'yellow',
      });
      expect(color).toBe('#42526e');
    });

    it('usa statusCategory quando o nome não é classificado', () => {
      const color = resolveJiraStatusColorForStorage('Status Customizado XYZ', {
        key: 'done',
        colorName: 'green',
      });
      expect(color).toBe('#00875a');
    });
  });

  describe('resolveJiraStatusColorFromPalette', () => {
    const susPalette = [
      { name: 'AGUARDANDO PELO SUPORTE', color: '#f5cd47' },
      { name: 'PENDENTE PROJETO INTERNO', color: '#f5cd47' },
      { name: 'ESCALATED', color: '#f5cd47' },
      { name: 'ABERTO', color: '#f5cd47' },
    ];

    it('ignora paleta genérica (tudo yellow) quando heurística distingue status', () => {
      expect(resolveJiraStatusColorFromPalette('AGUARDANDO PELO SUPORTE', susPalette)).toBe(
        '#f5cd47'
      );
      expect(resolveJiraStatusColorFromPalette('PENDENTE PROJETO INTERNO', susPalette)).toBe(
        '#42526e'
      );
      expect(resolveJiraStatusColorFromPalette('ESCALATED', susPalette)).toBe('#0052cc');
      expect(resolveJiraStatusColorFromPalette('ABERTO', susPalette)).toBe('#42526e');
    });

    it('usa paleta quando heurística não classifica o nome', () => {
      const palette = [{ name: 'Status Raro Interno', color: '#6554c0' }];
      expect(resolveJiraStatusColorFromPalette('Status Raro Interno', palette)).toBe('#6554c0');
      expect(getJiraStatusColor('Status Raro Interno')).toBe('#42526e');
    });

    it('funciona sem paleta (mesmo comportamento do localhost com storage limpo)', () => {
      expect(resolveJiraStatusColorFromPalette('AGUARDANDO CLIENTE', null)).toBe('#f5cd47');
      expect(resolveJiraStatusColorFromPalette('PENDENTE SOLUS', undefined)).toBe('#42526e');
    });
  });
});
