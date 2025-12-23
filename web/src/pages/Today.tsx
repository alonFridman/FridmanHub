import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../api";
import { EventCard } from "../components/EventCard";
import { NowIndicator } from "../components/NowIndicator";
import { useIdToken } from "../hooks/useIdToken";
import { UnifiedEvent } from "../types";
import { getDateRangeForToday } from "../utils/date";

export const Today = () => {
  const token = useIdToken();
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { start, end } = useMemo(() => getDateRangeForToday(), []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEvents(token, start, end);
        if (mounted) {
          setEvents(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
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

  return (
    <section className="tv-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Today</h2>
        <div className="text-body text-white/80">Auto-refreshes every 5 minutes</div>
      </div>
      <NowIndicator />
      {loading && <div className="text-body">Loading events…</div>}
      {error && <div className="text-body text-alert">{error}</div>}
      {!loading && events.length === 0 && (
        <div className="text-body text-white/80">No events scheduled for today.</div>
      )}
      <div className="flex flex-col">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
};
