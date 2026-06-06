import React, { useState, useEffect } from "react";
import { Match, Player } from "../types.js";
import {
  Play, Square, Trash2, Plus, RefreshCw, TrendingUp, Zap, Trophy, Clock
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
}

export const LiveScoringBoard: React.FC<LiveScoringBoardProps> = ({
  match,
  homeTeamPlayers,
  awayTeamPlayers,
  authToken,
  onMatchUpdated
}) => {
  const [isLive, setIsLive] = useState(match.status === "Live");
  const [homeSelectedPlayer, setHomeSelectedPlayer] = useState("");
  const [awaySelectedPlayer, setAwaySelectedPlayer] = useState("");
  const [recordingGoal, setRecordingGoal] = useState<"home" | "away" | null>(null);
  const [goals, setGoals] = useState<Goal[]>(match.goals || []);
  const [homeGoalScorers, setHomeGoalScorers] = useState<GoalScorer[]>([]);
  const [awayGoalScorers, setAwayGoalScorers] = useState<GoalScorer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateGoalScorers();
  }, [goals]); // Remove dependencies that cause unnecessary recalculations

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to start live");
      }
      const data = await res.json();
      setIsLive(true);
      setGoals([]);
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("Start live error:", err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndLive = async () => {
    if (!window.confirm("End the match? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/end-live`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to end match");
      }
      const data = await res.json();
      setIsLive(false);
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("End live error:", err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordGoal = async (team: "home" | "away") => {
    const selectedPlayerId = team === "home" ? homeSelectedPlayer : awaySelectedPlayer;
    if (!selectedPlayerId) {
      alert("Please select a player");
      return;
    }

    const player = team === "home"
      ? homeTeamPlayers.find(p => p._id === selectedPlayerId)
      : awayTeamPlayers.find(p => p._id === selectedPlayerId);

    if (!player) {
      alert("Player not found");
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
          timestamp: new Date().toISOString() // Add timestamp client-side
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to record goal");
      }
      
      const data = await res.json();
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
      alert(err.message);
    } finally {
      setRecordingGoal(null);
    }
  };

  const handleRemoveGoal = async (index: number) => {
    if (!window.confirm("Remove this goal?")) return;
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${match._id}/goal/${index}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to remove goal");
      }
      
      const data = await res.json();
      setGoals(data.match.goals || []);
      onMatchUpdated(data.match);
    } catch (err: any) {
      console.error("Remove goal error:", err);
      setError(err.message);
      alert(err.message);
    }
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
        <div className="flex items-center justify-center gap-6 py-6 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-500 uppercase mb-2">Home</div>
            <div className="text-6xl font-black text-emerald-600">{homeScore}</div>
          </div>
          <div className="text-3xl font-black text-slate-300">:</div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-500 uppercase mb-2">Away</div>
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
              <h4 className="font-bebas text-lg text-emerald-700 uppercase tracking-wider">Record Home Goal</h4>
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
              <h4 className="font-bebas text-lg text-blue-700 uppercase tracking-wider">Record Away Goal</h4>
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
                      <Trash2 className="h-4 w-4" />
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
    </div>
  );
};