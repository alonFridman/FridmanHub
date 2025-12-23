import { useEffect, useMemo, useState } from "react";
import { fetchCalendars, fetchConfig, saveConfig } from "../api";
import { useIdToken } from "../hooks/useIdToken";
import { CalendarOption, FamilyConfig, Kid, SchoolSchedule } from "../types";

const paletteOptions = [
  { label: "Primary", value: "#5A9CB5" },
  { label: "Highlight", value: "#FACE68" },
  { label: "Secondary", value: "#FAAC68" },
  { label: "Alert", value: "#FA6868" },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Setup = () => {
  const token = useIdToken();
  const [config, setConfig] = useState<FamilyConfig>({ timezone: "UTC" });
  const [kids, setKids] = useState<Kid[]>([]);
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const dadCalendars = useMemo(() => calendars.filter((c) => c.owner === "dad"), [calendars]);
  const momCalendars = useMemo(() => calendars.filter((c) => c.owner === "mom"), [calendars]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [calendarData, configData] = await Promise.all([
          fetchCalendars(token),
          fetchConfig(token),
        ]);
        setCalendars(calendarData);
        setConfig({ timezone: "UTC", ...configData.config });
        setKids(configData.kids as Kid[]);
        setSchedules(configData.schoolSchedules as SchoolSchedule[]);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [token]);

  const addKid = () => {
    const id = crypto.randomUUID();
    setKids([...kids, { id, name: "New Kid", color: "#FAAC68" }]);
  };

  const updateKid = (id: string, field: keyof Kid, value: string) => {
    setKids(kids.map((kid) => (kid.id === id ? { ...kid, [field]: value } : kid)));
  };

  const addSchedule = () => {
    const id = crypto.randomUUID();
    if (kids.length === 0) return;
    setSchedules([
      ...schedules,
      { id, childId: kids[0].id, dayOfWeek: 1, startTime: "08:00", endTime: "15:00", title: "School" },
    ]);
  };

  const updateSchedule = (id: string, field: keyof SchoolSchedule, value: string | number) => {
    setSchedules(schedules.map((schedule) => (schedule.id === id ? { ...schedule, [field]: value } : schedule)));
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id));
  };

  const handleSave = async () => {
    if (!token) return;
    setStatus("Saving…");
    try {
      await saveConfig(token, { config, kids, schoolSchedules: schedules });
      setStatus("Saved successfully");
    } catch (err: any) {
      setStatus(err.message || "Failed to save");
    }
  };

  return (
    <section className="tv-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Setup</h2>
        <div className="text-body text-white/80">Configure calendars and school schedule</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-title font-semibold mb-4">Calendars</h3>
          <div className="space-y-4 text-black">
            <label className="block">
              <span className="text-body text-white">Dad calendar</span>
              <select
                value={config.dadCalendarId || ""}
                onChange={(e) => setConfig({ ...config, dadCalendarId: e.target.value })}
                className="mt-2 w-full p-3 rounded-lg text-black"
              >
                <option value="">Select calendar</option>
                {dadCalendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-body text-white">Mom calendar</span>
              <select
                value={config.momCalendarId || ""}
                onChange={(e) => setConfig({ ...config, momCalendarId: e.target.value })}
                className="mt-2 w-full p-3 rounded-lg text-black"
              >
                <option value="">Select calendar</option>
                {momCalendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-body text-white">Timezone</span>
              <input
                className="mt-2 w-full p-3 rounded-lg text-black"
                value={config.timezone || ""}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                placeholder="e.g. America/Los_Angeles"
              />
            </label>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-title font-semibold">Kids</h3>
            <button className="tv-button" onClick={addKid}>
              Add kid
            </button>
          </div>
          <div className="space-y-3">
            {kids.map((kid) => (
              <div key={kid.id} className="bg-white rounded-lg p-3 text-black">
                <input
                  className="w-full p-2 rounded mb-2"
                  value={kid.name}
                  onChange={(e) => updateKid(kid.id, "name", e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  {paletteOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateKid(kid.id, "color", option.value)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        kid.color === option.value ? "border-highlight" : "border-transparent"
                      }`}
                      style={{ backgroundColor: option.value }}
                    ></button>
                  ))}
                </div>
              </div>
            ))}
            {kids.length === 0 && <div className="text-white/80">Add kids to generate school schedule.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-title font-semibold">Weekly school schedule</h3>
          <button className="tv-button" onClick={addSchedule} disabled={kids.length === 0}>
            Add entry
          </button>
        </div>
        {kids.length === 0 && <div className="text-white/80">Add a kid first.</div>}
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg p-3 text-black">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <select
                  value={schedule.childId}
                  onChange={(e) => updateSchedule(schedule.id, "childId", e.target.value)}
                  className="p-2 rounded"
                >
                  {kids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.name}
                    </option>
                  ))}
                </select>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => updateSchedule(schedule.id, "dayOfWeek", Number(e.target.value))}
                  className="p-2 rounded"
                >
                  {dayNames.map((day, idx) => (
                    <option key={day} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(schedule.id, "startTime", e.target.value)}
                    className="p-2 rounded w-full"
                  />
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(schedule.id, "endTime", e.target.value)}
                    className="p-2 rounded w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={schedule.title}
                    onChange={(e) => updateSchedule(schedule.id, "title", e.target.value)}
                    className="p-2 rounded w-full"
                  />
                  <button
                    className="px-3 py-2 rounded bg-alert text-black font-semibold"
                    onClick={() => removeSchedule(schedule.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button className="tv-button" onClick={handleSave}>
          Save configuration
        </button>
        {status && <span className="text-body">{status}</span>}
      </div>
    </section>
  );
};
