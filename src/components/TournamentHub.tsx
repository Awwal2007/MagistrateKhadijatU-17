import React, { useState, useEffect, useMemo } from "react";
import { Match, GroupStanding, Player } from "../types.js";
import { Modal } from "./Modal.js";
import { Trophy, Calendar, MapPin, Clock, Layers, Users, ShieldAlert, Zap, AlertTriangle, ArrowLeft, RefreshCw, Eye, Pencil } from "lucide-react";

const FORMATIONS: Record<string, { def: number; mid: number; fwd: number }> = {
  "4-4-2": { def: 4, mid: 4, fwd: 2 },
  "4-3-3": { def: 4, mid: 3, fwd: 3 },
  "3-5-2": { def: 3, mid: 5, fwd: 2 },
  "3-4-3": { def: 3, mid: 4, fwd: 3 },
  "5-3-2": { def: 5, mid: 3, fwd: 2 },
  "4-5-1": { def: 4, mid: 5, fwd: 1 },
};

const TacticalPitch: React.FC<{
  lineup: { formation: string; starting11: string[] };
  allPlayers: Player[];
  theme: 'emerald' | 'blue';
  getPlayerStats: (id: string) => { goals: number, cards: any[] };
}> = ({ lineup, allPlayers, theme, getPlayerStats }) => {
  const formation = lineup.formation || "4-4-2";
  const config = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  const renderRow = (startIndex: number, count: number, label: string) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const playerId = lineup.starting11?.[startIndex + i];
      const p = allPlayers.find(player => player._id === playerId);
      const stats = playerId ? getPlayerStats(playerId) : { goals: 0, cards: [] };

      items.push(
        <div key={i} className="flex flex-col items-center gap-1 group">
          <div className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform group-hover:scale-110 ${theme === 'emerald' ? 'bg-emerald-800' : 'bg-blue-800'}`}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {p && (p.photoUrl || p.photo) ? (
                <img src={p.photoUrl || p.photo} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xs sm:text-base">
                  {p ? `#${p.jerseyNumber}` : "?"}
                </span>
              )}
            </div>
            <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
              {stats.goals > 0 && Array(stats.goals).fill(0).map((_, gi) => (
                <Zap key={gi} className="h-3 w-3 text-[#FFD700] fill-[#FFD700] drop-shadow-md" />
              ))}
              {stats.cards.map((c: any, ci: number) => (
                <div key={ci} className={`w-1.5 h-2 rounded-xs ${c.type === 'Yellow' ? 'bg-yellow-400' : 'bg-red-500'} border-[0.5px] border-white/20`} />
              ))}
            </div>
          </div>
          <span className="bg-black/40 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter max-w-[70px] truncate text-center">
            {p ? p.name.split(' ').pop() : label}
          </span>
        </div>
      );
    }
    return <div className="flex justify-around items-center w-full z-10 min-h-[60px]">{items}</div>;
  };
  
  // FIXED: Check if starting11 exists before accessing indices
  if (!lineup.starting11 || lineup.starting11.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full bg-emerald-600 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl flex flex-col items-center justify-center p-4 sm:p-8">
        <p className="text-white text-center">Lineup not available</p>
      </div>
    );
  }
  
  return (
    <div className="relative aspect-[3/4] w-full bg-emerald-600 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl flex flex-col justify-between p-4 sm:p-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-white/30 border-t-0 rounded-b-xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-white/30 border-b-0 rounded-t-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
      </div>
      {renderRow(1 + config.def + config.mid, config.fwd, "FWD")}
      {renderRow(1 + config.def, config.mid, "MID")}
      {renderRow(1, config.def, "DEF")}
      {renderRow(0, 1, "GK")}
    </div>
  );
};

export interface TournamentHubProps {
  authToken?: string;
  activeTab: "tournament" | "fixtures" | "results";
  onEditMatch?: (match: Match) => void;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ authToken, activeTab, onEditMatch }) => {
  const [standings, setStandings] = useState<{ A: GroupStanding[]; B: GroupStanding[]; C: GroupStanding[] }>({ A: [], B: [], C: [] });
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Match Detail Modal State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [rosters, setRosters] = useState<{ home: Player[], away: Player[] }>({ home: [], away: [] });
  const [loadingRosters, setLoadingRosters] = useState(false);
  const [stats, setStats] = useState<{
    topScorers: Array<{ name: string, team: string, teamLogo: string, playerPhoto?: string, goals: number }>,
    disciplinary: Array<{
      playerName: string,
      playerPhoto?: string, 
      teamName: string,
      teamLogo: string,
      type: "Yellow" | "Red",
      date: string,
      matchMissed?: string
    }>
  }>({ topScorers: [], disciplinary: [] });

  // FIXED: Moved useEffect before it was using selectedMatch
  useEffect(() => {
    setSelectedMatch(null);
    setError(null);
  }, [activeTab]);

  useEffect(() => {
    loadData(false);
    // Periodically sync match data for real-time score updates
    const interval = setInterval(() => loadData(true), 20000); 
    return () => clearInterval(interval);
  }, [authToken]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // FIXED: Moved getPlayerStats before it's used in TacticalPitch
  const getPlayerStats = (playerId: string) => {
    if (!selectedMatch) return { goals: 0, cards: [] };
    const playerGoals = selectedMatch.goals?.filter(g => g.playerId === playerId).length || 0;
    const playerCards = selectedMatch.cards?.filter(c => c.playerId === playerId) || [];
    return { goals: playerGoals, cards: playerCards };
  };

  const handleMatchClick = async (match: Match) => {
    setSelectedMatch(match);
    setActiveSide("home");
    setLoadingRosters(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches/${match._id}/rosters`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setRosters({ home: data.homePlayers || [], away: data.awayPlayers || [] });
      } else if (res.status === 401 || res.status === 403) {
        console.error("Match rosters are restricted. Backend likely requires authentication for this endpoint.");
        setError("Roster data is currently restricted by the administrator.");
      }
    } catch (err) {
      console.error("Error loading rosters:", err);
      setError("Network error while retrieving match rosters.");
    } finally {
      setLoadingRosters(false);
    }
  };

  const getPlayerName = (playerId: string, team: 'home' | 'away') => {
    const player = rosters[team]?.find(p => p._id === playerId);
    if (player) return `${player.name} (#${player.jerseyNumber})`;
    const goal = selectedMatch?.goals?.find(g => g.playerId === playerId);
    if (goal) return `${goal.playerName} (#${goal.jerseyNumber})`;
    const card = selectedMatch?.cards?.find(c => c.playerId === playerId);
    if (card) return `${card.playerName} (#${card.jerseyNumber})`;
    return "Unknown Player";
  };

  const formatEventTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ""; }
  };

  const loadData = async (isSync = false) => {
    if (!isSync) setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = (authToken && authToken.trim() !== "") 
        ? { Authorization: `Bearer ${authToken}` } 
        : {};
      const [standingsRes, matchesRes, statsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/standings`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/stats`, { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json().catch(() => ({ topScorers: [], disciplinary: [] }));
        setStats(statsData);
      }

      if (standingsRes.ok) {
        const sData = await standingsRes.json().catch(() => ({ standings: { A: [], B: [], C: [] } }));
        setStandings(sData.standings || { A: [], B: [], C: [] });
      } else if (!isSync) {
        setError("Database synchronization failure: The tournament registry responded with an error. Please ensure public access is enabled in the backend.");
        if (!isSync) setLoading(false);
        return;
      }

      if (matchesRes.ok) {
        const mData = await matchesRes.json().catch(() => ({ matches: [] }));
        setMatches(mData.matches || []);
      } else if (!isSync) {
        setError("Database synchronization failure: The tournament registry responded with an error. Please ensure public access is enabled in the backend.");
        if (!isSync) setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      if (!isSync) setError("Connectivity loss: Unable to reach tournament registry.");
    } finally {
      if (!isSync) setLoading(false);
    }
  };

  // Helper function to format date and time
  const formatMatchDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Group and sort matches by Round
  const getGroupedMatches = () => {
    let filteredMatches = [...matches];

    if (activeTab === "fixtures") {
      filteredMatches = matches.filter(m => m.status !== "Completed");
    } else if (activeTab === "results") {
      filteredMatches = matches.filter(m => m.status === "Completed");
    }

    const sorted = filteredMatches.sort((a, b) => {
      const timeA = new Date(a.matchDate).getTime();
      const timeB = new Date(b.matchDate).getTime();
      return activeTab === "results" ? timeB - timeA : timeA - timeB;
    });

    const grouped = sorted.reduce((acc, match) => {
      const roundName = match.round || (activeTab === "results" ? "Recent Results" : "Match Fixtures");
      if (!acc[roundName]) acc[roundName] = [];
      acc[roundName].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    const roundOrder = Array.from(new Set(sorted.map(m => m.round || (activeTab === "results" ? "Recent Results" : "Match Fixtures"))));
    return { grouped, roundOrder };
  };

  const getLiveTime = (m: Match) => {
    const accumulated = m.timerAccumulatedTime || 0;
    const lastStartedTime = m.timerLastStarted ? new Date(m.timerLastStarted).getTime() : 0;
    const diff = (m.status === "Live" && lastStartedTime > 0) ? Math.floor((now - lastStartedTime) / 1000) : 0;
    const totalSecs = Math.max(0, accumulated + diff);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // PROFESSIONAL MATCH CENTER VIEW
  if (selectedMatch) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Navigation */}
        <button 
          onClick={() => setSelectedMatch(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0a3d0a] transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tournament
        </button>

        {/* Match Center Header */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="green-mesh p-8 sm:p-12 text-white relative">
            {onEditMatch && (
              <button 
                onClick={() => onEditMatch(selectedMatch)}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 transition-all z-20 group"
                title="Edit Fixture"
              >
                <Pencil className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
            )}
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="flex items-center justify-between w-full max-w-4xl gap-4 sm:gap-12">
                <div className="flex-1 flex flex-col items-center text-center gap-4">
                  <img 
                    src={selectedMatch.homeTeamLogo} 
                    className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-[#FFD700] bg-white object-cover shadow-xl" 
                    alt="home"
                  />
                  <h2 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase">{selectedMatch.homeTeamName}</h2>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl sm:text-8xl font-black flex gap-4 drop-shadow-lg">
                    <span>{selectedMatch.homeScore ?? 0}</span>
                    <span className="text-[#FFD700] animate-pulse">:</span>
                    <span>{selectedMatch.awayScore ?? 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] bg-[#FFD700] text-[#0a3d0a] px-4 py-1.5 rounded-full shadow-sm">
                      {selectedMatch.status === "Live" ? `LIVE • ${getLiveTime(selectedMatch)}` : selectedMatch.status}
                    </span>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{selectedMatch.stage}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center text-center gap-4">
                  <img 
                    src={selectedMatch.awayTeamLogo} 
                    className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-[#FFD700] bg-white object-cover shadow-xl" 
                    alt="away"
                  />
                  <h2 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase">{selectedMatch.awayTeamName}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Match Content */}
          <div className="p-6 sm:p-12 space-y-16">
            {loadingRosters ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 text-[#0a3d0a] animate-spin" />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Retrieving Official Match Records...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Column: Timeline & Stats */}
                <div className="lg:col-span-4 space-y-12">
                  {(selectedMatch.goals?.length || 0) + (selectedMatch.cards?.length || 0) > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Clock className="h-5 w-5 text-[#0a3d0a]" />
                        <h3 className="font-bebas text-2xl text-slate-800 tracking-wide uppercase">Events Timeline</h3>
                      </div>
                      <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                        {[...(selectedMatch.goals || []), ...(selectedMatch.cards || [])]
                          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                          .map((event, idx) => {
                            const isGoal = 'team' in event && !('type' in event);
                            return (
                              <div key={idx} className="flex items-start gap-4 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${isGoal ? 'bg-emerald-500 text-white' : (event as any).type === 'Red' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-white'}`}>
                                  {isGoal ? <Zap className="h-4 w-4 fill-current" /> : <AlertTriangle className="h-4 w-4 fill-current" />}
                                </div>
                                <div className="pt-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase">{formatEventTime(event.timestamp)}</p>
                                  <p className="text-sm font-bold text-slate-800">
                                    {event.playerName}
                                    {event.matchTime !== undefined && <span className="ml-1 text-emerald-600 font-black">({Math.floor(event.matchTime / 60)}')</span>}
                                  </p>
                                  <p className="text-[10px] font-bold text-[#0a3d0a] uppercase tracking-widest">{event.team === 'home' ? selectedMatch.homeTeamName : selectedMatch.awayTeamName}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No major match events recorded</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Tactical Lineups */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Layers className="h-5 w-5 text-[#0a3d0a]" />
                    <h3 className="font-bebas text-2xl text-slate-800 tracking-wide uppercase">Tactical Lineups</h3>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setActiveSide("home")} 
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeSide === "home" ? 'bg-white shadow-md text-[#0a3d0a]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {selectedMatch.homeTeamName}
                    </button>
                    <button 
                      onClick={() => setActiveSide("away")} 
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeSide === "away" ? 'bg-white shadow-md text-[#0a3d0a]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {selectedMatch.awayTeamName}
                    </button>
                  </div>

                  {(() => {
                    const lineup = activeSide === 'home' ? selectedMatch.homeLineup : selectedMatch.awayLineup;
                    return lineup?.starting11?.length ? (
                      <TacticalPitch 
                        lineup={lineup}
                        allPlayers={activeSide === 'home' ? rosters.home : rosters.away}
                        theme={activeSide === 'home' ? 'emerald' : 'blue'}
                        getPlayerStats={getPlayerStats}
                      />
                    ) : (
                      <div className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center">
                        <ShieldAlert className="h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lineup Pending Submission</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderGroupTable = (groupName: string, groupStandings: GroupStanding[]) => (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60 mb-6 sm:mb-8">
      <h3 className="font-bebas text-lg sm:text-xl text-[#0a3d0a] tracking-wider uppercase mb-3 sm:mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFD700]" />
        Group {groupName}
      </h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-[10px] sm:text-xs text-left min-w-[500px] sm:min-w-full">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4">Club</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">P</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">W</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">D</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">L</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GF</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GA</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GD</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-[#0a3d0a] text-[11px] sm:text-sm">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupStandings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 sm:py-8 text-center text-slate-400 text-xs">No teams assigned yet.</td>
              </tr>
            ) : groupStandings.map((team, idx) => (
              <tr key={team.teamId} className="hover:bg-slate-50 transition">
                <td className="py-2 sm:py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-slate-400 text-[10px] sm:text-xs w-3 sm:w-4">{idx + 1}</span>
                    <img src={team.logoUrl} alt="logo" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-slate-200 bg-white object-cover flex-shrink-0" />
                    <span className="font-bold text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">{team.clubName}</span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.played}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.won}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.drawn}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.lost}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalsFor}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalsAgainst}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-black text-[11px] sm:text-sm text-[#0a3d0a]">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // If fixtures tab is active, prioritize showing fixtures prominently
  if (activeTab === "fixtures" || activeTab === "results") {
    const { grouped, roundOrder } = getGroupedMatches();
    return (
      <div className="space-y-6 animate-fade-in">
        {loading && matches.length === 0 ? (
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-8 w-40 bg-slate-200 rounded-xl mb-4" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-32 bg-white border border-slate-100 rounded-3xl shadow-sm" />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
           <div className="py-12 text-center text-red-500 bg-red-50 rounded-3xl border border-red-100 px-6">
             <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
             <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
           </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60">
            <h3 className="font-bebas text-xl sm:text-2xl text-[#0a3d0a] tracking-wider uppercase mb-4 sm:mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFD700]" />
              {activeTab === "fixtures" ? "All Match Fixtures" : "Competition Results"}
            </h3>
            {roundOrder.length === 0 ? (
              <div className="py-12 sm:py-16 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-slate-300" />
                <p>{activeTab === "fixtures" ? "No matches scheduled yet." : "No matches completed yet."}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {roundOrder.map(roundName => (
                  <div key={roundName} className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-[#FFD700] pl-3 py-1">
                      <Layers className="h-4 w-4 text-[#0a3d0a]" />
                      <h4 className="font-bebas text-lg text-[#0a3d0a] tracking-widest uppercase">{roundName}</h4>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {grouped[roundName].map(match => {
                        const { date, time } = formatMatchDateTime(match.matchDate);
                        return (
                          <div key={match._id} className="relative group">
                            <div 
                              onClick={() => handleMatchClick(match)}
                              className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/50 hover:bg-white transition shadow-sm cursor-pointer hover:border-emerald-300"
                            >
                              {onEditMatch && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEditMatch(match); }}
                                  className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 transition-colors z-10"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase mb-2 sm:mb-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                    {match.stage} {match.group ? `- Group ${match.group}` : ''}
                                    {match.round && match.round !== roundName ? ` - ${match.round}` : ''}
                                  </span>
                                  {match.status === "Live" && (
                                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>{date}</span>
                                </div>
                              </div>

                              {/* Match Time Display */}
                              <div className="flex justify-center mb-3 sm:mb-4">
                                <div className={`${match.status === "Live" ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700"} px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1.5`}>
                                  <Clock className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${match.status === "Live" ? "animate-pulse" : ""}`} />
                                  <span>
                                    {match.status === "Live" 
                                      ? `Match Time: ${getLiveTime(match)}` 
                                      : match.status === "Completed"
                                        ? "Fulltime"
                                        : `Kick-off: ${time}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 sm:gap-4">
                                {/* Home Team */}
                                <div className="flex-1 text-center">
                                  <div className="flex justify-center mb-1 sm:mb-2">
                                    <img
                                      src={match.homeTeamLogo}
                                      alt={match.homeTeamName}
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 bg-white object-cover shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.homeTeamName || "")}&background=0a3d0a&color=fff&rounded=true&size=48`;
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 line-clamp-2">{match.homeTeamName}</span>
                                </div>

                                {/* Score / VS */}
                                <div className="flex-shrink-0 min-w-[60px] sm:min-w-[80px] text-center">
                                  {match.status === "Completed" || match.status === "Live" ? (
                                    <div className={`flex items-center justify-center gap-1 sm:gap-2 font-black text-lg sm:text-2xl px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg ${
                                      match.status === "Live" ? "text-red-600 bg-red-50 animate-pulse border border-red-200" : "text-[#0a3d0a] bg-emerald-50"
                                    }`}>
                                      <span>{match.homeScore ?? 0}</span>
                                      <span className="text-gray-400 text-base sm:text-xl">-</span>
                                      <span>{match.awayScore ?? 0}</span>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-200 text-slate-500 text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold inline-block">
                                      VS
                                    </div>
                                  )}
                                </div>

                                {/* Away Team */}
                                <div className="flex-1 text-center">
                                  <div className="flex justify-center mb-1 sm:mb-2">
                                    <img
                                      src={match.awayTeamLogo}
                                      alt={match.awayTeamName}
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 bg-white object-cover shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.awayTeamName || "")}&background=0a3d0a&color=fff&rounded=true&size=48`;
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 line-clamp-2">{match.awayTeamName}</span>
                                </div>
                              </div>

                              {/* Venue (if available) */}
                              {match.venue && (
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-slate-400">
                                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span>{match.venue}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Show standings with fixtures on the side
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {loading && matches.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm" />
          </div>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500 bg-red-50 rounded-3xl border border-red-100 px-6">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {renderGroupTable("A", standings.A)}
            {renderGroupTable("B", standings.B)}
            {renderGroupTable("C", standings.C)}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60 sticky top-24">
              <h3 className="font-bebas text-lg sm:text-xl text-[#0a3d0a] tracking-wider uppercase mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" /> 
                Upcoming Fixtures
              </h3>
              {matches.filter(m => m.status !== "Completed").length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No upcoming matches.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                  {matches
                    .filter(m => m.status !== "Completed")
                    .slice(0, 10)
                    .map(match => {
                    const { date, time } = formatMatchDateTime(match.matchDate);
                    return (
                      <div 
                        key={match._id} 
                        onClick={() => handleMatchClick(match)}
                        className="border border-slate-200 rounded-xl p-2 sm:p-3 bg-slate-50/50 hover:bg-white transition shadow-sm cursor-pointer hover:border-emerald-300"
                      >
                        <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase mb-2">
                          <div className="flex items-center gap-1">
                            <span className="bg-slate-200 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px]">
                              {match.stage}
                            </span>
                            {match.status === "Live" && (
                              <span className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 ${match.status === "Live" ? "text-red-600 font-mono" : ""}`}>
                            <Clock className={`h-2.5 w-2.5 ${match.status === "Live" ? "animate-pulse" : ""}`} />
                            <span>{match.status === "Live" ? getLiveTime(match) : time}</span>
                          </div>
                        </div>
                        
                        {/* Date display */}
                        <div className="text-center mb-2">
                          <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium">{date}</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1">
                            <img 
                              src={match.homeTeamLogo} 
                              alt="home" 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.homeTeamName)}&background=0a3d0a&color=fff&rounded=true&size=32`;
                              }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-[60px] sm:max-w-[80px]">
                              {match.homeTeamName}
                            </span>
                          </div>
                          
                          <div className="flex-shrink-0 text-center">
                            {match.status === "Completed" || match.status === "Live" ? (
                              <div className={`flex items-center gap-0.5 sm:gap-1 font-black text-xs sm:text-sm ${
                                match.status === "Live" ? "text-red-600 animate-pulse" : "text-[#0a3d0a]"
                              }`}>
                                <span>{match.homeScore ?? 0}</span>
                                <span className="text-gray-300 text-[10px] sm:text-xs">-</span>
                                <span>{match.awayScore ?? 0}</span>
                              </div>
                            ) : (
                              <div className="bg-slate-200 text-slate-500 text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded font-bold">VS</div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1">
                            <img 
                              src={match.awayTeamLogo} 
                              alt="away" 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.awayTeamName)}&background=0a3d0a&color=fff&rounded=true&size=32`;
                              }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-[60px] sm:max-w-[80px]">
                              {match.awayTeamName}
                            </span>
                          </div>
                        </div>

                        {/* Venue for mobile */}
                        {match.venue && (
                          <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-center gap-1">
                            <MapPin className="h-2 w-2 text-slate-400" />
                            <span className="text-[7px] sm:text-[8px] text-slate-400 truncate">{match.venue}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {matches.filter(m => m.status !== "Completed").length > 10 && (
                    <button 
                      onClick={() => {
                        const fixturesTab = document.querySelector('button[class*="FIXTURES"]');
                        if (fixturesTab) {
                          (fixturesTab as HTMLButtonElement).click();
                        }
                      }}
                      className="w-full text-center text-[10px] sm:text-xs text-emerald-600 font-bold py-2 hover:underline transition-colors"
                    >
                      View All Fixtures →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS TAB VIEW */}
      {activeTab === "tournament" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TOP SCORERS - GOLDEN BOOT RACE */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Trophy className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-bebas text-2xl text-slate-800 tracking-wider uppercase">Golden Boot Race</h3>
              </div>

              <div className="space-y-3">
                {stats.topScorers.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 font-bold uppercase">No goals recorded yet</p>
                ) : stats.topScorers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                        {i + 1}
                      </span>
                      <img 
                        src={s.playerPhoto || s.teamLogo} 
                        className="w-8 h-8 rounded-full border bg-white object-cover" 
                        alt={s.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = s.teamLogo;
                        }}
                      />
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase leading-tight">{s.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-amber-300 transition-colors">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-black text-slate-700">{s.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DISCIPLINARY & SUSPENSIONS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-red-50 rounded-xl">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="font-bebas text-2xl text-slate-800 tracking-wider uppercase">Disciplinary & Suspensions</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="pb-3 pl-2">Player</th>
                      <th className="pb-3">Card</th>
                      <th className="pb-3">Issued On</th>
                      <th className="pb-3 text-right pr-2">Status / Suspension</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.disciplinary.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Clean tournament — No cards issued
                        </td>
                      </tr>
                    ) : stats.disciplinary.map((d, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <img 
                              src={d.playerPhoto || d.teamLogo} 
                              className="w-7 h-7 rounded-full border bg-white object-cover" 
                              alt={d.playerName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = d.teamLogo;
                              }}
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800 uppercase">{d.playerName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{d.teamName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className={`w-4 h-6 rounded-sm shadow-sm ${d.type === 'Yellow' ? 'bg-yellow-400' : 'bg-red-500'} border-2 border-white`} title={d.type} />
                        </td>
                        <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 text-right pr-2">
                          {d.type === 'Red' ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-widest mb-1">Suspended</span>
                              <span className="text-[9px] font-bold text-slate-400 italic leading-none">Missing: {d.matchMissed}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};