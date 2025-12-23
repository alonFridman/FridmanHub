export const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDayLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

export const getDateRangeForToday = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const getDateRangeForWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToSunday = now.getDate() - day;
  const start = new Date(now);
  start.setDate(diffToSunday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const isToday = (iso: string) => {
  const target = new Date(iso);
  const today = new Date();
  return target.toDateString() === today.toDateString();
};

export const isNowBetween = (start: string, end: string) => {
  const now = new Date();
  return now >= new Date(start) && now <= new Date(end);
};
