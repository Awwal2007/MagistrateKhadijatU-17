import React, { useState, useEffect } from "react";
import { Match, Player } from "../types.js";
import { Modal } from "./Modal.js"
import {
  Play, Square, Trash2, Plus, RefreshCw, TrendingUp, Zap, Trophy, Clock, AlertTriangle, Pause
} from "lucide-react";

interface LiveScoringBoardProps {
  match: Match;
  homeTeamPlayers: Player[];
  awayTeamPlayers: Player[];
  authToken: string;
  onMatchUpdated: (updatedMatch: Match) => void;
}

interface GoalScorer {
  name: string;
  goals: number;
}

// Define Goal type if not imported
interface Goal {
  team: "home" | "away";
  playerName: string;
  playerId: string;
  jerseyNumber?: number;
  timestamp?: string | Date;
  matchTime?: number;
}

interface Card {
  team: "home" | "away";
  type: "Yellow" | "Red";
  playerName: string;
  playerId: string;
  jerseyNumber?: number;
  timestamp?: string | Date;
  matchTime?: number;
}

export const LiveScoringBoard: React.FC<LiveScoringBoardProps> = ({
  match,
  homeTeamPlayers,
  awayTeamPlayers,
  authToken,
  onMatchUpdated
}) => {
  const [isLive, setIsLive] = useState(match.status === "Live");
  const [matchTime, setMatchTime] = useState(0); // Time in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [homeSelectedPlayer, setHomeSelectedPlayer] = useState("");
  const [awaySelectedPlayer, setAwaySelectedPlayer] = useState("");
  const [homeSelectedCardPlayer, setHomeSelectedCardPlayer] = useState("");
  const [awaySelectedCardPlayer, setAwaySelectedCardPlayer] = useState("");
  const [homeCardType, setHomeCardType] = useState<"Yellow" | "Red">("Yellow");
  const [awayCardType, setAwayCardType] = useState<"Yellow" | "Red">("Yellow");
  const [recordingGoal, setRecordingGoal] = useState<"home" | "away" | null>(null);
  const [recordingCard, setRecordingCard] = useState<"home" | "away" | null>(null);
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error" | "confirm";
      onConfirm?: () => void;
      isDangerous?: boolean;
    }>({ isOpen: false, title: "", message: "", type: "info" });
  const [goals, setGoals] = useState<Goal[]>(match.goals || []);
  const [cards, setCards] = useState<Card[]>(match.cards || []);
  const [homeGoalScorers, setHomeGoalScorers] = useState<GoalScorer[]>([]);
  const [awayGoalScorers, setAwayGoalScorers] = useState<GoalScorer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLive && isTimerRunning) {
      interval = setInterval(() => {
        setMatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, isTimerRunning]);

  useEffect(() => {
    calculateGoalScorers();
  }, [goals]); // Remove dependencies that cause unnecessary recalculations

  useEffect(() => {
    setGoals(match.goals || []);
    setCards(match.cards || []);
    setIsLive(match.status === "Live");

    // Calculate current time if match is live
    if (match.status === "Live") {
      if (match.timerLastStarted) {
        const start = new Date(match.timerLastStarted).getTime();
        const elapsed = Math.floor((new Date().getTime() - start) / 1000);
        setMatchTime((match.timerAccumulatedTime || 0) + elapsed);
        if (!isTimerRunning) setIsTimerRunning(true);
      } else {
        setMatchTime(match.timerAccumulatedTime || 0);
        if (isTimerRunning) setIsTimerRunning(false);
      }
    }
  }, [match]);

  const calculateGoalScorers = () => {
    const homeScorers: Record<string, number> = {};
    const awayScorers: Record<string, number> = {};

    goals.forEach(goal => {
      // Fix: Use playerName directly without jersey number if not available
      const playerKey = goal.jerseyNumber 
        ? `${goal.playerName} (#${goal.jerseyNumber})`
        : goal.playerName;
      
      if (goal.team === "home") {
        homeScorers[playerKey] = (homeScorers[playerKey] || 0) + 1;
      } else {
        awayScorers[playerKey] = (awayScorers[playerKey] || 0) + 1;
      }
    });

    setHomeGoalScorers(
      Object.entries(homeScorers)
        .map(([name, count]) => ({ name, goals: count }))
        .sort((a, b) => b.goals - a.goals)
    );
    setAwayGoalScorers(
      Object.entries(awayScorers)
        .map(([name, count]) => ({ name, goals: count }))
        .sort((a, b) => b.goals - a.goals)
    );
  };

  const handleStartLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/start-live`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to start live");
      }
      setIsLive(true);
      setMatchTime(0);
      setIsTimerRunning(true);
      setGoals([]);
      setCards([]);
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("Start live error:", err);
      setError(err.message);
      setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEndLive = () => {
    setModalConfig({
      isOpen: true,
      title: "End Match",
      message: "Are you sure you want to end the match? This will finalize the scores and cannot be undone.",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/end-live`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to end match");
          }
          setIsLive(false);
          setIsTimerRunning(false);
          onMatchUpdated(data.match);
        } catch (err: any) {
          console.error("End live error:", err);
          setError(err.message);
          setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRecordGoal = async (team: "home" | "away") => {
    const selectedPlayerId = team === "home" ? homeSelectedPlayer : awaySelectedPlayer;
    if (!selectedPlayerId) {
      setModalConfig({ isOpen: true, title: "Selection Required", message: "Please select a player to record a goal.", type: "warning" });
      return;
    }

    const player = team === "home"
      ? homeTeamPlayers.find(p => p._id === selectedPlayerId)
      : awayTeamPlayers.find(p => p._id === selectedPlayerId);

    if (!player) {
      setModalConfig({ isOpen: true, title: "Error", message: "Selected player could not be found in the roster.", type: "error" });
      return;
    }

    setRecordingGoal(team);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/record-goal`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${authToken}` 
        },
        body: JSON.stringify({
          playerId: player._id,
          playerName: player.name,
          jerseyNumber: player.jerseyNumber,
          team,
          timestamp: new Date().toISOString(),
          timerLastStarted: isTimerRunning ? new Date().toISOString() : null,
          timerAccumulatedTime: matchTime,
          matchTime: matchTime
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record goal");
      }
      
      // Ensure goals array exists and has timestamp
      const updatedGoals = (data.match.goals || []).map((goal: any) => ({
        ...goal,
        timestamp: goal.timestamp || new Date().toISOString()
      }));
      
      setGoals(updatedGoals);
      
      if (team === "home") {
        setHomeSelectedPlayer("");
      } else {
        setAwaySelectedPlayer("");
      }
      
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("Record goal error:", err);
      setError(err.message);
      setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
    } finally {
      setRecordingGoal(null);
    }
  };

  const handleRemoveGoal = (index: number) => {
    setModalConfig({
      isOpen: true,
      title: "Remove Goal",
      message: "Are you sure you want to remove this goal? The score will be adjusted accordingly.",
      type: "confirm",
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/goal/${index}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to remove goal");
          }
          setGoals(data.match.goals || []);
          onMatchUpdated(data.match);
        } catch (err: any) {
          console.error("Remove goal error:", err);
          setError(err.message);
          setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRecordCard = async (team: "home" | "away") => {
    const selectedPlayerId = team === "home" ? homeSelectedCardPlayer : awaySelectedCardPlayer;
    const cardType = team === "home" ? homeCardType : awayCardType;
    if (!selectedPlayerId) {
      setModalConfig({ isOpen: true, title: "Selection Required", message: "Please select a player to record a card.", type: "warning" });
      return;
    }

    const player = team === "home"
      ? homeTeamPlayers.find(p => p._id === selectedPlayerId)
      : awayTeamPlayers.find(p => p._id === selectedPlayerId);

    if (!player) {
      setModalConfig({ isOpen: true, title: "Error", message: "Selected player could not be found in the roster.", type: "error" });
      return;
    }

    setRecordingCard(team);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/record-card`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${authToken}` 
        },
        body: JSON.stringify({
          playerId: player._id,
          playerName: player.name,
          jerseyNumber: player.jerseyNumber,
          team,
          type: cardType,
          timestamp: new Date().toISOString(),
          timerLastStarted: isTimerRunning ? new Date().toISOString() : null,
          timerAccumulatedTime: matchTime,
          matchTime: matchTime
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record card");
      }
      
      onMatchUpdated(data.match);
      
      if (team === "home") setHomeSelectedCardPlayer("");
      else setAwaySelectedCardPlayer("");
    } catch (err: any) {
      console.error("Record card error:", err);
      setError(err.message);
      alert(err.message);
    } finally {
      setRecordingCard(null);
    }
  };

  const handleRemoveCard = async (index: number) => {
    if (!window.confirm("Remove this card?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/card/${index}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove card");
      }
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("Remove card error:", err);
      setError(err.message);
      setModalConfig({ isOpen: true, title: "Error", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTimer = async () => {
    const newIsRunning = !isTimerRunning;
    const lastStarted = newIsRunning ? new Date().toISOString() : null;
    const accumulated = matchTime;

    setIsTimerRunning(newIsRunning);
    await syncTimerToServer(lastStarted, accumulated);
  };

  const handleSetSecondHalf = async () => {
    const accumulated = 45 * 60;
    const lastStarted = new Date().toISOString();
    setMatchTime(accumulated);
    setIsTimerRunning(true);
    await syncTimerToServer(lastStarted, accumulated);
  };

  const syncTimerToServer = async (lastStarted: string | null, accumulated: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/sync-timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ timerLastStarted: lastStarted, timerAccumulatedTime: accumulated })
      });
      if (res.ok) {
        const data = await res.json();
        onMatchUpdated(data.match);
      }
    } catch (err) {
      console.error("Timer sync error:", err);
    }
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const homeScore = goals.filter(g => g.team === "home").length;
  const awayScore = goals.filter(g => g.team === "away").length;

  // Format timestamp safely
  const formatTime = (timestamp?: string | Date) => {
    if (!timestamp) return "Just now";
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (e) {
      return "Time unknown";
    }
  };

  return (
    <div className="space-y-5">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* LIVE STATUS HEADER */}
      <div className={`rounded-2xl border-2 p-6 ${isLive ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isLive && <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>}
            <h3 className={`font-bebas text-2xl tracking-wider uppercase ${isLive ? "text-red-700" : "text-slate-600"}`}>
              {isLive ? "🔴 LIVE SCORING" : "Match Scoring Board"}
            </h3>
          </div>
          <div className="flex gap-2">
            {!isLive ? (
              <button
                onClick={handleStartLive}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition disabled:opacity-60"
              >
                <Play className="h-4 w-4" /> Start Live
              </button>
            ) : (
              <button
                onClick={handleEndLive}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition disabled:opacity-60"
              >
                <Square className="h-4 w-4" /> End Match
              </button>
            )}
          </div>
        </div>

        {/* LIVE SCORE DISPLAY */}
        <div className="flex items-center justify-between gap-4 py-8 px-6 bg-white rounded-2xl border border-slate-200">
          <div className="text-center flex flex-col items-center gap-2 flex-1 min-w-0">
            <img 
              src={match.homeTeamLogo || "/placeholder-logo.png"} 
              alt={match.homeTeamName} 
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm bg-slate-50"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=80&q=80"; }}
            />
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">
              {match.homeTeamName || "Home Team"}
            </div>
            <div className="text-6xl font-black text-emerald-600">{homeScore}</div>
          </div>

          <div className="flex flex-col items-center justify-center px-4 min-w-[120px]">
            {isLive ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-3xl font-mono font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-100 shadow-inner select-none">
                  {formatDisplayTime(matchTime)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleTimer}
                    className={`p-2 rounded-xl transition shadow-sm border ${
                      isTimerRunning 
                        ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" 
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    }`}
                    title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
                  >
                    {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleSetSecondHalf}
                    className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition shadow-sm flex items-center gap-1"
                    title="Start 2nd Half (45:00)"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-[10px] font-bold">2H</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-4xl font-black text-slate-200 select-none uppercase tracking-widest">VS</div>
            )}
          </div>

          <div className="text-center flex flex-col items-center gap-2 flex-1 min-w-0">
            <img 
              src={match.awayTeamLogo || "/placeholder-logo.png"} 
              alt={match.awayTeamName} 
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm bg-slate-50"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=80&q=80"; }}
            />
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">
              {match.awayTeamName || "Away Team"}
            </div>
            <div className="text-6xl font-black text-blue-600">{awayScore}</div>
          </div>
        </div>
      </div>

      {isLive && (
        <>
          {/* Debug info - optional, remove in production */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
              Home Players: {homeTeamPlayers.length} | Away Players: {awayTeamPlayers.length}
            </div>
          )}

          {/* GOAL RECORDING SECTION */}
          <div className="grid grid-cols-2 gap-4">
            {/* HOME TEAM GOAL RECORDING */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <img 
                  src={match.homeTeamLogo || "/placeholder-logo.png"} 
                  alt="Home Logo" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                />
                <h4 className="font-bebas text-lg text-emerald-700 uppercase tracking-wider truncate">Record {match.homeTeamName || 'Home'} Goal</h4>
              </div>
              {homeTeamPlayers.length === 0 ? (
                <div className="w-full text-center py-3 text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No players available
                </div>
              ) : (
                <select
                  value={homeSelectedPlayer}
                  onChange={(e) => setHomeSelectedPlayer(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select Player</option>
                  {homeTeamPlayers.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (#{p.jerseyNumber || 'N/A'}) - {p.position || 'N/A'}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleRecordGoal("home")}
                disabled={!homeSelectedPlayer || recordingGoal === "home" || homeTeamPlayers.length === 0 || loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recordingGoal === "home" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {recordingGoal === "home" ? "Recording..." : "Record Goal"}
              </button>
            </div>

            {/* AWAY TEAM GOAL RECORDING */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <img 
                  src={match.awayTeamLogo || "/placeholder-logo.png"} 
                  alt="Away Logo" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                />
                <h4 className="font-bebas text-lg text-blue-700 uppercase tracking-wider truncate">Record {match.awayTeamName || 'Away'} Goal</h4>
              </div>
              {awayTeamPlayers.length === 0 ? (
                <div className="w-full text-center py-3 text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No players available
                </div>
              ) : (
                <select
                  value={awaySelectedPlayer}
                  onChange={(e) => setAwaySelectedPlayer(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Player</option>
                  {awayTeamPlayers.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (#{p.jerseyNumber || 'N/A'}) - {p.position || 'N/A'}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleRecordGoal("away")}
                disabled={!awaySelectedPlayer || recordingGoal === "away" || awayTeamPlayers.length === 0 || loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recordingGoal === "away" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {recordingGoal === "away" ? "Recording..." : "Record Goal"}
              </button>
            </div>
          </div>

          {/* DISCIPLINARY CARDS RECORDING SECTION */}
          <div className="grid grid-cols-2 gap-4">
            {/* HOME TEAM CARD RECORDING */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <img 
                  src={match.homeTeamLogo || "/placeholder-logo.png"} 
                  alt="Home Logo" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                />
                <h4 className="font-bebas text-lg text-emerald-700 uppercase tracking-wider truncate">Record {match.homeTeamName || 'Home'} Card</h4>
              </div>
              <div className="flex gap-2">
                <select
                  value={homeSelectedCardPlayer}
                  onChange={(e) => setHomeSelectedCardPlayer(e.target.value)}
                  className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select Player</option>
                  {homeTeamPlayers.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (#{p.jerseyNumber || 'N/A'})
                    </option>
                  ))}
                </select>
                <select
                  value={homeCardType}
                  onChange={(e) => setHomeCardType(e.target.value as any)}
                  className="w-24 text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Yellow">Yellow</option>
                  <option value="Red">Red</option>
                </select>
              </div>
              <button
                onClick={() => handleRecordCard("home")}
                disabled={!homeSelectedCardPlayer || recordingCard === "home" || homeTeamPlayers.length === 0 || loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recordingCard === "home" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className={`h-4 w-4 ${homeCardType === 'Yellow' ? 'text-yellow-400' : 'text-red-500'}`} />}
                {recordingCard === "home" ? "Recording..." : `Record ${homeCardType} Card`}
              </button>
            </div>

            {/* AWAY TEAM CARD RECORDING */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <img 
                  src={match.awayTeamLogo || "/placeholder-logo.png"} 
                  alt="Away Logo" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                />
                <h4 className="font-bebas text-lg text-blue-700 uppercase tracking-wider truncate">Record {match.awayTeamName || 'Away'} Card</h4>
              </div>
              <div className="flex gap-2">
                <select
                  value={awaySelectedCardPlayer}
                  onChange={(e) => setAwaySelectedCardPlayer(e.target.value)}
                  className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Player</option>
                  {awayTeamPlayers.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (#{p.jerseyNumber || 'N/A'})
                    </option>
                  ))}
                </select>
                <select
                  value={awayCardType}
                  onChange={(e) => setAwayCardType(e.target.value as any)}
                  className="w-24 text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Yellow">Yellow</option>
                  <option value="Red">Red</option>
                </select>
              </div>
              <button
                onClick={() => handleRecordCard("away")}
                disabled={!awaySelectedCardPlayer || recordingCard === "away" || awayTeamPlayers.length === 0 || loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recordingCard === "away" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className={`h-4 w-4 ${awayCardType === 'Yellow' ? 'text-yellow-400' : 'text-red-500'}`} />}
                {recordingCard === "away" ? "Recording..." : `Record ${awayCardType} Card`}
              </button>
            </div>
          </div>

          {goals.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-bebas text-lg text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Goals Timeline
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {goals.map((goal, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                      goal.team === "home"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Zap className={`h-4 w-4 ${goal.team === "home" ? "text-emerald-600" : "text-blue-600"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">
                          {goal.playerName} {goal.jerseyNumber && <span className="text-xs text-slate-500"># {goal.jerseyNumber}</span>}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatTime(goal.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove Goal"
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARDS TIMELINE */}
          {cards.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-bebas text-lg text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Disciplinary Timeline
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                      card.type === "Red" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-4 rounded-sm ${card.type === 'Yellow' ? 'bg-yellow-400' : 'bg-red-500'} shadow-sm`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">
                            {card.playerName} {card.jerseyNumber && <span className="text-xs text-slate-500"># {card.jerseyNumber}</span>}
                            {card.matchTime !== undefined && <span className="ml-1 text-red-600">({Math.floor(card.matchTime / 60)}')</span>}
                        </p>
                        <p className="text-[10px] text-slate-500">{formatTime(card.timestamp)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCard(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove Card"
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GOAL SCORERS STATISTICS */}
          <div className="grid grid-cols-2 gap-4">
            {/* HOME GOAL SCORERS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h4 className="font-bebas text-lg text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Home Scorers
              </h4>
              {homeGoalScorers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No goals yet</p>
              ) : (
                <div className="space-y-2">
                  {homeGoalScorers.map((scorer, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-lg">
                      <span className="text-xs font-bold text-slate-800">{scorer.name}</span>
                      <span className="text-sm font-black text-emerald-600">{scorer.goals}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AWAY GOAL SCORERS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h4 className="font-bebas text-lg text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Away Scorers
              </h4>
              {awayGoalScorers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No goals yet</p>
              ) : (
                <div className="space-y-2">
                  {awayGoalScorers.map((scorer, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-blue-50 p-2.5 rounded-lg">
                      <span className="text-xs font-bold text-slate-800">{scorer.name}</span>
                      <span className="text-sm font-black text-blue-600">{scorer.goals}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!isLive && goals.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-sm text-slate-600 font-semibold">
            Final Score: <span className="font-black text-lg text-slate-800">{homeScore} - {awayScore}</span>
          </p>
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