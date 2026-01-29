/**
 * Date and time formatting utilities
 */

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short'
  });
};

export const calculateDuration = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

export const isSlotExpired = (startTimeStr: string): boolean => {
  const startTime = new Date(startTimeStr);
  const now = new Date();
  return startTime < now;
};

export const formatTimeRange = (startStr: string, endStr: string): string => {
  const start = formatTime(startStr);
  const end = formatTime(endStr);
  return `${start} - ${end}`;
};
