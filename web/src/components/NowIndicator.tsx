import { useEffect, useState } from "react";

export const NowIndicator = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 text-black">
      <div className="h-1 flex-1 bg-highlight"></div>
      <div className="px-3 py-1 rounded-full bg-highlight font-semibold text-black shadow-lg">
        Now: {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="h-1 flex-1 bg-highlight"></div>
    </div>
  );
};
