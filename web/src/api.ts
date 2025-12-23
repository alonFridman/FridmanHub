import { ConfigResponse, FamilyConfig, Kid, SchoolSchedule, UnifiedEvent, CalendarOption } from "./types";

const functionsOrigin = import.meta.env.VITE_FUNCTIONS_ORIGIN || "";

const withAuthHeaders = (token: string | null) => ({
  Authorization: token ? `Bearer ${token}` : "",
  "Content-Type": "application/json",
});

export const fetchEvents = async (
  token: string | null,
  start: string,
  end: string
): Promise<UnifiedEvent[]> => {
  const response = await fetch(`${functionsOrigin}/events/range?start=${start}&end=${end}`, {
    headers: withAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load events");
  }
  const { events } = await response.json();
  return events as UnifiedEvent[];
};

export const fetchCalendars = async (token: string | null): Promise<CalendarOption[]> => {
  const response = await fetch(`${functionsOrigin}/calendar/list`, {
    headers: withAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load calendars");
  }
  const data = await response.json();
  return data.calendars as CalendarOption[];
};

export const fetchConfig = async (token: string | null): Promise<ConfigResponse> => {
  const response = await fetch(`${functionsOrigin}/config`, {
    headers: withAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load config");
  }
  return (await response.json()) as ConfigResponse;
};

export const saveConfig = async (
  token: string | null,
  payload: {
    config: FamilyConfig;
    kids: Kid[];
    schoolSchedules: SchoolSchedule[];
  }
) => {
  const response = await fetch(`${functionsOrigin}/config`, {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to save config");
  }
  return response.json();
};
