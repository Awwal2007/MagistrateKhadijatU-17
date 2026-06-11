import React, { useState, useEffect } from "react";
import { Match, Team, Player } from "../types.js";
import {
  Trophy, Calendar, Plus, Trash2, Shield, CalendarDays,
  RefreshCw, CheckCircle, Clock, ChevronDown, Swords, Star,
  AlertCircle, Layers, Zap, Eye, Pencil, Edit2, X
} from "lucide-react";
import { LiveScoringBoard } from "./LiveScoringBoard.js";
import { Modal } from "./Modal.js";

interface FullTeamRoster extends Team {
  group?: "A" | "B" | "C" | null;
  players?: Player[];
  officials?: any[];
}

interface TournamentManagerProps {
  teams: FullTeamRoster[];
  authToken: string;
  onRefreshTeams: () => void;
  onViewMatch?: (match: Match) => void;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Group Stage":    { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
  "Quarter Final":  { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  "Semi Final":     { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  "Final":          { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200" },
};

const GROUP_COLORS: Record<string, { bg: string; text: string; ring: string; dot: string; cardBg: string; cardBorder: string; headerBorder: string }> = {
  A: { bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-400", dot: "bg-emerald-500", cardBg: "bg-emerald-50",  cardBorder: "border-emerald-300", headerBorder: "border-emerald-200" },
  B: { bg: "bg-blue-100",    text: "text-blue-800",    ring: "ring-blue-400",    dot: "bg-blue-500",    cardBg: "bg-blue-50",     cardBorder: "border-blue-300",    headerBorder: "border-blue-200"    },
  C: { bg: "bg-purple-100",  text: "text-purple-800",  ring: "ring-purple-400",  dot: "bg-purple-500",  cardBg: "bg-purple-50",   cardBorder: "border-purple-300",  headerBorder: "border-purple-200"  },
};

export const TournamentManager: React.FC<TournamentManagerProps> = ({ teams, authToken, onRefreshTeams, onViewMatch }) => {
  const [matches, setMatches]       = useState<Match[]>([]);
  const [loading, setLoading]       = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"groups" | "schedule" | "matches" | "standings" | "live-scoring">(
    (localStorage.getItem("tm_active_section") as any) || "matches"
  );

  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState<string | null>(
    localStorage.getItem("tm_selected_match_id")
  );

  // Live Scoring State
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [now, setNow] = useState(Date.now());

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
    isDangerous?: boolean;
  }>({ isOpen: false, title: "", message: "", type: "info" });

  // Score editing local state: matchId -> { home, away }
  const [scoreEdits, setScoreEdits] = useState<Record<string, { home: string; away: string }>>({});
  const [savingScore, setSavingScore] = useState<string | null>(null);

  // Edit Match Details State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [editStage, setEditStage] = useState<"Group Stage" | "Quarter Final" | "Semi Final" | "Final">("Group Stage");
  const [editGroup, setEditGroup] = useState<"A" | "B" | "C" | "">("");
  const [editRound, setEditRound] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editReferee, setEditReferee] = useState("");

  // New state for available referees
  const [availableReferees, setAvailableReferees] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // New Match Form
  const [newMatchHome,  setNewMatchHome]  = useState("");
  const [newMatchAway,  setNewMatchAway]  = useState("");
  const [newMatchStage, setNewMatchStage] = useState<"Group Stage" | "Quarter Final" | "Semi Final" | "Final">("Group Stage");
  const [newMatchRound, setNewMatchRound] = useState("");
  const [newMatchGroup, setNewMatchGroup] = useState<"A" | "B" | "C" | "">("");
  const [newMatchDate,  setNewMatchDate]  = useState("");
  const [newMatchTime,  setNewMatchTime]  = useState("");
  const [creating, setCreating]          = useState(false);

  useEffect(() => { loadMatches(); }, [authToken]);

  // Effect to populate availableReferees
  useEffect(() => {
    const uniqueReferees = new Set<string>();
    // Add some default referee names
    uniqueReferees.add("Referee");
    // uniqueReferees.add("Referee Jane Smith");
    // uniqueReferees.add("Referee Alex Green");

    matches.forEach(match => {
      if (match.refereeId) uniqueReferees.add(match.refereeId);
    });
    setAvailableReferees(Array.from(uniqueReferees).sort());
  }, [matches]); // Re-run when matches data changes

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getLiveTime = (m: Match) => {
    const accumulated = m.timerAccumulatedTime || 0;
    const lastStartedTime = m.timerLastStarted ? new Date(m.timerLastStarted).getTime() : 0;
    const diff = (m.status === "Live" && lastStartedTime > 0) ? Math.floor((now - lastStartedTime) / 1000) : 0;
    const totalSecs = Math.max(0, accumulated + diff);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("tm_active_section", activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (selectedLiveMatchId) {
      localStorage.setItem("tm_selected_match_id", selectedLiveMatchId);
    } else {
      localStorage.removeItem("tm_selected_match_id");
    }
  }, [selectedLiveMatchId]);

  // Restore selected match object once matches are loaded
  useEffect(() => {
    if (selectedLiveMatchId && matches.length > 0) {
      const match = matches.find(m => m._id === selectedLiveMatchId);
      if (match) {
        handleSelectLiveMatch(match);
      }
    }
  }, [matches, selectedLiveMatchId]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to load matches");
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const handleUpdateGroup = async (teamId: string, group: string) => {
    setSyncing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/teams/${teamId}/group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ group: group === "" ? null : group })
      });
      if (!res.ok) throw new Error("Failed to update group");
      setTimeout(() => {
        onRefreshTeams();
        setSyncing(false);
      }, 500);
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Sync Error", message: err.message, type: "error" });
      setSyncing(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMatchHome === newMatchAway) { 
      setModalConfig({ isOpen: true, title: "Validation Error", message: "Home and away teams cannot be the same.", type: "warning" });
      return; 
    }
    if (!newMatchDate) { 
      setModalConfig({ isOpen: true, title: "Validation Error", message: "Match date is required.", type: "warning" });
      return; 
    }
    setCreating(true);
    try {
      const matchDate = newMatchTime ? `${newMatchDate}T${newMatchTime}` : newMatchDate;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          homeTeamId: newMatchHome, awayTeamId: newMatchAway,
          stage: newMatchStage, group: newMatchGroup === "" ? null : newMatchGroup,
          round: newMatchRound === "" ? null : newMatchRound,
          matchDate
        })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to schedule match"); }
      setNewMatchHome(""); setNewMatchAway(""); setNewMatchDate(""); setNewMatchTime(""); setNewMatchRound("");
      setActiveSection("matches");
      loadMatches();
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Schedule Error", message: err.message, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveScore = async (match: Match) => {
    const edit = scoreEdits[match._id];
    if (!edit) return;
    setSavingScore(match._id);
    const homeScore = edit.home === "" ? null : parseInt(edit.home);
    const awayScore = edit.away === "" ? null : parseInt(edit.away);
    const status = (homeScore !== null && awayScore !== null) ? "Completed" : "Scheduled";
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ homeScore, awayScore, status })
      });
      if (!res.ok) throw new Error("Failed to update match");
      setScoreEdits(prev => { const n = { ...prev }; delete n[match._id]; return n; });
      loadMatches();
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Update Error", message: err.message, type: "error" });
      if (match._id === selectedLiveMatchId) setSelectedLiveMatchId(null);
    } finally {
      setSavingScore(null);
    }
  };

  const startEditingMatch = (match: Match) => {
    setEditingMatch(match);
    setEditHome(match.homeTeamId);
    setEditAway(match.awayTeamId);
    setEditStage(match.stage as any);
    setEditGroup((match.group || "") as any);
    setEditRound(match.round || "");
    setEditReferee(match.refereeId || "");
    
    const d = new Date(match.matchDate);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(d.toTimeString().slice(0, 5));
  };

  const handleUpdateMatchDetails = async () => {
    if (!editingMatch) return;
    if (editHome === editAway) {
      setModalConfig({ isOpen: true, title: "Validation Error", message: "Home and away teams cannot be the same.", type: "warning" });
      return;
    }
    setUpdating(true);
    try {
      const matchDate = editTime ? `${editDate}T${editTime}` : editDate;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${editingMatch._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          homeTeamId: editHome,
          awayTeamId: editAway,
          stage: editStage,
          group: editGroup === "" ? null : editGroup,
          round: editRound === "" ? null : editRound,
          refereeId: editReferee === "" ? null : editReferee,
          matchDate
        })
      });
      if (!res.ok) throw new Error("Failed to update match details");
      setEditingMatch(null);
      loadMatches();
      onRefreshTeams();
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Update Error", message: err.message, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusToggle = async (match: Match) => {
    const newStatus = match.status === "Completed" ? "Scheduled" : "Completed";
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ homeScore: match.homeScore, awayScore: match.awayScore, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadMatches();
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Status Error", message: err.message, type: "error" });
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Match",
      message: "Delete this match permanently?",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${matchId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (!res.ok) throw new Error("Failed to delete match");
          loadMatches();
          if (matchId === selectedLiveMatchId) setSelectedLiveMatchId(null);
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Delete Error", message: err.message, type: "error" });
        }
      }
    });
  };

  const loadPlayersForMatch = (match: Match) => {
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);

    if (homeTeam) {
      setHomeTeamPlayers((homeTeam.players as any) || []);
    }
    if (awayTeam) {
      setAwayTeamPlayers((awayTeam.players as any) || []);
    }
  };

  const handleSelectLiveMatch = (match: Match) => {
    setSelectedLiveMatchId(match._id);
    setSelectedLiveMatch(match);
    loadPlayersForMatch(match);
    setActiveSection("live-scoring");
  };

  // Group matches by stage for display
  const stageOrder = ["Group Stage", "Quarter Final", "Semi Final", "Final"];
  const matchesByStage = stageOrder.reduce((acc, stage) => {
    const staged = matches.filter(m => m.stage === stage);
    if (staged.length > 0) acc[stage] = staged;
    return acc;
  }, {} as Record<string, Match[]>);

  // Compute standings per group
  const groupStandings = (group: "A" | "B" | "C") => {
    const groupTeams = teams.filter(t => t.group === group);
    const groupMatches = matches.filter(m => m.group === group && m.status === "Completed");
    return groupTeams.map(team => {
      let W = 0, D = 0, L = 0, GF = 0, GA = 0;
      groupMatches.forEach(m => {
        const isHome = m.homeTeamId === team.id;
        const isAway = m.awayTeamId === team.id;
        if (!isHome && !isAway) return;
        const ts = isHome ? m.homeScore : m.awayScore;
        const os = isHome ? m.awayScore : m.homeScore;
        if (ts === null || os === null) return;
        GF += ts; GA += os;
        if (ts > os) W++;
        else if (ts === os) D++;
        else L++;
      });
      const P = W + D + L;
      const Pts = W * 3 + D;
      return { team, P, W, D, L, GF, GA, GD: GF - GA, Pts };
    }).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
  };

  const sections = [
    { id: "matches",  label: "Match Board",      icon: Swords },
    { id: "live-scoring", label: "Live Scoring", icon: Zap },
    { id: "standings", label: "Standings",        icon: Trophy },
    { id: "groups",   label: "Group Allocation",  icon: Shield },
    { id: "schedule", label: "Schedule Match",    icon: CalendarDays },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* SECTION TABS */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
              activeSection === id
                ? "bg-[#0a3d0a] text-[#FFD700] shadow-md"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {id === "matches" && matches.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === id ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-slate-100 text-slate-500"}`}>
                {matches.length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={loadMatches}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ───── MATCH BOARD ───── */}
      {activeSection === "matches" && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 shadow-xs" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
              <div className="text-5xl mb-4">🏟️</div>
              <h4 className="font-bebas text-2xl text-slate-400 tracking-wider">No Matches Scheduled</h4>
              <p className="text-xs text-slate-400 mt-2">Use the <strong>Schedule Match</strong> tab to add fixtures.</p>
              <button
                onClick={() => setActiveSection("schedule")}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a3d0a] text-[#FFD700] rounded-xl text-xs font-bold uppercase transition hover:bg-[#072a07]"
              >
                <Plus className="h-3.5 w-3.5" /> Schedule First Match
              </button>
            </div>
          ) : (
            Object.entries(matchesByStage).map(([stage, stageMatches]) => {
              const sc = STAGE_COLORS[stage] || STAGE_COLORS["Group Stage"];
              return (
                <div key={stage} className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
                  {/* Stage Header */}
                  <div className={`flex items-center justify-between px-6 py-3.5 border-b ${sc.border} ${sc.bg}`}>
                    <div className="flex items-center gap-2.5">
                      {stage === "Final" ? <Star className={`h-4 w-4 ${sc.text}`} /> : <Trophy className={`h-4 w-4 ${sc.text}`} />}
                      <span className={`font-bebas text-lg tracking-widest uppercase ${sc.text}`}>{stage}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>
                        {stageMatches.length} match{stageMatches.length !== 1 ? "es" : ""}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold ${sc.text} opacity-60`}>
                      {stageMatches.filter(m => m.status === "Completed").length} / {stageMatches.length} played
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stageMatches.map(match => {
                      const edit = scoreEdits[match._id];
                      const isDirty = !!edit;
                      const homeVal = edit ? edit.home : (match.homeScore === null ? "" : String(match.homeScore));
                      const awayVal = edit ? edit.away : (match.awayScore === null ? "" : String(match.awayScore));
                      const isCompleted = match.status === "Completed";
                      const homeWins = isCompleted && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
                      const awayWins = isCompleted && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
                      const { date, time } = formatMatchDateTime(match.matchDate);

                      return (
                        <div key={match._id} className={`px-5 py-4 flex flex-col sm:flex-row items-center gap-4 transition-colors ${isCompleted ? "bg-emerald-50/30" : "hover:bg-slate-50/60"}`}>

                          {/* Left: meta badges with TIME */}
                          <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto sm:min-w-[180px]">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${sc.border} ${sc.bg} ${sc.text}`}>
                                  {stage === "Group Stage" && match.group ? `Grp ${match.group}` : stage}
                                  {match.round ? ` - ${match.round}` : ''}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {isCompleted ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                  {isCompleted ? "FT" : "Scheduled"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                <Calendar className="h-3 w-3" />
                                <span>{date}</span>
                                <Clock className="h-3 w-3 ml-1" />
                                <span className="font-mono font-semibold text-slate-500">{time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Center: VS matchup */}
                          <div className="flex-1 flex items-center justify-center gap-3">
                            {/* Home */}
                            <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 ${homeWins ? "opacity-100" : awayWins ? "opacity-50" : ""}`}>
                              <img
                                src={match.homeTeamLogo}
                                alt={match.homeTeamName}
                                className={`w-10 h-10 rounded-full object-cover border-2 bg-white shadow-xs ${homeWins ? "border-emerald-400" : "border-slate-200"}`}
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80"; }}
                              />
                              <span className="text-[11px] font-extrabold text-slate-800 text-center uppercase leading-tight line-clamp-2 max-w-[90px]">
                                {match.homeTeamName}
                              </span>
                              {homeWins && <span className="text-[9px] text-emerald-600 font-bold uppercase">Winner</span>}
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="—"
                                  value={homeVal}
                                  readOnly={isCompleted}
                                  onChange={(e) => setScoreEdits(prev => ({
                                    ...prev,
                                    [match._id]: { home: e.target.value, away: prev[match._id]?.away ?? awayVal }
                                  }))}
                                  className={`w-12 text-center text-lg font-black py-1.5 border rounded-xl transition ${
                                    isDirty ? "border-[#0a3d0a] bg-green-50 ring-1 ring-[#0a3d0a]" : isCompleted ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60" : "border-slate-200 bg-white"
                                  }`}
                                />
                                <span className="text-xl font-black text-slate-300">:</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="—"
                                  value={awayVal}
                                  readOnly={isCompleted}
                                  onChange={(e) => setScoreEdits(prev => ({
                                    ...prev,
                                    [match._id]: { home: prev[match._id]?.home ?? homeVal, away: e.target.value }
                                  }))}
                                  className={`w-12 text-center text-lg font-black py-1.5 border rounded-xl transition ${
                                    isDirty ? "border-[#0a3d0a] bg-green-50 ring-1 ring-[#0a3d0a]" : isCompleted ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60" : "border-slate-200 bg-white"
                                  }`}
                                />
                              </div>
                              {isDirty && (
                                <button
                                  onClick={() => handleSaveScore(match)}
                                  disabled={savingScore === match._id}
                                  className="flex items-center gap-1 text-[10px] font-bold bg-[#0a3d0a] text-[#FFD700] px-3 py-1 rounded-lg transition hover:bg-[#072a07] disabled:opacity-60"
                                >
                                  {savingScore === match._id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                  Save
                                </button>
                              )}
                            </div>

                            {/* Away */}
                            <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 ${awayWins ? "opacity-100" : homeWins ? "opacity-50" : ""}`}>
                              <img
                                src={match.awayTeamLogo}
                                alt={match.awayTeamName}
                                className={`w-10 h-10 rounded-full object-cover border-2 bg-white shadow-xs ${awayWins ? "border-emerald-400" : "border-slate-200"}`}
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80"; }}
                              />
                              <span className="text-[11px] font-extrabold text-slate-800 text-center uppercase leading-tight line-clamp-2 max-w-[90px]">
                                {match.awayTeamName}
                              </span>
                              {awayWins && <span className="text-[9px] text-emerald-600 font-bold uppercase">Winner</span>}
                            </div>
                          </div>

                          {/* Right: actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!isCompleted && (
                              <>
                                <button
                                  onClick={() => startEditingMatch(match)}
                                  title="Edit Fixture Teams/Date"
                                  className="p-2 rounded-xl border transition text-xs font-bold text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSelectLiveMatch(match)}
                                  title="Start Live Scoring"
                                  className="p-2 rounded-xl border transition text-xs font-bold text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100"
                                >
                                  <Zap className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {/* The "View Tactical Pitch" button can remain visible for completed matches */}
                            {onViewMatch && (
                              <button
                                onClick={() => onViewMatch(match)}
                                title="View Tactical Pitch"
                                className="p-2 rounded-xl border transition text-xs font-bold text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusToggle(match)}
                              title={isCompleted ? "Mark as Scheduled" : "Mark as Completed"}
                              className={`p-2 rounded-xl border transition text-xs font-bold ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                              }`}
                            >
                              {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteMatch(match._id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition"
                              title="Delete Match"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───── STANDINGS ───── */}
      {activeSection === "standings" && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#0a3d0a]" />
            <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">Group Standings</h3>
          </div>

          {teams.filter(t => t.group).length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs px-6">
              <div className="text-4xl mb-4">📊</div>
              <p className="font-semibold mb-2">No Groups Assigned Yet</p>
              <p>Go to <strong>Group Allocation</strong> to assign teams to groups and view standings.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {(["A", "B", "C"] as const).map(group => {
                const groupTeams = teams.filter(t => t.group === group);
                if (groupTeams.length === 0) return null;
                const gc = GROUP_COLORS[group];
                const standings = groupStandings(group);
                return (
                  <div key={group} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className={`px-4 py-2.5 ${gc.bg} ${gc.headerBorder} border-b flex items-center gap-2`}>
                      <span className={`w-2 h-2 rounded-full ${gc.dot}`} />
                      <span className={`font-bebas text-base tracking-widest uppercase ${gc.text}`}>Group {group}</span>
                      <span className={`ml-auto text-[10px] font-bold ${gc.text} opacity-60`}>{groupTeams.length} club{groupTeams.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100 bg-slate-50">
                            <th className="text-left pl-4 py-2 w-6">#</th>
                            <th className="text-left py-2">Club</th>
                            <th className="text-center py-2 w-9">P</th>
                            <th className="text-center py-2 w-9">W</th>
                            <th className="text-center py-2 w-9">D</th>
                            <th className="text-center py-2 w-9">L</th>
                            <th className="text-center py-2 w-9">GF</th>
                            <th className="text-center py-2 w-9">GA</th>
                            <th className="text-center py-2 w-11">GD</th>
                            <th className="text-center pr-4 py-2 w-11 font-black text-slate-600">Pts</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {standings.map((row, i) => (
                            <tr key={row.team.id} className={`transition-colors ${i === 0 ? `${gc.cardBg}` : "hover:bg-slate-50"}`}>
                              <td className="pl-4 py-2.5 font-black text-slate-500">{i + 1}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <img src={row.team.logoUrl} alt={row.team.clubName} className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-white" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=40&q=80"; }} />
                                  <span className="font-bold text-slate-800 uppercase text-[11px] truncate max-w-[110px]">{row.team.clubName}</span>
                                  {i === 0 && <span className={`text-[9px] font-bold ${gc.bg} ${gc.text} px-1.5 py-0.5 rounded-full`}>Leader</span>}
                                </div>
                              </td>
                              <td className="text-center py-2.5 text-slate-500">{row.P}</td>
                              <td className="text-center py-2.5 text-emerald-700 font-bold">{row.W}</td>
                              <td className="text-center py-2.5 text-amber-600 font-bold">{row.D}</td>
                              <td className="text-center py-2.5 text-red-500 font-bold">{row.L}</td>
                              <td className="text-center py-2.5 text-slate-500">{row.GF}</td>
                              <td className="text-center py-2.5 text-slate-500">{row.GA}</td>
                              <td className={`text-center py-2.5 font-bold ${row.GD > 0 ? "text-emerald-600" : row.GD < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {row.GD > 0 ? `+${row.GD}` : row.GD}
                              </td>
                              <td className="text-center pr-4 py-2.5">
                                <span className="font-black text-[#0a3d0a] text-sm">{row.Pts}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── GROUP ALLOCATION ───── */}
      {activeSection === "groups" && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0a3d0a]" />
              <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">Group Allocation</h3>
            </div>
            {syncing && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
          </div>

          {teams.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No clubs registered yet.</div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => {
                const gc = team.group ? GROUP_COLORS[team.group] : null;
                return (
                  <div
                    key={team.id}
                    className={`rounded-2xl p-4 border-2 transition-all relative ${
                      gc ? `${gc.cardBg} ${gc.cardBorder}` : "bg-white border-slate-200"
                    }`}
                  >
                    {gc && (
                      <span className={`absolute top-3 right-3 flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${gc.bg} ${gc.text}`}>
                        <CheckCircle className="h-3 w-3" />
                        Group {team.group}
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-3 pr-16">
                      <div className="relative flex-shrink-0">
                        <img
                          src={team.logoUrl}
                          alt={team.clubName}
                          className={`w-11 h-11 rounded-full object-cover bg-white shadow ${
                            gc ? `border-2 ${gc.cardBorder} ring-2 ${gc.ring}` : "border-2 border-slate-200"
                          }`}
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80"; }}
                        />
                        {gc && (
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${gc.dot} border-2 border-white flex items-center justify-center`}>
                            <span className="text-white text-[7px] font-black">{team.group}</span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-slate-800 uppercase block truncate">{team.clubName}</span>
                        <span className={`text-[10px] font-semibold ${
                          gc ? gc.text : "text-slate-400"
                        }`}>
                          {gc ? `✓ Assigned to Group ${team.group}` : "⚬ Not yet assigned"}
                        </span>
                      </div>
                    </div>

                    <select
                      value={team.group || ""}
                      onChange={(e) => handleUpdateGroup(team.id, e.target.value)}
                      className={`w-full text-xs py-2 px-3 border rounded-xl bg-white focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] font-semibold ${
                        gc ? `${gc.cardBorder}` : "border-slate-300"
                      }`}
                    >
                      <option value="">— No Group —</option>
                      <option value="A">Group A</option>
                      <option value="B">Group B</option>
                      <option value="C">Group C</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {teams.some(t => t.group) && (
            <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-[#0a3d0a]" />
                <h4 className="font-bebas text-lg text-[#0a3d0a] tracking-wider uppercase">Group Standings</h4>
              </div>
              {(["A", "B", "C"] as const).map(group => {
                const groupTeams = teams.filter(t => t.group === group);
                if (groupTeams.length === 0) return null;
                const gc = GROUP_COLORS[group];
                const standings = groupStandings(group);
                return (
                  <div key={group} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className={`px-4 py-2.5 ${gc.bg} ${gc.headerBorder} border-b flex items-center gap-2`}>
                      <span className={`w-2 h-2 rounded-full ${gc.dot}`} />
                      <span className={`font-bebas text-base tracking-widest uppercase ${gc.text}`}>Group {group}</span>
                      <span className={`ml-auto text-[10px] font-bold ${gc.text} opacity-60`}>{groupTeams.length} club{groupTeams.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100 bg-slate-50">
                            <th className="text-left pl-4 py-2 w-6">#</th>
                            <th className="text-left py-2">Club</th>
                            <th className="text-center py-2 w-9">P</th>
                            <th className="text-center py-2 w-9">W</th>
                            <th className="text-center py-2 w-9">D</th>
                            <th className="text-center py-2 w-9">L</th>
                            <th className="text-center py-2 w-9">GF</th>
                            <th className="text-center py-2 w-9">GA</th>
                            <th className="text-center py-2 w-11">GD</th>
                            <th className="text-center pr-4 py-2 w-11 font-black text-slate-600">Pts</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {standings.map((row, i) => (
                            <tr key={row.team.id} className={`transition-colors ${i === 0 ? `${gc.cardBg}` : "hover:bg-slate-50"}`}>
                              <td className="pl-4 py-2.5 font-black text-slate-500">{i + 1}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <img src={row.team.logoUrl} alt={row.team.clubName} className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-white" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=40&q=80"; }} />
                                  <span className="font-bold text-slate-800 uppercase text-[11px] truncate max-w-[110px]">{row.team.clubName}</span>
                                  {i === 0 && <span className={`text-[9px] font-bold ${gc.bg} ${gc.text} px-1.5 py-0.5 rounded-full`}>Leader</span>}
                                </div>
                              </td>
                              <td className="text-center py-2.5 text-slate-500">{row.P}</td>
                              <td className="text-center py-2.5 text-emerald-700 font-bold">{row.W}</td>
                              <td className="text-center py-2.5 text-amber-600 font-bold">{row.D}</td>
                              <td className="text-center py-2.5 text-red-500 font-bold">{row.L}</td>
                              <td className="text-center py-2.5 text-slate-500">{row.GF}</td>
                              <td className="text-center py-2.5 text-slate-500">{row.GA}</td>
                              <td className={`text-center py-2.5 font-bold ${row.GD > 0 ? "text-emerald-600" : row.GD < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {row.GD > 0 ? `+${row.GD}` : row.GD}
                              </td>
                              <td className="text-center pr-4 py-2.5">
                                <span className="font-black text-[#0a3d0a] text-sm">{row.Pts}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── SCHEDULE MATCH ───── */}
      {activeSection === "schedule" && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#0a3d0a]" />
            <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">Schedule New Match</h3>
          </div>

          <form onSubmit={handleCreateMatch} className="p-6 space-y-5">
            {/* Stage + Group */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stage *</label>
                <select
                  value={newMatchStage}
                  onChange={(e: any) => setNewMatchStage(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                >
                  <option value="Group Stage">Group Stage</option>
                  <option value="Quarter Final">Quarter Final</option>
                  <option value="Semi Final">Semi Final</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Group <span className="text-slate-300">(optional)</span></label>
                <select
                  value={newMatchGroup}
                  onChange={(e: any) => setNewMatchGroup(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                >
                  <option value="">— None —</option>
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                  <option value="C">Group C</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Round <span className="text-slate-300">(optional)</span></label>
                <input
                  list="rounds-list"
                  type="text"
                  placeholder="e.g. Round 1"
                  value={newMatchRound}
                  onChange={(e) => setNewMatchRound(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                />
                <datalist id="rounds-list">
                  <option value="Round 1" />
                  <option value="Round 2" />
                  <option value="Round 3" />
                  <option value="Round 4" />
                  <option value="Quarter Finals" />
                  <option value="Semi Finals" />
                  <option value="Finals" />
                </datalist>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Home Team *</label>
                <select
                  required
                  value={newMatchHome}
                  onChange={(e) => setNewMatchHome(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                >
                  <option value="">Select Home Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.clubName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Away Team *</label>
                <select
                  required
                  value={newMatchAway}
                  onChange={(e) => setNewMatchAway(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                >
                  <option value="">Select Away Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.clubName}</option>)}
                </select>
              </div>
            </div>

            {/* VS preview */}
            {newMatchHome && newMatchAway && newMatchHome !== newMatchAway && (() => {
              const home = teams.find(t => t.id === newMatchHome);
              const away = teams.find(t => t.id === newMatchAway);
              if (!home || !away) return null;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <img src={home.logoUrl} alt={home.clubName} className="w-12 h-12 rounded-full object-cover border-2 border-[#0a3d0a] bg-white shadow" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80"; }} />
                    <span className="text-[10px] font-extrabold uppercase text-slate-700 text-center max-w-[80px] truncate">{home.clubName}</span>
                    <span className="text-[9px] text-slate-400 font-bold">HOME</span>
                  </div>
                  <div className="text-2xl font-black text-slate-300">VS</div>
                  <div className="flex flex-col items-center gap-1.5">
                    <img src={away.logoUrl} alt={away.clubName} className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 bg-white shadow" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80"; }} />
                    <span className="text-[10px] font-extrabold uppercase text-slate-700 text-center max-w-[80px] truncate">{away.clubName}</span>
                    <span className="text-[9px] text-slate-400 font-bold">AWAY</span>
                  </div>
                </div>
              );
            })()}

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Match Date *</label>
                <input
                  type="date"
                  required
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kick-off Time <span className="text-slate-300">(optional)</span></label>
                <input
                  type="time"
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 bg-[#0a3d0a] text-[#FFD700] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#072a07] transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Scheduling..." : "Schedule Match"}
            </button>
          </form>
        </div>
      )}

      {/* ───── LIVE SCORING ───── */}
      {activeSection === "live-scoring" && (
        <div>
          {selectedLiveMatch ? (
            <LiveScoringBoard
              match={selectedLiveMatch}
              homeTeamPlayers={homeTeamPlayers}
              awayTeamPlayers={awayTeamPlayers}
              authToken={authToken}
              onMatchUpdated={(updatedMatch) => {
                setSelectedLiveMatch(updatedMatch);
                loadMatches();
              }}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#0a3d0a]" />
                <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">Live Scoring</h3>
              </div>
              <div className="py-16 text-center text-slate-400 text-xs px-6">
                <div className="text-5xl mb-4">⚡</div>
                <p className="font-semibold mb-2">Select a Match to Start Live Scoring</p>
                <p>Go to the <strong>Match Board</strong> tab and click the ⚡ button on any match to begin live scoring.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── EDIT MATCH MODAL ───── */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="green-mesh p-6 text-white flex justify-between items-center border-b-4 border-[#FFD700]">
              <div className="flex items-center gap-3">
                <Edit2 className="h-5 w-5 text-[#FFD700]" />
                <h3 className="font-bebas text-2xl tracking-widest uppercase">Edit Fixture Details</h3>
              </div>
              <button onClick={() => setEditingMatch(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stage *</label>
                  <select
                    value={editStage}
                    onChange={(e: any) => setEditStage(e.target.value)}
                    className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                  >
                    <option value="Group Stage">Group Stage</option>
                    <option value="Quarter Final">Quarter Final</option>
                    <option value="Semi Final">Semi Final</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Group</label>
                  <select
                    value={editGroup}
                    onChange={(e: any) => setEditGroup(e.target.value)}
                    className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a]"
                  >
                    <option value="">— None —</option>
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="C">Group C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Round / Match Name</label>
                <input
                  type="text"
                  placeholder="e.g. Round 1"
                  value={editRound}
                  onChange={(e) => setEditRound(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Referee (Login Name)</label>
                <select
                  value={editReferee}
                  onChange={(e) => setEditReferee(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50"
                >
                  <option value="">— Unassigned —</option>
                  {availableReferees.map(ref => (
                    <option key={ref} value={ref}>{ref}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Home Team *</label>
                  <select
                    required
                    value={editHome}
                    onChange={(e) => setEditHome(e.target.value)}
                    className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50"
                  >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.clubName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Away Team *</label>
                  <select
                    required
                    value={editAway}
                    onChange={(e) => setEditAway(e.target.value)}
                    className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50"
                  >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.clubName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Match Date *</label>
                  <input type="date" required value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kick-off Time</label>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl bg-slate-50/50" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setEditingMatch(null)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button
                onClick={handleUpdateMatchDetails}
                disabled={updating}
                className="flex-[2] py-3 bg-[#0a3d0a] text-[#FFD700] rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition disabled:opacity-60"
              >
                {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {updating ? "Saving Changes..." : "Apply Updates"}
              </button>
            </div>
          </div>
        </div>
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