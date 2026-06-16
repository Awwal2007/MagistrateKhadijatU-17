import React, { useState, useEffect } from "react";
import { 
  Shield, Key, LogOut, RefreshCw, AlertCircle, 
  Calendar, Trophy, Zap, AlertTriangle, UserCheck, CheckCircle 
} from "lucide-react";
import { Match, Player } from "../types.js";
import { TournamentHub } from "../components/TournamentHub.js";
import tournamentLogo from "../assets/logo.jpeg";

export const RefereePage: React.FC = () => {
  const [refereeToken, setRefereeToken] = useState(localStorage.getItem("ref_token") || "");
  const [refereeName, setRefereeName] = useState(localStorage.getItem("ref_name") || "");
  
  // Login State
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<"assigned" | "tournament" | "fixtures">("assigned");
  const [loading, setLoading] = useState(false);

  // Card Action State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [rosters, setRosters] = useState<{ home: Player[], away: Player[] }>({ home: [], away: [] });
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (refereeToken) loadRefereeData();
  }, [refereeToken]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMatch?.status === "Live") {
      const accumulated = selectedMatch.timerAccumulatedTime || 0;
      const lastStartedTime = selectedMatch.timerLastStarted ? new Date(selectedMatch.timerLastStarted).getTime() : 0;
      const diff = (lastStartedTime > 0) ? Math.floor((Date.now() - lastStartedTime) / 1000) : 0;
      setCurrentMatchTime(Math.max(0, accumulated + diff));
    } else if (selectedMatch) {
      setCurrentMatchTime(selectedMatch.timerAccumulatedTime || 0);
    } else {
      setCurrentMatchTime(0);
    }
  }, [selectedMatch, now]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/referee-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeName: loginInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      localStorage.setItem("ref_token", data.token);
      localStorage.setItem("ref_name", data.referee.username);
      setRefereeToken(data.token);
      setRefereeName(data.referee.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ref_token");
    localStorage.removeItem("ref_name");
    setRefereeToken("");
    setRefereeName("");
  };

  const loadRefereeData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches`);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openMatchControl = async (match: Match) => {
    setSelectedMatch(match);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches/${match._id}/rosters`);
      const data = await res.json();
      setRosters({ home: data.homePlayers || [], away: data.awayPlayers || [] });
    } catch (e) { console.error(e); }
  };

  const issueCard = async (player: Player, team: 'home' | 'away', type: 'Yellow' | 'Red') => {
    if (!selectedMatch || recording) return;
    setRecording(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/matches/${selectedMatch._id}/record-card`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${refereeToken}` 
        },
        body: JSON.stringify({
          playerId: player._id,
          playerName: player.name,
          jerseyNumber: player.jerseyNumber,
          team,
          type,
          timestamp: new Date().toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedMatch(data.match);
        loadRefereeData();
      }
    } catch (err) { console.error(err); }
    finally { setRecording(false); }
  };

  if (!refereeToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#155e15_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <img src={tournamentLogo} className="h-16 w-16 mx-auto rounded-full border-2 border-[#FFD700] mb-4" />
            <h2 className="font-bebas text-5xl tracking-widest text-[#FFD700]">REFEREE PORTAL</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Official Competition Match Official Entry</p>
          </div>
          <div className="bg-slate-900 border border-emerald-800/40 p-8 rounded-3xl space-y-5">
            {error && <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl flex gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Official ID / Name</label>
                <input type="text" required value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-slate-950 border border-emerald-800/30 p-3 rounded-xl text-sm" placeholder="Ref Name" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Portal Access Code</label>
                <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-emerald-800/30 p-3 rounded-xl text-sm" placeholder="••••••••" />
              </div>
              <button disabled={isVerifying} className="w-full py-3 bg-[#0a3d0a] text-[#FFD700] font-bold uppercase text-xs rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition">
                {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const assignedMatches = matches.filter(m => m.refereeId === refereeName);

  return (
    <div className="min-h-screen bg-[#f0f4f0] pb-20">
      <nav className="green-mesh border-b-4 border-[#FFD700] py-3 px-4 sticky top-0 z-30 shadow-lg text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={tournamentLogo} className="h-9 w-9 rounded-full border border-[#FFD700]" />
            <h1 className="font-bebas text-lg tracking-wider text-[#FFD700] uppercase">Official Match Desk: {refereeName}</h1>
          </div>
          <button onClick={handleLogout} className="p-2 bg-red-600 rounded-lg text-white"><LogOut className="h-4 w-4" /></button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: "assigned", label: "My Assignments", icon: UserCheck },
            { id: "tournament", label: "Standings", icon: Trophy },
            { id: "fixtures", label: "All Fixtures", icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedMatch(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-[#0a3d0a] text-[#FFD700]" : "bg-white text-slate-500 border"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "assigned" && !selectedMatch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedMatches.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-[2rem] text-center border border-dashed border-slate-300">
                <Zap className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matches currently assigned to you</p>
              </div>
            ) : assignedMatches.map(match => (
              <div key={match._id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-[10px] font-black text-emerald-700 uppercase mb-1">{match.stage} • Assigned</div>
                  <p className="text-sm font-black text-slate-800 uppercase">{match.homeTeamName} vs {match.awayTeamName}</p>
                </div>
                <button 
                  onClick={() => openMatchControl(match)}
                  className="px-4 py-2 bg-[#0a3d0a] text-[#FFD700] rounded-xl text-[10px] font-black uppercase shadow-sm"
                >
                  Manage Cards
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedMatch && activeTab === "assigned" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
              <div className="green-mesh p-8 text-white flex items-center justify-between text-center">
                <div className="flex-1">
                  <img src={selectedMatch.homeTeamLogo} className="h-16 w-16 mx-auto rounded-full border-2 border-white mb-2" />
                  <p className="font-bebas text-xl">{selectedMatch.homeTeamName}</p>
                </div>
                <div className="px-6 text-4xl font-black">{selectedMatch.homeScore ?? 0} : {selectedMatch.awayScore ?? 0}</div>
                <div className="flex-1">
                  <img src={selectedMatch.awayTeamLogo} className="h-16 w-16 mx-auto rounded-full border-2 border-white mb-2" />
                  <p className="font-bebas text-xl">{selectedMatch.awayTeamName}</p>
                </div>
              </div>

              {selectedMatch.status === "Live" && (
                <div className="px-8 pb-4 flex justify-center">
                  <div className="bg-slate-900 text-[#FFD700] px-4 py-2 rounded-2xl font-mono text-xl border-2 border-emerald-800 shadow-inner flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>{Math.floor(currentMatchTime / 60)}:{String(currentMatchTime % 60).padStart(2, '0')}</span>
                  </div>
                </div>
              )}

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Home Team Card Control */}
                <div className="space-y-4">
                  <h3 className="font-bebas text-2xl text-slate-800 border-b pb-2 uppercase">{selectedMatch.homeTeamName} Roster</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {rosters.home.map(p => (
                      <div key={p._id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400">#{p.jerseyNumber}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => issueCard(p, 'home', 'Yellow')}
                            className="w-7 h-9 bg-yellow-400 rounded-sm border-2 border-white shadow-sm hover:scale-110 transition"
                          />
                          <button 
                            onClick={() => issueCard(p, 'home', 'Red')}
                            className="w-7 h-9 bg-red-500 rounded-sm border-2 border-white shadow-sm hover:scale-110 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Team Card Control */}
                <div className="space-y-4">
                  <h3 className="font-bebas text-2xl text-slate-800 border-b pb-2 uppercase">{selectedMatch.awayTeamName} Roster</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {rosters.away.map(p => (
                      <div key={p._id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400">#{p.jerseyNumber}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => issueCard(p, 'away', 'Yellow')}
                            className="w-7 h-9 bg-yellow-400 rounded-sm border-2 border-white shadow-sm hover:scale-110 transition"
                          />
                          <button 
                            onClick={() => issueCard(p, 'away', 'Red')}
                            className="w-7 h-9 bg-red-500 rounded-sm border-2 border-white shadow-sm hover:scale-110 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Match Card History */}
              <div className="bg-slate-50 border-t p-8">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Disciplinary Log (This Match)</h4>
                <div className="flex flex-wrap gap-3">
                  {(selectedMatch.cards || []).length === 0 && <p className="text-xs text-slate-300 italic">No cards issued yet</p>}
                  {selectedMatch.cards?.map((c, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 pr-4`}>
                      <div className={`w-3 h-5 rounded-xs ${c.type === 'Red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-700 truncate">{c.playerName}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">
                            {c.team} Team
                            {c.matchTime !== undefined && <span className="ml-1 text-emerald-600">({Math.floor(c.matchTime / 60)}')</span>}
                          </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedMatch(null)}
              className="w-full py-4 bg-slate-200 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition"
            >
              Return to Assignments
            </button>
          </div>
        )}

        {(activeTab === "tournament" || activeTab === "fixtures") && (
          <div className="bg-white/40 backdrop-blur-xs rounded-[3rem] p-2">
            <TournamentHub authToken={refereeToken} activeTab={activeTab === "tournament" ? "tournament" : "fixtures"} />
          </div>
        )}
      </div>
    </div>
  );
};