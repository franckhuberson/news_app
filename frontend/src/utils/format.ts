// src/utils/format.ts

import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: fr 
    });
  } catch {
    return 'date inconnue';
  }
};

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return 'date inconnue';
  }
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status: string): string => {
  const colors = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    modified: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };
  return colors[status as keyof typeof colors] || colors.pending;
};

export const getStatusLabel = (status: string): string => {
  const labels = {
    pending: 'En attente',
    published: 'Publié',
    rejected: 'Rejeté',
    modified: 'Modifié',
  };
  return labels[status as keyof typeof labels] || status;
};