import { describe, expect, it } from 'vitest';
import { getCurrentSlotKey, getNextAlignedRunDate } from '../../utils/jiraAutoSyncTiming';

const at = (hours: number, minutes: number) => new Date(2026, 6, 1, hours, minutes, 30, 500);

describe('jiraAutoSyncTiming', () => {
  it('getCurrentSlotKey alinha ao slot de 20 minutos', () => {
    expect(getCurrentSlotKey(at(10, 7), 20)).toBe(getCurrentSlotKey(at(10, 0), 20));
    expect(getCurrentSlotKey(at(10, 25), 20)).toBe(getCurrentSlotKey(at(10, 20), 20));
  });

  it('getNextAlignedRunDate retorna o próximo slot após now', () => {
    const nextFrom1007 = getNextAlignedRunDate(at(10, 7), 20);
    expect(nextFrom1007.getHours()).toBe(10);
    expect(nextFrom1007.getMinutes()).toBe(20);

    const nextFrom1020 = getNextAlignedRunDate(at(10, 20), 20);
    expect(nextFrom1020.getHours()).toBe(10);
    expect(nextFrom1020.getMinutes()).toBe(40);
  });
});
