import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../api";
import { EventCard } from "../components/EventCard";
import { useIdToken } from "../hooks/useIdToken";
import { UnifiedEvent } from "../types";
import { formatDayLabel, getDateRangeForWeek, isToday } from "../utils/date";

export const Week = () => {
  const token = useIdToken();
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { start, end } = useMemo(() => getDateRangeForWeek(), []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEvents(token, start, end);
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, start, end]);

  const grouped = useMemo(() => {
    const buckets: Record<string, UnifiedEvent[]> = {};
    events.forEach((event) => {
      const dateKey = event.start.split("T")[0];
      buckets[dateKey] = buckets[dateKey] || [];
      buckets[dateKey].push(event);
    });
    Object.values(buckets).forEach((list) =>
      list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    );
    return buckets;
  }, [events]);

  const orderedDays = useMemo(() => {
    const startDate = new Date(start);
    return Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + idx);
      const iso = date.toISOString().split("T")[0];
      return iso;
    });
  }, [start]);

  return (
    <section className="tv-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">This Week</h2>
        <div className="text-body text-white/80">Auto-refreshes every 5 minutes</div>
      </div>
      {loading && <div className="text-body">Loading events…</div>}
      {error && <div className="text-body text-alert">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderedDays.map((day) => (
          <div key={day} className="bg-white/5 rounded-xl p-4">
            <div
              className={`text-title font-semibold mb-3 ${isToday(day) ? "text-highlight" : "text-white"}`}
            >
              {formatDayLabel(day)}
            </div>
            <div className="flex flex-col">
              {(grouped[day] || []).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {(grouped[day] || []).length === 0 && (
                <div className="text-body text-white/70">No events.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
