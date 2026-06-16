import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Printer, Users, UserCheck, ShieldAlert, BadgeCheck, AlertCircle, RefreshCw, Layers, Clock, Eye, Share2 } from "lucide-react";
import { SoccerBall } from "../components/SoccerBall.js";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";
import { PlayerForm } from "../components/PlayerForm.js";
import { OfficialForm } from "../components/OfficialForm.js";
import { TournamentHub } from "../components/TournamentHub.js";
import { LiveMarquee } from "../components/LiveMarquee.js";
import { Match, Player } from "../types.js";
import tournamentLogo from "../assets/logo.jpeg";

const FORMATIONS: Record<string, { def: number; mid: number; fwd: number }> = {
  "4-4-2": { def: 4, mid: 4, fwd: 2 },
  "4-3-3": { def: 4, mid: 3, fwd: 3 },
  "3-5-2": { def: 3, mid: 5, fwd: 2 },
  "3-4-3": { def: 3, mid: 4, fwd: 3 },
  "5-3-2": { def: 5, mid: 3, fwd: 2 },
  "4-5-1": { def: 4, mid: 5, fwd: 1 },
};

const LineupPitchDisplay: React.FC<{
  lineup: { formation: string; starting11: string[]; bench: string[] };
  rosterPlayers: Player[];
  getPlayerStats: (id: string) => { goals: number; cards: any[] };
}> = ({ lineup, rosterPlayers, getPlayerStats }) => {
  const formation = lineup.formation || "4-4-2";
  const config = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  const renderRow = (startIndex: number, count: number, label: string) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const playerId = lineup.starting11[startIndex + i];
      const p = rosterPlayers.find(player => player._id === playerId);
      const stats = playerId ? getPlayerStats(playerId) : { goals: 0, cards: [] };

      items.push(
        <div key={i} className="flex flex-col items-center gap-1 group">
          <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform group-hover:scale-110 bg-emerald-800">
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
                <SoccerBall key={gi} className="h-3 w-3 text-[#FFD700] fill-[#FFD700] drop-shadow-md" />
              ))}
              {stats.cards.map((c: any, ci: number) => (
                <div key={ci} className={`w-1.5 h-2 rounded-xs ${c.type === 'Yellow' ? 'bg-yellow-400' : 'bg-red-500'} border-[0.5px] border-white/20`} />
              ))}
            </div>
          </div>
          <span className="bg-black/40 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter max-w-[70px] truncate text-center">
            {p ? p.name.split(' ').pop() : label}
          </span>
        </div>
      );
    }
    return <div className="flex justify-around items-center w-full z-10 min-h-[60px]">{items}</div>;
  };

  return (
    <div className="relative aspect-[3/4] bg-emerald-600 rounded-[2rem] overflow-hidden border-4 border-white/20 p-4 flex flex-col justify-between shadow-xl">
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

const MatchCenter: React.FC<{
  match: Match;
  onClose: () => void;
  authToken: string;
}> = ({ match, onClose, authToken }) => {
  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
  const [matchPlayers, setMatchPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchMatchPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${match.homeTeamId}/players`, { 
            headers: { Authorization: `Bearer ${authToken}` } 
          }),
          fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${match.awayTeamId}/players`, { 
            headers: { Authorization: `Bearer ${authToken}` } 
          })
        ]);
        const homeData = await homeRes.json();
        const awayData = await awayRes.json();
        setMatchPlayers([...(homeData.players || []), ...(awayData.players || [])]);
      } catch (err) { console.error(err); }
      finally { setLoadingPlayers(false); }
    };
    fetchMatchPlayers();
  }, [match.homeTeamId, match.awayTeamId, authToken]);

  const lineup = activeSide === "home" ? match.homeLineup : match.awayLineup;

  const getPlayerStats = (playerId: string) => {
    const playerGoals = match.goals?.filter(g => g.playerId === playerId).length || 0;
    const playerCards = match.cards?.filter(c => c.playerId === playerId) || [];
    return { goals: playerGoals, cards: playerCards };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        <div className="green-mesh p-8 text-white relative flex items-center justify-between gap-6 border-b-4 border-[#FFD700]">
          <div className="text-right flex-1">
            <p className="text-xl font-bebas tracking-wider uppercase">{match.homeTeamName}</p>
          </div>
          <div className="bg-[#FFD700] text-[#0a3d0a] px-6 py-2 rounded-2xl font-black text-3xl shadow-lg border-2 border-white/20">
            {match.homeScore ?? 0} : {match.awayScore ?? 0}
          </div>
          <div className="text-left flex-1">
            <p className="text-xl font-bebas tracking-wider uppercase">{match.awayTeamName}</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><LogOut className="h-5 w-5 rotate-180" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Goal Timeline</h3>
                <div className="space-y-2">
                  {(match.goals || []).length === 0 && <p className="text-xs text-slate-300 italic">No goals recorded yet</p>}
                  {match.goals?.map((g, i) => {
                    const player = matchPlayers.find(p => p._id === g.playerId);
                    const photo = player?.photoUrl || player?.photo;
                    return (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${g.team === 'home' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                      {photo ? (
                        <img src={photo} alt={g.playerName} className="w-6 h-6 rounded-full border border-white object-cover shadow-sm" />
                      ) : (
                        <SoccerBall className={`h-3 w-3 ${g.team === 'home' ? 'text-emerald-600' : 'text-blue-600'}`} />
                      )}
                      <span className="text-xs font-bold text-slate-700">{g.playerName} <span className="opacity-50">#{g.jerseyNumber}</span></span>
                    </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tactical Disciplinary</h3>
                <div className="flex flex-wrap gap-2">
                  {match.cards?.map((c, i) => {
                    const player = matchPlayers.find(p => p._id === c.playerId);
                    const photo = player?.photoUrl || player?.photo;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 group relative">
                        {photo ? (
                          <img src={photo} alt={c.playerName} className="w-8 h-8 rounded-full border border-white object-cover shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-white" />
                        )}
                        <div className={`h-4 w-2.5 rounded-sm border shadow-sm absolute -bottom-1 -right-1 ${c.type === 'Red' ? 'bg-red-500 border-red-600' : 'bg-yellow-400 border-yellow-500'}`} title={`${c.playerName} (#${c.jerseyNumber})`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {loadingPlayers ? (
              <div className="aspect-[3/4] bg-emerald-700/10 border-4 border-white/20 rounded-[2.5rem] flex flex-col justify-around p-8 animate-pulse">
                 <div className="flex justify-around">
                   <div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" />
                 </div>
                 <div className="flex justify-around">
                   <div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" />
                 </div>
                 <div className="flex justify-around">
                   <div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" /><div className="w-12 h-12 rounded-full bg-slate-200" />
                 </div>
                 <div className="flex justify-center"><div className="w-12 h-12 rounded-full bg-slate-200" /></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setActiveSide("home")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSide === "home" ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>{match.homeTeamName}</button>
                  <button onClick={() => setActiveSide("away")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSide === "away" ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>{match.awayTeamName}</button>
                </div>
                {lineup ? <LineupPitchDisplay lineup={lineup} rosterPlayers={matchPlayers} getPlayerStats={getPlayerStats} /> : (
                  <div className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 text-[10px] font-black uppercase">No Lineup Provided</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LineupEditor: React.FC<{
  match: Match;
  rosterPlayers: Player[];
  currentTeamId: string;
  onSave: (matchId: string, formation: string, starting11: string[], bench: string[]) => void;
  onCancel: () => void;
}> = ({ match, rosterPlayers, currentTeamId, onSave, onCancel }) => {
  const isHome = match.homeTeamId === currentTeamId;
  const existingLineup = isHome ? match.homeLineup : match.awayLineup;

  const [formation, setFormation] = useState(existingLineup?.formation || "4-4-2");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [tempStarting, setTempStarting] = useState<(string | null)[]>(() => {
    const base = Array(11).fill(null);
    if (existingLineup?.starting11) {
      existingLineup.starting11.forEach((id, i) => { if (i < 11) base[i] = id; });
    }
    return base;
  });
  
  const [tempBench, setTempBench] = useState<string[]>(existingLineup?.bench || []);

  const config = FORMATIONS[formation];

  const handlePlayerSelect = (playerId: string) => {
    if (activeSlot !== null) {
      const newStarting = [...tempStarting];
      // Remove player from bench if they are being promoted to XI
      setTempBench(prev => prev.filter(id => id !== playerId));
      // If player is already in another slot, clear that old slot first
      const existingSlot = newStarting.indexOf(playerId);
      if (existingSlot !== -1) newStarting[existingSlot] = null;
      
      newStarting[activeSlot] = playerId;
      setTempStarting(newStarting);
      setActiveSlot(null);
    } else {
      const inStarting = tempStarting.includes(playerId);
      if (inStarting) {
        setTempStarting(prev => prev.map(id => id === playerId ? null : id));
        if (!tempBench.includes(playerId)) setTempBench(prev => [...prev, playerId]);
      } else if (tempBench.includes(playerId)) {
        setTempBench(prev => prev.filter(id => id !== playerId));
      } else {
        setTempBench(prev => [...prev, playerId]);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(match._id, formation, tempStarting.filter((id): id is string => id !== null), tempBench);
    } finally {
      setIsSaving(false);
    }
  };

  const renderPitchRow = (players: (string | null)[], startIndex: number, count: number, label: string) => {
    const rowSlots = [];
    for (let i = 0; i < count; i++) {
      const slotIndex = startIndex + i;
      const playerId = players[slotIndex];
      const player = rosterPlayers.find(p => p._id === playerId);
      const isActive = activeSlot === slotIndex;

      rowSlots.push(
        <button 
          key={slotIndex}
          type="button"
          onClick={() => setActiveSlot(isActive ? null : slotIndex)}
          className={`flex flex-col items-center gap-1 transition-transform hover:scale-110 ${isActive ? 'z-20' : 'z-10'}`}
        >
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all overflow-hidden ${
            isActive ? 'bg-yellow-400 border-white ring-4 ring-yellow-400/30' : 
            player ? 'bg-white border-emerald-800' : 'bg-emerald-800/40 border-dashed border-white/40'
          }`}>
            {player && (player.photoUrl || player.photo) ? (
              <img src={player.photoUrl || player.photo} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              player ? (
                <span className="text-[10px] font-black text-emerald-900">
                  #{player.jerseyNumber}
                </span>
              ) : (
                <SoccerBall className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/20'}`} />
              )
            )}
          </div>
          <span className={`text-[8px] font-black uppercase px-1.5 rounded truncate max-w-[60px] ${
            isActive ? 'bg-yellow-400 text-emerald-900' : 
            player ? 'bg-black/40 text-white' : 'bg-white/10 text-white/40'
          }`}>
            {player ? player.name.split(' ').pop() : label}
          </span>
        </button>
      );
    }
    return <div className="flex justify-around items-center w-full min-h-[60px]">{rowSlots}</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tactical Setup</label>
            <select 
              value={formation}
              onChange={(e) => { setFormation(e.target.value); setTempStarting(Array(11).fill(null)); setActiveSlot(null); }}
              className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 ring-emerald-500/20"
            >
              {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="relative aspect-[3/4] bg-emerald-600 rounded-[2rem] overflow-hidden border-4 border-white/20 p-4 flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-white/10 border-t-0 rounded-b-xl" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-white/10 border-b-0 rounded-t-xl" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/10 rounded-full" />
            </div>
            
            {renderPitchRow(tempStarting, 1 + config.def + config.mid, config.fwd, "FWD")}
            {renderPitchRow(tempStarting, 1 + config.def, config.mid, "MID")}
            {renderPitchRow(tempStarting, 1, config.def, "DEF")}
            {renderPitchRow(tempStarting, 0, 1, "GK")}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={tempStarting.filter(id => id !== null).length !== 11 || isSaving}
            className="flex-[2] py-3 bg-[#0a3d0a] text-[#FFD700] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
            {isSaving ? "Loading..." : "Add Lineup"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b pb-4 flex justify-between items-end">
          <div>
            <h3 className="font-bebas text-2xl text-slate-800 tracking-wide uppercase">Roster Pool</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {activeSlot !== null ? `Assign player to slot #${activeSlot + 1}` : 'Manage bench and selections'}
            </p>
          </div>
          {activeSlot !== null && (
            <button onClick={() => setActiveSlot(null)} className="text-[9px] font-black text-amber-600 uppercase underline">Cancel Assignment</button>
          )}
        </div>
        
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(pos => (
            <div key={pos} className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-2">{pos}s</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rosterPlayers.filter(p => p.position === pos).map(p => {
                  const sIndex = tempStarting.indexOf(p._id);
                  const isStarting = sIndex !== -1;
                  const isBench = tempBench.includes(p._id);
                  const isCurrentTarget = activeSlot !== null && tempStarting[activeSlot] === p._id;

                  return (
                    <button 
                      key={p._id} 
                      onClick={() => handlePlayerSelect(p._id)} 
                      className={`p-3 rounded-xl border-2 text-left transition flex items-center justify-between gap-3 ${
                        isCurrentTarget ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500/20' :
                        isStarting ? 'border-emerald-500 bg-emerald-50 opacity-60' : 
                        isBench ? 'border-amber-400 bg-amber-50' : 
                        'border-slate-100 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase truncate text-slate-800">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">#{p.jerseyNumber} • {p.position}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                        isStarting ? 'bg-emerald-500 text-white' : 
                        isBench ? 'bg-amber-400 text-white' : 
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {isStarting ? "IN XI" : isBench ? "BENCH" : "ADD"}
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
  const [activeTab, setActiveTab] = useState<"roster" | "tournament" | "fixtures" | "lineup" | "results">("roster");
  const fixturesRef = useRef<HTMLDivElement>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);

  // Form modals state
  const [showPlayerModal, setShowPlayerModal] = useState<"Under-17" | "Free Age" | null>(null);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [selectedMatchForLineup, setSelectedMatchForLineup] = useState<Match | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCopyLivescore = () => {
    const url = `${window.location.origin}/#/livescore`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Public livescore link copied to clipboard!");
    });
  };

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

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to commit player database registration.");
      }

      await loadRoster();
      setShowPlayerModal(null);
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

      if (response.status === 401) {
        logout();
        return;
      }

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

  const handleTabChange = (tab: "roster" | "tournament" | "fixtures" | "lineup" | "results") => {
    setActiveTab(tab);
    
    // Scroll to fixtures section on mobile when fixtures tab is clicked
    if ((tab === "fixtures" || tab === "results") && fixturesRef.current) {
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
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error("Failed to save lineup");
      await loadMatches();
      setSelectedMatchForLineup(null);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-[#0a3d0a] animate-spin" />
        <span className="text-xs font-semibold text-[#0a3d0a] uppercase tracking-widest">Compiling Team Roster ...</span>
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
              onClick={handleCopyLivescore}
              className="text-[10px] font-bold uppercase tracking-wider bg-[#FFD700] text-[#0a3d0a] px-3 py-1.5 rounded-lg border border-white/10 transition flex items-center gap-1.5 shadow-sm hover:brightness-110"
            >
              <Share2 className="h-3 w-3" />
              Copy Livescore Link
            </button>
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
            onClick={() => handleTabChange("results")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === "results"
                ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            ✅ RESULTS
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
              <LineupEditor 
                key={selectedMatchForLineup._id}
                match={selectedMatchForLineup} 
                rosterPlayers={rosterPlayers}
                currentTeamId={currentTeam?.id || ""}
                onSave={handleSaveLineup}
                onCancel={() => setSelectedMatchForLineup(null)}
              />
            ) : (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.filter(m => (m.homeTeamId === currentTeam?.id || m.awayTeamId === currentTeam?.id) && m.status !== "Completed").map(match => (
                    <div key={match._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-slate-50 p-2 rounded-xl border w-24">
                          <p className="text-[10px] font-bold text-slate-400">VS</p>
                          <p className="text-[10px] font-black text-slate-700 truncate">{match.homeTeamId === currentTeam?.id ? match.awayTeamName : match.homeTeamName}</p>
                        </div>
                        <div>
                          <button 
                            onClick={() => setViewingMatch(match)}
                            className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase hover:underline mb-1"
                          >
                            <Eye className="h-3 w-3" /> Match Center
                          </button>
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

                {matches.some(m => (m.homeTeamId === currentTeam?.id || m.awayTeamId === currentTeam?.id) && m.status === "Completed") && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <h3 className="font-bebas text-2xl text-slate-800 tracking-wide uppercase">Match History</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Your past competition results</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.filter(m => (m.homeTeamId === currentTeam?.id || m.awayTeamId === currentTeam?.id) && m.status === "Completed").map(match => (
                        <div key={match._id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-90 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-4">
                            <div className="text-center bg-white p-2 rounded-xl border w-24">
                              <p className="text-[10px] font-bold text-slate-400">VS</p>
                              <p className="text-[10px] font-black text-slate-700 truncate">{match.homeTeamId === currentTeam?.id ? match.awayTeamName : match.homeTeamName}</p>
                            </div>
                            <div>
                              <button 
                                onClick={() => setViewingMatch(match)}
                                className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase hover:underline mb-1"
                              >
                                <Eye className="h-3 w-3" /> Match Center
                              </button>
                              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{match.stage}</p>
                              <p className="text-xs font-bold text-slate-400">{new Date(match.matchDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="bg-[#FFD700] text-[#0a3d0a] px-3 py-1.5 rounded-xl font-black text-lg border border-white/20 shadow-sm">
                            {match.homeScore ?? 0} : {match.awayScore ?? 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab !== "roster" && activeTab !== "lineup" && authToken ? (
          <div ref={(activeTab === "fixtures" || activeTab === "results") ? fixturesRef : null}>
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
                    + Add Official
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

      {viewingMatch && (
        <MatchCenter 
          match={viewingMatch} 
          onClose={() => setViewingMatch(null)} 
          authToken={authToken || ""} 
        />
      )}

    </div>
  );
};