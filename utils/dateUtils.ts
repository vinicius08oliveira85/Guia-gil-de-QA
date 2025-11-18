import { format, formatDistance, formatRelative, isToday, isYesterday, isTomorrow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Hoje';
  }
  
  if (isYesterday(dateObj)) {
    return 'Ontem';
  }
  
  if (isTomorrow(dateObj)) {
    return 'Amanhã';
  }
  
  const daysDiff = differenceInDays(new Date(), dateObj);
  
  if (daysDiff < 7) {
    return formatRelative(dateObj, new Date(), { locale: ptBR });
  }
  
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: ptBR });
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};

export const getTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, dateObj);
  
  if (minutesDiff < 1) {
    return 'Agora';
  }
  
  if (minutesDiff < 60) {
    return `${minutesDiff}min atrás`;
  }
  
  const hoursDiff = differenceInHours(now, dateObj);
  
  if (hoursDiff < 24) {
    return `${hoursDiff}h atrás`;
  }
  
  const daysDiff = differenceInDays(now, dateObj);
  
  if (daysDiff < 7) {
    return `${daysDiff}d atrás`;
  }
  
  return formatDate(dateObj);
};

