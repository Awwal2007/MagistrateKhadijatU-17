import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Match } from "../types.js";

export const LiveMarquee: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const liveMatches = matches.filter(m => m.status === "Live");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-[#0a3d0a] text-[#FFD700] py-2 overflow-hidden border-b border-[#FFD700]/30 shadow-inner relative z-20 no-print">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
      <div className="animate-marquee">
        {[...liveMatches, ...liveMatches].map((m, idx) => {
          let displayTime = "0:00";
          const accumulated = m.timerAccumulatedTime || 0;
          const lastStartedTime = m.timerLastStarted ? new Date(m.timerLastStarted).getTime() : 0;
          const diff = lastStartedTime > 0 ? Math.floor((now - lastStartedTime) / 1000) : 0;
          const totalSecs = Math.max(0, accumulated + diff);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          displayTime = `${mins}:${secs.toString().padStart(2, "0")}`;

          return (
            <div key={`${m._id}-${idx}`} className="flex items-center gap-6 px-12 border-r border-[#FFD700]/20">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bebas text-sm tracking-widest">LIVE NOW</span>
              </div>
              <div className="flex items-center gap-3 font-bold text-xs">
                <span className="uppercase">{m.homeTeamName}</span>
                <span className="bg-[#FFD700] text-[#0a3d0a] px-2 py-0.5 rounded-md font-black text-sm">
                  {m.homeScore || 0} - {m.awayScore || 0}
                </span>
                <span className="uppercase">{m.awayTeamName}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-[#FFD700]/10">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-xs font-bold">{displayTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};