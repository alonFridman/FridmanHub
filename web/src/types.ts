export type UnifiedEvent = {
  id: string;
  source: "google" | "school";
  owner: "dad" | "mom" | `kid:${string}`;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

export type CalendarOption = {
  id: string;
  summary?: string | null;
  owner: "dad" | "mom";
  primary?: boolean | null;
};

export type Kid = {
  id: string;
  name: string;
  color: string;
};

export type SchoolSchedule = {
  id: string;
  childId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
};

export type FamilyConfig = {
  dadCalendarId?: string;
  momCalendarId?: string;
  timezone?: string;
};

export type ConfigResponse = {
  config: FamilyConfig;
  kids: Kid[];
  schoolSchedules: SchoolSchedule[];
};
