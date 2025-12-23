import { UnifiedEvent } from "../types";
import { formatTime, isNowBetween } from "../utils/date";

const ownerBadge = (owner: UnifiedEvent["owner"]) => {
  if (owner.startsWith("kid:")) return "bg-secondary text-black";
  return "bg-white text-black";
};

export const EventCard = ({ event }: { event: UnifiedEvent }) => {
  const active = isNowBetween(event.start, event.end);
  return (
    <div
      className={`event-card ${ownerBadge(event.owner)} ${
        active ? "ring-4 ring-highlight" : ""
      }`}
      tabIndex={0}
    >
      <div className="flex justify-between items-center">
        <div className="text-title font-semibold">{event.title}</div>
        <span className="text-sm uppercase tracking-wide text-black/60">{event.owner}</span>
      </div>
      <div className="text-body font-medium mt-2 text-black/80">
        {event.allDay ? "All day" : `${formatTime(event.start)} – ${formatTime(event.end)}`}
      </div>
      {event.source === "school" && (
        <div className="mt-2 text-sm text-black/70">School schedule</div>
      )}
    </div>
  );
};
