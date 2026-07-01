import { JIRA_AUTO_SYNC_INTERVAL_MINUTES } from './jiraAutoSyncConstants';

/**
 * Retorna a chave do slot atual alinhado ao relógio (ex.: :00, :20, :40).
 */
export function getCurrentSlotKey(
  now = new Date(),
  intervalMinutes = JIRA_AUTO_SYNC_INTERVAL_MINUTES
): string {
  const slot = new Date(now);
  slot.setSeconds(0, 0);
  slot.setMilliseconds(0);

  const slotMinutes =
    Math.floor((slot.getHours() * 60 + slot.getMinutes()) / intervalMinutes) * intervalMinutes;

  slot.setHours(Math.floor(slotMinutes / 60), slotMinutes % 60);
  return slot.toISOString();
}

/**
 * Calcula o próximo horário alinhado após `now` (nunca o slot atual).
 */
export function getNextAlignedRunDate(
  now = new Date(),
  intervalMinutes = JIRA_AUTO_SYNC_INTERVAL_MINUTES
): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMilliseconds(0);

  const totalMinutes = next.getHours() * 60 + next.getMinutes();
  const nextSlotMinutes = Math.ceil((totalMinutes + 1) / intervalMinutes) * intervalMinutes;

  const dayOffset = Math.floor(nextSlotMinutes / (24 * 60));
  const normalizedMinutes = nextSlotMinutes % (24 * 60);

  next.setHours(Math.floor(normalizedMinutes / 60));
  next.setMinutes(normalizedMinutes % 60);

  if (dayOffset > 0) {
    next.setDate(next.getDate() + dayOffset);
  }

  return next;
}
