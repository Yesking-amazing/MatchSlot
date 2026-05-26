const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fmtTimeRange(start: string, durationMin: number): string {
  const d = new Date(start);
  const end = new Date(d.getTime() + durationMin * 60000);
  return `${fmtTime(start)} – ${fmtTime(end.toISOString())}`;
}

export function getMonthAbbr(d: Date): string {
  return MONTHS[d.getMonth()];
}

export function getDayAbbr(d: Date): string {
  return DAYS[d.getDay()];
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (dateStr: string): string => {
  return fmtTime(dateStr);
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const calculateDuration = (startStr: string, endStr: string): number => {
  return Math.round((new Date(endStr).getTime() - new Date(startStr).getTime()) / 60000);
};

export const isSlotExpired = (startTimeStr: string): boolean => {
  return new Date(startTimeStr) < new Date();
};

export const formatTimeRange = (startStr: string, endStr: string): string => {
  return `${fmtTime(startStr)} - ${fmtTime(endStr)}`;
};
