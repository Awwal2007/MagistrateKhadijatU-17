import React, { useEffect, useState, useRef } from "react";
import { Clock, Zap } from "lucide-react";
import { Match } from "../types.js";

interface GoalNotification {
  id: string;
  teamName: string;
  score: string;
}

export const LiveMarquee: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const liveMatches = matches.filter(m => m.status === "Live");
  const [now, setNow] = useState(Date.now());
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);
  const prevScoresRef = useRef<Record<string, { home: number; away: number }>>({});

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Detect score updates for live matches
    liveMatches.forEach(m => {
      const prev = prevScoresRef.current[m._id];
      const currentHome = m.homeScore || 0;
      const currentAway = m.awayScore || 0;

      // Trigger notification if score increased from previous state
      if (prev && (currentHome > prev.home || currentAway > prev.away)) {
        const scoringTeam = currentHome > prev.home ? m.homeTeamName : m.awayTeamName;
        const newNotif: GoalNotification = {
          id: `${m._id}-${Date.now()}`,
          teamName: scoringTeam,
          score: `${currentHome} - ${currentAway}`
        };

        setNotifications(prevNotifs => [...prevNotifs, newNotif]);
        
        // Automatically clear notification after 6 seconds
        setTimeout(() => {
          setNotifications(curr => curr.filter(n => n.id !== newNotif.id));
        }, 6000);
      }
      // Save current state as baseline for next update
      prevScoresRef.current[m._id] = { home: currentHome, away: currentAway };
    });
  }, [matches]);

  if (liveMatches.length === 0 && notifications.length === 0) return null;

  return (
    <div className="relative z-20 no-print">
      {/* GOAL POPUP OVERLAY */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className="bg-[#FFD700] text-[#0a3d0a] px-6 py-2 rounded-full font-black text-[10px] sm:text-xs shadow-2xl flex items-center gap-2 animate-bounce border-2 border-[#0a3d0a] pointer-events-auto"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span className="uppercase tracking-widest">GOAL! {notif.teamName} ({notif.score})</span>
          </div>
        ))}
      </div>

      <div className={`bg-[#0a3d0a] text-[#FFD700] py-2 overflow-hidden border-b border-[#FFD700]/30 shadow-inner transition-all duration-500 ${notifications.length > 0 ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
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
    </div>
  );
};