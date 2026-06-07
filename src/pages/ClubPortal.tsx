import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Printer, Users, UserCheck, ShieldAlert, BadgeCheck, AlertCircle, RefreshCw, Layers, Zap, Clock } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";
import { PlayerForm } from "../components/PlayerForm.js";
import { OfficialForm } from "../components/OfficialForm.js";
import { TournamentHub } from "../components/TournamentHub.js";
import { Match } from "../types.js";
import tournamentLogo from "../assets/logo.jpeg";

const FORMATIONS: Record<string, { def: number; mid: number; fwd: number }> = {
  "4-4-2": { def: 4, mid: 4, fwd: 2 },
  "4-3-3": { def: 4, mid: 3, fwd: 3 },
  "3-5-2": { def: 3, mid: 5, fwd: 2 },
  "3-4-3": { def: 3, mid: 4, fwd: 3 },
  "5-3-2": { def: 5, mid: 3, fwd: 2 },
  "4-5-1": { def: 4, mid: 5, fwd: 1 },
};

const LiveMarquee: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const liveMatches = matches.filter(m => m.status === "Live");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-[#0a3d0a] text-[#FFD700] py-2 overflow-hidden border-b border-[#FFD700]/30 shadow-inner relative z-20">
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
                <span className="bg-[#FFD700] text-[#0a3d0a] px-2 py-0.5 rounded-md font-black text-sm">{m.homeScore || 0} - {m.awayScore || 0}</span>
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

export const ClubPortal: React.FC = () => {
  const navigate = useNavigate();
  const {
    authToken,
    currentTeam,
    rosterPlayers,
    rosterOfficials,
    fetchRoster,
    setRosterData,
    logout
  } = useRegistration();

  const [loading, setLoading] = useState(true);
  const [errorOnLoad, setErrorOnLoad] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<"roster" | "tournament" | "fixtures" | "lineup">("roster");
  const fixturesRef = useRef<HTMLDivElement>(null);

  // Form modals state
  const [showPlayerModal, setShowPlayerModal] = useState<"Under-17" | "Free Age" | null>(null);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [selectedMatchForLineup, setSelectedMatchForLineup] = useState<Match | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken || !currentTeam) {
      navigate("/login");
      return;
    }
    loadRoster();
    loadMatches();
    const interval = setInterval(loadMatches, 20000);
    return () => clearInterval(interval);
  }, [authToken, currentTeam]);

  const loadMatches = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error("Match load error:", err);
    }
  };

  const loadRoster = async () => {
    setLoading(true);
    setErrorOnLoad(null);
    try {
      await fetchRoster();
    } catch (err: any) {
      console.error("Fetch Roster error:", err);
      setErrorOnLoad("Unable to synchronize roster databases with server registry.");
    } finally {
      setLoading(false);
    }
  };

  // Quotas calculations
  const u17Count = rosterPlayers.filter(p => p.category === "Under-17").length;
  const freeAgeCount = rosterPlayers.filter(p => p.category === "Free Age").length;
  const totalPlayers = rosterPlayers.length;
  const totalOfficials = rosterOfficials.length;

  const handleAddPlayer = async (player: {
    name: string;
    age: number;
    position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
    category: "Under-17" | "Free Age";
    photo: string;
  }) => {
    setActionError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${currentTeam?.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(player)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to commit player database registration.");
      }

      await loadRoster();
      setShowPlayerModal(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddOfficial = async (official: {
    name: string;
    position: "Head Coach" | "Assistant Coach" | "Team Doctor" | "Kit Manager" | "Manager";
    photo: string;
  }) => {
    setActionError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${currentTeam?.id}/officials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(official)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to commit official database registration.");
      }

      await loadRoster();
      setShowOfficialModal(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const triggerPrintAll = () => {
    window.print();
  };

  const handleTabChange = (tab: "roster" | "tournament" | "fixtures" | "lineup") => {
    setActiveTab(tab);
    
    // Scroll to fixtures section on mobile when fixtures tab is clicked
    if (tab === "fixtures" && fixturesRef.current) {
      setTimeout(() => {
        fixturesRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const handleSaveLineup = async (matchId: string, formation: string, starting11: string[], bench: string[]) => {
    if (starting11.length !== 11) {
      setActionError("A valid lineup must have exactly 11 starting players.");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches/${matchId}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ formation, starting11, bench })
      });
      if (!res.ok) throw new Error("Failed to save lineup");
      await loadMatches();
      setSelectedMatchForLineup(null);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // FIXED: Single, complete LineupEditor component
  const LineupEditor = ({ match }: { match: Match }) => {
    const isHome = match.homeTeamId === currentTeam?.id;
    const existingLineup = isHome ? match.homeLineup : match.awayLineup;
    const [formation, setFormation] = useState(existingLineup?.formation || "4-4-2");
    const [tempStarting, setTempStarting] = useState<string[]>(existingLineup?.starting11 || []);
    const [tempBench, setTempBench] = useState<string[]>(existingLineup?.bench || []);

    const config = FORMATIONS[formation];
    
    const getPositionCounts = (starters: string[]) => {
      return {
        GK: starters.filter(id => rosterPlayers.find(p => p._id === id)?.position === "Goalkeeper").length,
        DEF: starters.filter(id => rosterPlayers.find(p => p._id === id)?.position === "Defender").length,
        MID: starters.filter(id => rosterPlayers.find(p => p._id === id)?.position === "Midfielder").length,
        FWD: starters.filter(id => rosterPlayers.find(p => p._id === id)?.position === "Forward").length,
      };
    };

    const counts = getPositionCounts(tempStarting);

    const tryAddStarter = (player: any): boolean => {
      if (tempStarting.length >= 11) return false;
      
      const pos = player.position;
      if (pos === "Goalkeeper" && counts.GK >= 1) return false;
      if (pos === "Defender" && counts.DEF >= config.def) return false;
      if (pos === "Midfielder" && counts.MID >= config.mid) return false;
      if (pos === "Forward" && counts.FWD >= config.fwd) return false;

      setTempStarting([...tempStarting, player._id]);
      return true;
    };

    const togglePlayer = (id: string) => {
      const player = rosterPlayers.find(p => p._id === id);
      if (!player) return;

      if (tempStarting.includes(id)) {
        // Move from starting to bench
        setTempStarting(tempStarting.filter(pid => pid !== id));
        if (!tempBench.includes(id)) {
          setTempBench([...tempBench, id]);
        }
      } else if (tempBench.includes(id)) {
        // Move from bench to starting
        setTempBench(tempBench.filter(pid => pid !== id));
        tryAddStarter(player);
      } else {
        // Add new player - try starting first, then bench
        if (!tryAddStarter(player)) {
          setTempBench([...tempBench, id]);
        }
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Pitch Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Formation</label>
              <select 
                value={formation}
                onChange={(e) => { setFormation(e.target.value); setTempStarting([]); setTempBench([]); }}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 ring-emerald-500/20"
              >
                {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="relative aspect-[3/4] bg-emerald-600 rounded-[2rem] overflow-hidden border-4 border-white/20 p-6 flex flex-col justify-between">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-24 border border-white/20 rounded-full" />

              {["Forward", "Midfielder", "Defender", "Goalkeeper"].map(pos => (
                <div key={pos} className="flex justify-around items-center w-full z-10 min-h-[40px]">
                  {tempStarting.map(id => rosterPlayers.find(p => p._id === id)).filter(p => p?.position === pos).map(p => (
                    <div key={p?._id} className="flex flex-col items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center border-2 border-emerald-800 shadow-md">
                        <span className="text-[10px] font-black text-emerald-900">#{p?.jerseyNumber}</span>
                      </div>
                      <span className="text-[8px] font-bold text-white uppercase bg-black/40 px-1.5 rounded mt-1">{p?.name.split(' ').pop()}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'GK', cur: counts.GK, max: 1 },
                { label: 'DEF', cur: counts.DEF, max: config.def },
                { label: 'MID', cur: counts.MID, max: config.mid },
                { label: 'FWD', cur: counts.FWD, max: config.fwd },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase">{s.label}</p>
                  <p className={`text-xs font-black ${s.cur === s.max ? 'text-emerald-600' : 'text-slate-700'}`}>{s.cur}/{s.max}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setSelectedMatchForLineup(null)} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition">Discard</button>
            <button 
              onClick={() => handleSaveLineup(match._id, formation, tempStarting, tempBench)} 
              className="flex-[2] py-3 bg-[#0a3d0a] text-[#FFD700] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 transition disabled:opacity-50"
              disabled={tempStarting.length !== 11}
            >
              Confirm Lineup
            </button>
          </div>
        </div>

        {/* Right Side: Selection List Grouped by Position */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bebas text-2xl text-slate-800 tracking-wide uppercase">Tactical Selection</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fill your {formation} formation by selecting players for each line</p>
          </div>
          
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(pos => (
              <div key={pos} className="space-y-3">
                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-2">{pos}s</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rosterPlayers.filter(p => p.position === pos).map(p => {
                    const isStarting = tempStarting.includes(p._id);
                    const isBench = tempBench.includes(p._id);
                    return (
                      <button 
                        key={p._id} 
                        onClick={() => togglePlayer(p._id)} 
                        className={`p-3 rounded-xl border-2 text-left transition flex items-center justify-between gap-3 ${
                          isStarting ? 'border-emerald-500 bg-emerald-50' : 
                          isBench ? 'border-amber-400 bg-amber-50' : 
                          'border-slate-100 bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase truncate text-slate-800">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">#{p.jerseyNumber}</p>
                        </div>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isStarting ? 'bg-emerald-500 text-white' : 
                          isBench ? 'bg-amber-400 text-white' : 
                          'bg-slate-200 text-slate-500'
                        }`}>
                          {isStarting ? "XI" : isBench ? "SUB" : "ADD"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-[#0a3d0a] animate-spin" />
        <span className="text-xs font-semibold text-[#0a3d0a] uppercase tracking-widest">Compiling Team Roster Ledger...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] pb-24 font-sans animate-fade-in">
      
      {/* GLOBAL NO-PRINT HEADER NAVBAR */}
      <nav className="green-mesh border-b-4 border-[#FFD700] text-white py-4 px-4 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={tournamentLogo} alt="Magistrate Khadijat Oloyade U17" className="h-8 w-8 rounded-full border border-[#FFD700] bg-white object-cover shadow-sm" />
            <div>
              <h1 className="font-bebas text-lg tracking-wider text-[#FFD700] leading-none uppercase">
                Magistrate Khadijat Oloyade U-17 CUP PORTAL
              </h1>
              <span className="text-[9px] text-slate-300 font-mono tracking-widest leading-none">CLUB DASHBOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={logout}
              className="text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/5 transition flex items-center gap-1 text-slate-200"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* LIVE MATCH TICKER */}
      <LiveMarquee matches={matches} />

      {/* CORE INTERACTION VIEW (HIDDEN DURING PRINT) */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6 no-print">
        
        {/* ACTION OR RETRIEVAL ALERTS */}
        {errorOnLoad && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorOnLoad}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 animate-fade-in mb-4">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Action Rejected</span>
              {actionError}
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 no-print overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => handleTabChange("roster")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === "roster"
                ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            📋 DASHBOARD
          </button>
          <button
            onClick={() => handleTabChange("tournament")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === "tournament"
                ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            🏆 STANDINGS
          </button>
          <button
            onClick={() => handleTabChange("fixtures")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === "fixtures"
                ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            📅 FIXTURES
          </button>
          <button
            onClick={() => handleTabChange("lineup")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === "lineup"
                ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            👕 LINEUP
          </button>
        </div>

        {activeTab === "lineup" && (
          <div className="space-y-6">
            {selectedMatchForLineup ? (
              <LineupEditor match={selectedMatchForLineup} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.filter(m => (m.homeTeamId === currentTeam?.id || m.awayTeamId === currentTeam?.id) && m.status !== "Completed").map(match => (
                  <div key={match._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-50 p-2 rounded-xl border">
                        <p className="text-[10px] font-bold text-slate-400">VS</p>
                        <p className="text-xs font-black text-slate-700">{match.homeTeamId === currentTeam?.id ? match.awayTeamName : match.homeTeamName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{match.stage}</p>
                        <p className="text-xs font-bold text-slate-400">{new Date(match.matchDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedMatchForLineup(match)} className="px-4 py-2 bg-emerald-700 text-[#FFD700] rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      { (match.homeTeamId === currentTeam?.id ? match.homeLineup : match.awayLineup)?.starting11?.length ? "Edit Lineup" : "Set Lineup" }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab !== "roster" && activeTab !== "lineup" && authToken ? (
          <div ref={activeTab === "fixtures" ? fixturesRef : null}>
            <TournamentHub activeTab={activeTab} authToken={authToken} />
          </div>
        ) : activeTab === "roster" ? (
          <>
            {/* PROFILE ATTRIBUTION HUD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                <img 
                  src={currentTeam?.logoUrl || "/placeholder-logo.png"} 
                  alt="Crest Profile" 
                  className="w-20 h-20 rounded-full border-2 border-[#FFD700] bg-slate-50 object-cover shadow-sm flex-shrink-0" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80`;
                  }}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                    <span className="font-bebas text-2xl text-slate-900 tracking-wide uppercase">{currentTeam?.clubName}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <BadgeCheck className="h-3 w-3 text-emerald-700" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Logged in correspondent: <span className="font-mono">{currentTeam?.email}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                <button
                  onClick={triggerPrintAll}
                  disabled={totalPlayers === 0 && totalOfficials === 0}
                  className="w-full sm:w-auto py-2.5 px-5 bg-emerald-700 hover:bg-[#0a3d0a] text-[#FFD700] hover:brightness-105 disabled:opacity-50 text-xs font-bold rounded-xl shadow-sm transition uppercase flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Roster Cards
                </button>
              </div>
            </div>

            {/* QUOTA COMPLIANCE DASHBOARD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700">Under-17</span>
                  <span className="text-xs text-slate-400 font-bold">/ 20 Limit</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(u17Count/20)*100}%` }} />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold text-emerald-700">{u17Count}</span>
                  <span className="text-xs text-slate-400 ml-1">registered</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700">Overage (Free Age)</span>
                  <span className="text-xs text-slate-400 font-bold">/ 6 Limit</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(freeAgeCount/6)*100}%` }} />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold text-amber-700">{freeAgeCount}</span>
                  <span className="text-xs text-slate-400 ml-1">registered</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700">Officials</span>
                  <span className="text-xs text-slate-400 font-bold">/ 4 Limit</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalOfficials/4)*100}%` }} />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold text-blue-700">{totalOfficials}</span>
                  <span className="text-xs text-slate-400 ml-1">registered</span>
                </div>
              </div>
            </div>

            {/* COMPETITOR MANAGEMENT ROW */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
                <div>
                  <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">PLAYERS ID CREDENTIALS</h3>
                  <p className="text-xs text-slate-400">Manage, preview, and output passport sports credentials</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {u17Count < 20 && (
                    <button
                      onClick={() => setShowPlayerModal("Under-17")}
                      className="py-2 px-4 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] text-xs font-bold rounded-lg transition uppercase flex items-center justify-center gap-1 shadow-sm"
                    >
                      + Add Under-17 Player
                    </button>
                  )}
                  {freeAgeCount < 6 && (
                    <button
                      onClick={() => setShowPlayerModal("Free Age")}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition uppercase flex items-center justify-center gap-1 shadow-sm"
                    >
                      + Add Overage Player
                    </button>
                  )}
                </div>
              </div>

              {rosterPlayers.length === 0 ? (
                <div className="bg-white py-12 text-center text-slate-400 border border-slate-200/60 rounded-2xl">
                  <span className="text-3xl">🏃‍♂️</span>
                  <p className="text-xs font-semibold text-slate-700 mt-2">No Verified Competitors Found</p>
                  <div className="flex justify-center gap-2 mt-4">
                    {u17Count < 20 && (
                      <button
                        onClick={() => setShowPlayerModal("Under-17")}
                        className="text-xs text-[#0a3d0a] font-bold hover:underline"
                      >
                        + Add Under-17 Player
                      </button>
                    )}
                    {freeAgeCount < 6 && (
                      <button
                        onClick={() => setShowPlayerModal("Free Age")}
                        className="text-xs text-amber-600 font-bold hover:underline"
                      >
                        + Add Overage Player
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rosterPlayers.map((player) => (
                    <div key={player._id} className="relative group/card">
                      <PrintCard 
                        person={player} 
                        type="player" 
                        team={currentTeam} 
                      />
                      {/* Individual Print Button Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 bg-white/95 rounded-md p-1 shadow border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            const cardEl = (e.currentTarget.closest('.group\\/card') as HTMLElement)?.querySelector('.print-card-container');
                            if (!cardEl) return;
                            const clone = cardEl.cloneNode(true) as HTMLElement;
                            const target = document.createElement('div');
                            target.id = 'print-single-target';
                            target.appendChild(clone);
                            document.body.appendChild(target);
                            document.body.classList.add('print-single');
                            window.print();
                            document.body.classList.remove('print-single');
                            document.body.removeChild(target);
                          }}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Print This Card Only"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OFFICIALS ROSTER ROW */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
                <div>
                  <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">SUPPORT OFFICIAL CREDENTIALS</h3>
                  <p className="text-xs text-slate-400">Technical officials, medical staff, and management cards</p>
                </div>
                {totalOfficials < 4 && (
                  <button
                    onClick={() => setShowOfficialModal(true)}
                    className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition uppercase flex items-center justify-center gap-1 shadow-sm"
                  >
                    + Append Official
                  </button>
                )}
              </div>

              {rosterOfficials.length === 0 ? (
                <div className="bg-white py-12 text-center text-slate-400 border border-slate-200/60 rounded-2xl">
                  <span className="text-3xl">👔</span>
                  <p className="text-xs font-semibold text-slate-700 mt-2">No Verified Officials Registered</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rosterOfficials.map((official) => (
                    <div key={official._id} className="relative group/card">
                      <PrintCard 
                        person={official} 
                        type="official" 
                        team={currentTeam} 
                      />
                      {/* Individual Print Trigger Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 bg-white/95 rounded-md p-1 shadow border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            const cardEl = (e.currentTarget.closest('.group\\/card') as HTMLElement)?.querySelector('.print-card-container');
                            if (!cardEl) return;
                            const clone = cardEl.cloneNode(true) as HTMLElement;
                            const target = document.createElement('div');
                            target.id = 'print-single-target';
                            target.appendChild(clone);
                            document.body.appendChild(target);
                            document.body.classList.add('print-single');
                            window.print();
                            document.body.classList.remove('print-single');
                            document.body.removeChild(target);
                          }}
                          className="p-1 text-amber-700 hover:bg-amber-50 rounded transition-colors"
                          title="Print Official Badge Only"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* COMPACT PRINT VIEW (DIRECT PRINT EMULATION OUTPUT VIA @MEDIA PRINT GRIDDING) */}
      <div className="hidden print:block print-grid">
        {/* Full suite of Player cards rendering */}
        {rosterPlayers.map((player) => (
          <div key={player._id} className="p-1 flex items-center justify-center scale-100">
            <PrintCard person={player} type="player" team={currentTeam} />
          </div>
        ))}
        {/* Full suite of Official cards rendering */}
        {rosterOfficials.map((official) => (
          <div key={official._id} className="p-1 flex items-center justify-center scale-100">
            <PrintCard person={official} type="official" team={currentTeam} />
          </div>
        ))}
      </div>

      {/* FORM MODALS MODIFIERS */}
      {showPlayerModal && (
        <PlayerForm 
          targetCategory={showPlayerModal}
          currentU17Count={u17Count}
          currentFreeAgeCount={freeAgeCount}
          onAdd={handleAddPlayer}
          onClose={() => setShowPlayerModal(null)}
        />
      )}

      {showOfficialModal && (
        <OfficialForm 
          currentOfficialCount={totalOfficials}
          onAdd={handleAddOfficial}
          onClose={() => setShowOfficialModal(false)}
        />
      )}

    </div>
  );
};