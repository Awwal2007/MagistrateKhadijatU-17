import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Key, AlertCircle, RefreshCw, Trash2, Printer, Search,
  ArrowLeft, LogOut, ChevronRight, Users, UserCheck, Building2,
  Trophy, TrendingUp, Eye, Zap, Clock, Share2
} from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";
import { TournamentHub } from "../components/TournamentHub.js";
import { LiveMarquee } from "../components/LiveMarquee.js";
import { TournamentManager } from "../components/TournamentManager.js";
import { Modal } from "../components/Modal.js";
import { Team, Player, Official, Match } from "../types.js";
import tournamentLogo from "../assets/logo.jpeg";

interface FullTeamRoster {
  id: string;
  clubName: string;
  username: string;
  logoUrl: string;
  createdAt: string;
  players: Player[];
  officials: Official[];
  group?: "A" | "B" | "C" | null;
}

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
  allPlayers: Player[];
  getPlayerStats: (id: string) => { goals: number; cards: any[] };
}> = ({ lineup, allPlayers, getPlayerStats }) => {
  const formation = lineup.formation || "4-4-2";
  const config = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  const renderRow = (startIndex: number, count: number, label: string) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const playerId = lineup.starting11[startIndex + i];
      const p = allPlayers.find(player => player._id === playerId);
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
                <Zap key={gi} className="h-3 w-3 text-[#FFD700] fill-[#FFD700] drop-shadow-md" />
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
  allPlayers: Player[];
}> = ({ match, onClose, allPlayers }) => {
  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
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
                  {match.goals?.map((g, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${g.team === 'home' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                      <Zap className={`h-3 w-3 ${g.team === 'home' ? 'text-emerald-600' : 'text-blue-600'}`} />
                      <span className="text-xs font-bold text-slate-700">
                        {g.playerName} <span className="opacity-50">#{g.jerseyNumber}</span>
                        {g.matchTime !== undefined && <span className="ml-1 text-emerald-600">({Math.floor(g.matchTime / 60)}')</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tactical Disciplinary</h3>
                <div className="flex flex-wrap gap-2">
                  {match.cards?.map((c, i) => (
                    <div key={i} className={`h-6 w-4 rounded-sm border shadow-sm ${c.type === 'Red' ? 'bg-red-500 border-red-600' : 'bg-yellow-400 border-yellow-500'}`} title={`${c.playerName} (#${c.jerseyNumber})`} >
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`h-6 w-4 rounded-sm border shadow-sm ${c.type === 'Red' ? 'bg-red-500 border-red-600' : 'bg-yellow-400 border-yellow-500'}`} title={`${c.playerName} (#${c.jerseyNumber})`} >
                      {c.matchTime !== undefined && (
                        <span className="text-[8px] font-black text-slate-500">{Math.floor(c.matchTime / 60)}'</span>
                      )}
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setActiveSide("home")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSide === "home" ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>{match.homeTeamName}</button>
                <button onClick={() => setActiveSide("away")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSide === "away" ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>{match.awayTeamName}</button>
              </div>
              {lineup ? <LineupPitchDisplay lineup={lineup} allPlayers={allPlayers} getPlayerStats={getPlayerStats} /> : (
                <div className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 text-[10px] font-black uppercase">No Lineup Provided</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const { authToken, isAdmin, loginAdmin, logout } = useRegistration();

  // Password Verification State
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Dashboard State
  const [fullTeamsList, setFullTeamsList] = useState<FullTeamRoster[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<FullTeamRoster | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [errorOnRecords, setErrorOnRecords] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"players" | "officials" | "tournament" | "overview" | "fixtures">("overview");
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [deletingOfficialId, setDeletingOfficialId] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
    isDangerous?: boolean;
  }>({ isOpen: false, title: "", message: "", type: "info" });

  const handleCopyLivescore = () => {
    const url = `${window.location.origin}/#/livescore`;
    navigator.clipboard.writeText(url).then(() => {
      setModalConfig({
        isOpen: true,
        title: "Link Copied",
        message: "The public livescore link has been copied to your clipboard.",
        type: "success"
      });
    });
  };

  useEffect(() => {
    if (isAdmin && authToken) {
      loadAdminRecords();
      loadMatches();
      const interval = setInterval(loadMatches, 20000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, authToken]);

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid administrative entry code key.");
      }

      loginAdmin(data.token);
      setPasswordInput("");
    } catch (err: any) {
      setLoginError(err.message || "A verification timeout occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadAdminRecords = async () => {
    setLoadingRecords(true);
    setErrorOnRecords(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/teams`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error("Unable to retrieve rosters.");

      const data = await response.json();
      const teams = data.teams || [];
      setFullTeamsList(teams);
      setSelectedTeam(prev => {
        if (prev) {
          const fresh = teams.find((t: any) => t.id === prev.id);
          return fresh || null;
        }
        return null;
      });
    } catch (err: any) {
      setErrorOnRecords(err.message || "Failure synchronizing ledger rosters.");
    } finally {
      setLoadingRecords(false);
    }
  };

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

  const handleRemovePlayer = (playerId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Remove Player",
      message: "Are you absolutely sure you want to delete this player card? This action is irreversible.",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        setDeletingPlayerId(playerId);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/players/${playerId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Delete rejected.");
          }
          await loadAdminRecords();
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
        } finally {
          setDeletingPlayerId(null);
        }
      }
    });
  };

  const handleRemoveOfficial = (officialId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Remove Official",
      message: "Are you sure you want to delete this official's badge?",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        setDeletingOfficialId(officialId);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/officials/${officialId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Delete rejected.");
          }
          await loadAdminRecords();
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
        } finally {
          setDeletingOfficialId(null);
        }
      }
    });
  };

  const handleRemoveTeam = (teamId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Club",
      message: "WARNING: Deleting this Club/Team will instantly wipe their login, all player cards and officials. Are you absolutely certain?",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        setDeletingTeamId(teamId);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/teams/${teamId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Action rejected.");
          }
          await loadAdminRecords();
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
        } finally {
          setDeletingTeamId(null);
        }
      }
    });
  };

  const handleAdminLogout = () => {
    logout();
    setFullTeamsList([]);
    setSelectedTeam(null);
  };

  const handlePrintSingleCard = (e: React.MouseEvent, cardClass: string) => {
    const cardEl = (e.currentTarget.closest(cardClass) as HTMLElement)?.querySelector('.print-card-container');
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
  };

  const filteredTeams = fullTeamsList.filter(t =>
    t.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Global stats
  const totalPlayers = fullTeamsList.reduce((s, t) => s + t.players.length, 0);
  const totalOfficials = fullTeamsList.reduce((s, t) => s + t.officials.length, 0);
  const normalTotal = fullTeamsList.reduce((s, t) => s + t.players.filter(p => p.category === "Under-17").length, 0);
  const overageTotal = fullTeamsList.reduce((s, t) => s + t.players.filter(p => p.category === "Free Age").length, 0);
  const normalMax = fullTeamsList.length * 20;
  const overageMax = fullTeamsList.length * 6;

  // ---------------------------------------------------------------------------
  // AUTH PROMPT VIEW
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#155e15_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0a3d0a] via-[#FFD700] to-[#0a3d0a]" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#FFD700]/80 hover:text-[#FFD700] bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full transition-all hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src={tournamentLogo} alt="Magistrate Khadijat Oloyade U17" className="h-16 w-16 rounded-full border-2 border-[#FFD700] object-cover shadow-lg shadow-yellow-900/40" />
            </div>
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-widest text-[#FFD700]">ADMIN VERIFICATION</h2>
            <p className="mt-1.5 text-xs text-slate-400 font-semibold uppercase tracking-widest">Magistrate Khadijat Oloyade Under-17 Cup · Control Center</p>
          </div>

          <div className="bg-slate-900 border border-emerald-800/40 py-8 px-6 shadow-2xl rounded-3xl space-y-5 animate-fade-in">
            {loginError && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/40 p-3.5 rounded-xl text-xs text-red-400 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Master Administration Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter master password"
                    className="w-full text-xs py-3 pl-9 pr-3.5 border border-emerald-800/30 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] bg-slate-950 text-white placeholder-slate-600 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] font-bold text-xs uppercase rounded-xl tracking-widest shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />Verifying access...</>
                ) : (
                  <><Shield className="h-4 w-4" />Verify Master Access</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN ADMIN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f0f4f0] text-[#141414] pb-20 font-sans">

      {/* TOP ACCENT LINE */}
      <div className="h-1 bg-gradient-to-r from-[#0a3d0a] via-[#FFD700] to-[#0a3d0a] no-print" />

      {/* NAVBAR */}
      <nav className="green-mesh border-b-4 border-[#FFD700] text-white py-3 px-4 sticky top-0 z-30 shadow-lg no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={tournamentLogo} alt="Magistrate Khadijat Oloyade U17" className="h-9 w-9 rounded-full border-2 border-[#FFD700] object-cover shadow-sm" />
            <div>
              <h1 className="font-bebas text-lg tracking-wider text-[#FFD700] leading-none uppercase">Magistrate Khadijat Oloyade Cup Admin Desk</h1>
              <span className="text-[9px] text-[#FFD700]/60 font-mono tracking-widest block uppercase leading-none mt-0.5">Master Ledger Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLivescore}
              className="py-1.5 px-3 bg-[#FFD700] hover:bg-yellow-400 text-[#0a3d0a] rounded-lg text-[10px] uppercase font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Share2 className="h-3 w-3" />
              Copy Livescore
            </button>
            <button
              onClick={loadAdminRecords}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] text-slate-200 uppercase font-semibold transition flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loadingRecords ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={handleAdminLogout}
              className="py-1.5 px-3 bg-red-600/90 hover:bg-red-700 border border-red-500 rounded-lg text-[10px] text-white uppercase font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* LIVE MATCH TICKER */}
      <LiveMarquee matches={matches} />

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6 no-print">

        {/* ERROR BANNER */}
        {errorOnRecords && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorOnRecords}</span>
          </div>
        )}

        {/* GLOBAL STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Registered Clubs", value: fullTeamsList.length, sub: null, icon: Building2, color: "text-[#0a3d0a]", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Total Players", value: totalPlayers, sub: `${totalOfficials} officials`, icon: Users, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Under-17 Players", value: normalTotal, sub: normalMax > 0 ? `${normalTotal} / ${normalMax} slots` : "20 per club", icon: Trophy, color: "text-emerald-700", bg: "bg-green-50", border: "border-green-200" },
            { label: "Overage Players", value: overageTotal, sub: overageMax > 0 ? `${overageTotal} / ${overageMax} slots` : "6 per club", icon: TrendingUp, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3 shadow-xs`}>
              <div className={`p-2 rounded-xl bg-white shadow-xs flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold leading-tight">{label}</div>
                {sub && <div className="text-[9px] text-gray-400 font-mono mt-0.5">{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* SIDEBAR: TEAM LIST */}
          <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs space-y-4 self-start">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Registered Clubs
              </h3>
              <p className="text-[10px] text-gray-400">{fullTeamsList.length} club profiles indexed</p>
            </div>

            {/* TOURNAMENT HUB ACCESS */}
            <button
              onClick={() => { setSelectedTeam(null); setActiveTab("overview"); }}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                !selectedTeam
                  ? 'bg-emerald-700 border-emerald-800 text-[#FFD700] shadow-md'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${!selectedTeam ? 'bg-white/10' : 'bg-emerald-50'}`}>
                  <Trophy className={`h-4 w-4 ${!selectedTeam ? 'text-[#FFD700]' : 'text-emerald-700'}`} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block uppercase tracking-wider">Tournament Hub</span>
                  <span className={`text-[8px] font-bold block uppercase tracking-widest ${!selectedTeam ? 'text-[#FFD700]/70' : 'text-slate-400'}`}>Stats & Standings</span>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 ${!selectedTeam ? 'text-[#FFD700]' : 'text-slate-300'}`} />
            </button>

            {/* SEARCH */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search club or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs py-2 px-3 pl-8 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] bg-slate-50/50"
              />
            </div>

            {/* TEAM LIST */}
            {loadingRecords ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl" />
                ))}
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {searchTerm ? "No clubs match your search." : "No clubs registered yet."}
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredTeams.map((team) => {
                  const isActive = selectedTeam?.id === team.id;
                  const u17 = team.players.filter(p => p.category === "Under-17").length;
                  const overage = team.players.filter(p => p.category !== "Under-17").length;
                  return (
                    <button
                      key={team.id}
                      onClick={() => { setSelectedTeam(team); setActiveTab("players"); }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-green-50 border-[#0a3d0a] ring-1 ring-[#0a3d0a]/50 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={team.logoUrl}
                          alt="Crest"
                          className="w-9 h-9 rounded-full border border-slate-200 bg-white object-cover flex-shrink-0 shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80`;
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate uppercase">{team.clubName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">{u17} U17</span>
                            {overage > 0 && <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">{overage} OVR</span>}
                            <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">{team.officials.length} OFF</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-[#0a3d0a]' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN DETAIL PANEL */}
          <div className="lg:col-span-3 space-y-5">

            {!selectedTeam ? (
              <div className="space-y-6">
                <div className="flex gap-2 no-print overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { id: "overview", label: "Standings & Stats" },
                    { id: "fixtures", label: "Upcoming Fixtures" },
                    { id: "results", label: "Completed Matches" },
                    { id: "tournament", label: "Tournament Manager" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                        (activeTab === tab.id || (tab.id === "overview" && activeTab === "players"))
                          ? 'bg-[#0a3d0a] text-[#FFD700] shadow-md'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Live & Recent Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.slice(0, 4).map(match => (
                        <div key={match._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-700">
                              {match.status === "Live" ? <Clock className="h-4 w-4 animate-pulse" /> : <Trophy className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-800">{match.homeTeamName} {match.homeScore}-{match.awayScore} {match.awayTeamName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{match.stage} • {match.status}</p>
                            </div>
                          </div>
                          <button onClick={() => setViewingMatch(match)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "overview" && <TournamentHub authToken={authToken || ""} activeTab="tournament" />}
                {activeTab === "fixtures" && <TournamentHub authToken={authToken || ""} activeTab="fixtures" />}
                {activeTab === "results" && <TournamentHub authToken={authToken || ""} activeTab="results" />}
                {activeTab === "tournament" && (
                  <TournamentManager 
                    teams={fullTeamsList} 
                    authToken={authToken || ""} 
                    onRefreshTeams={loadAdminRecords}
                    onViewMatch={(m) => setViewingMatch(m)}
                  />
                )}
              </div>
            ) : (
              <>
                {/* TEAM HEADER CARD */}
                <div className="bg-white border border-slate-200/60 shadow-xs rounded-3xl overflow-hidden">
                  <div className="green-mesh px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedTeam.logoUrl}
                        alt="Club Crest"
                        className="w-16 h-16 rounded-full border-2 border-[#FFD700] object-cover shadow-md bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=80&q=80`;
                        }}
                      />
                      <div className="text-white">
                        <h2 className="font-bebas text-2xl tracking-wide uppercase leading-tight text-[#FFD700]">
                          {selectedTeam.clubName}
                        </h2>
                        <p className="text-xs text-white/60 font-mono">@{selectedTeam.username}</p>
                        <div className="flex gap-3 text-[9px] uppercase tracking-wider font-extrabold text-white/70 mt-1.5">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedTeam.players.length} Players</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" />{selectedTeam.officials.length} Officials</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => window.print()}
                        disabled={selectedTeam.players.length === 0 && selectedTeam.officials.length === 0}
                        className="flex-1 sm:flex-none py-2 px-4 bg-[#FFD700] hover:bg-yellow-400 text-[#0a3d0a] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-40"
                      >
                        <Printer className="h-4 w-4" />
                        Print All
                      </button>
                      <button
                        onClick={() => handleRemoveTeam(selectedTeam.id)}
                        disabled={deletingTeamId === selectedTeam.id}
                        className="flex-1 sm:flex-none py-2 px-4 bg-red-600/90 hover:bg-red-700 text-white border border-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingTeamId === selectedTeam.id ? (
                          <><RefreshCw className="h-4 w-4 animate-spin" />Deleting...</>
                        ) : (
                          <><Trash2 className="h-4 w-4" />Delete Club</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* MINI QUOTA BARS */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-4 text-[10px]">
                    {[
                      { label: "Under-17 Players", count: selectedTeam.players.filter(p => p.category === "Under-17").length, max: 20, color: "bg-emerald-500" },
                      { label: "Overage Players", count: selectedTeam.players.filter(p => p.category === "Free Age").length, max: 6, color: "bg-amber-500" },
                      { label: "Officials", count: selectedTeam.officials.length, max: 4, color: "bg-blue-500" },
                    ].map(({ label, count, max, color }) => (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-500 font-semibold">{label}</span>
                          <span className="font-bold text-gray-700">{count}/{max}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min((count / max) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TABS */}
                <div className="flex gap-2 no-print overflow-x-auto pb-1">
                  {(["players", "officials", "tournament"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                        activeTab === tab
                          ? 'bg-[#0a3d0a] text-[#FFD700] shadow-sm'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab === "players"
                        ? `Players (${selectedTeam.players.length})`
                        : tab === "officials"
                        ? `Officials (${selectedTeam.officials.length})`
                        : "Tournament Manager"}
                    </button>
                  ))}
                </div>

                {/* TOURNAMENT MANAGER TAB */}
                {activeTab === "tournament" && (
                  <TournamentManager 
                    teams={fullTeamsList} 
                    authToken={authToken || ""} 
                    onRefreshTeams={loadAdminRecords}
                    onViewMatch={(m) => setViewingMatch(m)}
                  />
                )}

                {/* PLAYERS TAB */}
                {activeTab === "players" && (
                  <div className="space-y-4">
                    {selectedTeam.players.length === 0 ? (
                      <div className="bg-white py-16 rounded-3xl text-center border border-slate-200/60 text-slate-400">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold">No player cards registered</p>
                        <p className="text-xs mt-1">This club hasn't added any players yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
                          {selectedTeam.players.map((player) => (
                            <div key={player._id} className="relative group/card">
                              <PrintCard
                                person={player}
                                type="player"
                                team={selectedTeam as unknown as Team}
                              />
                              <div className="absolute top-2 right-2 flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-md border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-all z-10">
                                <button
                                  onClick={(e) => handlePrintSingleCard(e, '.group\\/card')}
                                  className="p-1.5 text-[#0a3d0a] hover:bg-green-50 rounded-md transition"
                                  title="Print Card"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemovePlayer(player._id)}
                                  disabled={deletingPlayerId === player._id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete Player"
                                >
                                  {deletingPlayerId === player._id ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* OFFICIALS TAB */}
                {activeTab === "officials" && (
                  <div className="space-y-4">
                    {selectedTeam.officials.length === 0 ? (
                      <div className="bg-white py-16 rounded-3xl text-center border border-slate-200/60 text-slate-400">
                        <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold">No officials registered</p>
                        <p className="text-xs mt-1">This club hasn't added any technical staff yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
                        {selectedTeam.officials.map((official) => (
                          <div key={official._id} className="relative group/card">
                            <PrintCard
                              person={official}
                              type="official"
                              team={selectedTeam as unknown as Team}
                            />
                            <div className="absolute top-2 right-2 flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-md border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-all z-10">
                              <button
                                onClick={(e) => handlePrintSingleCard(e, '.group\\/card')}
                                className="p-1.5 text-emerald-700 hover:bg-green-50 rounded-md transition"
                                title="Print Card"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveOfficial(official._id)}
                                disabled={deletingOfficialId === official._id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Official"
                              >
                                {deletingOfficialId === official._id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT GRID */}
      {selectedTeam && (
        <div className="hidden print:block print-grid">
          {selectedTeam.players.map((player) => (
            <div key={player._id} className="p-1 flex items-center justify-center">
              <PrintCard person={player} type="player" team={selectedTeam as unknown as Team} />
            </div>
          ))}
          {selectedTeam.officials.map((official) => (
            <div key={official._id} className="p-1 flex items-center justify-center">
              <PrintCard person={official} type="official" team={selectedTeam as unknown as Team} />
            </div>
          ))}
        </div>
      )}

      {viewingMatch && (
        <MatchCenter 
          match={viewingMatch} 
          onClose={() => setViewingMatch(null)} 
          allPlayers={fullTeamsList.flatMap(t => t.players)} 
        />
      )}

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isDangerous={modalConfig.isDangerous}
      />
    </div>
  );
};
