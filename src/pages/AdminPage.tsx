import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Key, AlertCircle, RefreshCw, Trash2, Printer, Search, ArrowLeft, Users, UserCheck, LogOut, ChevronRight, Download } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";
import { Team, Player, Official } from "../types.js";

interface FullTeamRoster {
  id: string;
  clubName: string;
  email: string;
  logoUrl: string;
  createdAt: string;
  players: Player[];
  officials: Official[];
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { authToken, isAdmin, loginAdmin, logout } = useRegistration();

  // Password Verification State
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Dashboard State
  const [fullTeamsList, setFullTeamsList] = useState<FullTeamRoster[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<FullTeamRoster | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [errorOnRecords, setErrorOnRecords] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && authToken) {
      loadAdminRecords();
    }
  }, [isAdmin, authToken]);

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Invalid administrative entry code key.");
      }

      const data = await response.json();
      loginAdmin(data.token);
      setPasswordInput("");
    } catch (err: any) {
      console.error("Admin Verification Failed:", err);
      setLoginError(err.message || "A verification timeout occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadAdminRecords = async () => {
    setLoadingRecords(true);
    setErrorOnRecords(null);
    try {
      const response = await fetch("/api/admin/teams", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to authenticate permission level to retrieve rosters.");
      }

      const data = await response.json();
      const teams = data.teams || [];
      setFullTeamsList(teams);
      if (teams.length > 0) {
        // Safe check for re-setting selected team if it existed previously
        setSelectedTeam(prev => {
          if (prev) {
            const fresh = teams.find((t: any) => t.id === prev.id);
            return fresh || teams[0];
          }
          return teams[0];
        });
      } else {
        setSelectedTeam(null);
      }
    } catch (err: any) {
      console.error("Fetch Admin Records Error:", err);
      setErrorOnRecords(err.message || "Failure synchronizing ledger rosters.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this player card? This action is irreversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/players/${playerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Delete rejected on backend security node.");
      }

      // reload data
      await loadAdminRecords();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!window.confirm("WARNING: Deleting this Club/Team will instantly wipe their core login files, plus CASCADE DELETE all of their player cards and officials roster. Are you absolutely certain?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Action rejected.");
      }

      // reload
      await loadAdminRecords();
    } catch (err: any) {
      alert("Error Deleting Team Profile: " + err.message);
    }
  };

  const handleAdminLogout = () => {
    logout();
    setFullTeamsList([]);
    setSelectedTeam(null);
  };

  // Filtered list of soccer clubs
  const filteredTeams = fullTeamsList.filter(t => 
    t.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // AUTH PROMPT VIEW (IF NOT ADMIN LOGGED IN)
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#155e15_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-[#FFD700] hover:underline bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Public Registration Portal
          </Link>
          <div className="text-center">
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-widest text-[#FFD700]">ADMINISTRATOR VERIFICATION</h2>
            <p className="mt-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">MKO Under-17 Cup Control Center</p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-800/45 py-8 px-6 shadow-2xl rounded-3xl space-y-6">
            
            {loginError && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/40 p-3.5 rounded-xl text-xs text-red-400 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Enter Master Administration Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Master Access Password"
                    className="w-full text-xs py-2.5 pl-9 pr-3.5 border border-emerald-800/30 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] bg-slate-950 text-white placeholder-slate-600 font-sans"
                  />
                </div>
                <span className="text-[9px] text-[#FFD700]/70 font-semibold block mt-1.5 italic">
                  Note: Default development sandbox password key is &quot;admin123&quot;.
                </span>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] font-bold text-xs uppercase rounded-xl tracking-widest shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Checking access token...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Verify Master Access
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MASTER ADMINISTRATIVE WORKSPACE (VERIFIED)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] pb-20 font-sans">
      
      {/* NO-PRINT DASHBOARD NAVBAR */}
      <nav className="green-mesh border-b-4 border-[#FFD700] text-white py-4 px-4 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/10 rounded-xl text-[#FFD700] border border-white/5">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-bebas text-lg tracking-wider text-[#FFD700] leading-none uppercase">
                MKO Cup Director Desk
              </h1>
              <span className="text-[9px] text-[#FFD700] font-mono tracking-widest block uppercase font-bold leading-none mt-0.5">
                MASTER LEDGER WORKSPACE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={loadAdminRecords}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-[10px] text-slate-200 uppercase font-semibold transition"
            >
              Sync Records
            </button>
            <button
              onClick={handleAdminLogout}
              className="py-1.5 px-3 bg-red-600/90 hover:bg-red-700 border border-red-500 rounded-lg text-[10px] text-white uppercase font-bold transition flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* CORE ADMINISTRATIVE WORKSPACE GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-8 no-print">
        {errorOnRecords && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorOnRecords}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR: TEAM ORGANIZER LEDGER (1/4 Width) */}
          <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">Sports Academies</h3>
              <p className="text-[10px] text-gray-400">Ledger index: {fullTeamsList.length} total profiles</p>
            </div>

            {/* SEARCH BOX */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs py-2 px-3 pl-8 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] bg-slate-50/50"
              />
            </div>

            {/* TEAMS/ACADEMIES VERTICAL LIST */}
            {loadingRecords ? (
              <div className="py-10 text-center flex flex-col items-center gap-1">
                <RefreshCw className="h-5 w-5 text-[#0a3d0a] animate-spin" />
                <span className="text-[10px] text-gray-400">Fetching rosters...</span>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <span>No teams found</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredTeams.map((team) => {
                  const isActive = selectedTeam?.id === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isActive 
                          ? 'bg-green-50/50 border-[#0a3d0a] ring-1 ring-[#0a3d0a]' 
                          : 'bg-white border-slate-205 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={team.logoUrl} 
                          alt="Crest" 
                          className="w-8 h-8 rounded-full border border-slate-200 bg-white object-cover flex-shrink-0" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80`;
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate uppercase">{team.clubName}</span>
                          <span className="text-[9px] text-gray-400 font-mono block">Roster Size: {team.players.length}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-350 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN RETAIL WORKSPACE: CURRENT SELECTED TEAM ROSTERS (3/4 Width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {!selectedTeam ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-gray-400">
                <span className="text-5xl">📋</span>
                <h4 className="font-bebas text-2xl text-slate-600 tracking-wider uppercase mt-3">Select Academy Profile</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                  Choose a football club or soccer academy from the ledger list sidebar to view, manage, delete cards, or output printed credentials.
                </p>
              </div>
            ) : (
              <>
                {/* ACTIVE ACADEMY CARD HUD */}
                <div className="bg-white border border-slate-200/60 shadow-xs rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <img 
                      src={selectedTeam.logoUrl} 
                      alt="Active Crest" 
                      className="w-16 h-16 rounded-full border border-[#FFD700] object-cover flex-shrink-0 bg-white" 
                    />
                    <div>
                      <h2 className="font-bebas text-2xl text-slate-900 tracking-wide uppercase leading-tight">
                        {selectedTeam.clubName}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium">Correspondent: <span className="font-mono">{selectedTeam.email}</span></p>
                      <div className="flex gap-2 text-[9px] uppercase tracking-wider font-extrabold text-gray-500 mt-1">
                        <span>Players: {selectedTeam.players.length}</span>
                        <span>•</span>
                        <span>Officials: {selectedTeam.officials.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => window.print()}
                      disabled={selectedTeam.players.length === 0 && selectedTeam.officials.length === 0}
                      className="flex-1 sm:flex-none py-2 px-4 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-105 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Printer className="h-4 w-4" />
                      Print Team Grid
                    </button>
                    <button
                      onClick={() => handleRemoveTeam(selectedTeam.id)}
                      className="flex-1 sm:flex-none py-2 px-4 bg-red-50 text-red-700 hover:bg-red-100/70 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Club
                    </button>
                  </div>
                </div>

                {/* PLAYERS CARD LIST WITH DELETE TRIGGERS */}
                <div className="space-y-4">
                  <div className="border-b border-slate-205 pb-2">
                    <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">Active Athletes Roster ({selectedTeam.players.length})</h3>
                    <p className="text-xs text-slate-400 font-medium font-sans">Preview legal photo cards. Individual delete controls wipe items from server database.</p>
                  </div>

                  {selectedTeam.players.length === 0 ? (
                    <div className="bg-white py-10 rounded-2xl text-center text-slate-400 text-xs border border-slate-100">
                      <span>No player cards verified in this club roster.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                      {selectedTeam.players.map((player) => (
                        <div key={player._id} className="relative group/card">
                          <PrintCard 
                            person={player} 
                            type="player" 
                            team={selectedTeam as unknown as Team} 
                          />
                          {/* Admin controls panel overlay */}
                          <div className="absolute top-2 right-2 flex gap-1 bg-white/95 rounded-md p-1 shadow border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => {
                                const styleNode = document.createElement("style");
                                styleNode.innerHTML = `
                                  @media print {
                                    body * { display: none !important; }
                                    #print-single-box, #print-single-box * { display: flex !important; }
                                    #print-single-box { position: absolute !important; top: 0 !important; left: 0 !important; }
                                  }
                                `;
                                const container = document.createElement("div");
                                container.id = "print-single-box";
                                container.className = "fixed inset-0 bg-white flex items-center justify-center pointer-events-none z-50 py-10";
                                document.body.appendChild(container);
                                document.head.appendChild(styleNode);
                                
                                window.print();
                                
                                setTimeout(() => {
                                  document.body.removeChild(container);
                                  document.head.removeChild(styleNode);
                                }, 500);
                              }}
                              className="p-1 text-[#0a3d0a] hover:bg-green-50 rounded"
                              title="Print Card"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemovePlayer(player._id)}
                              className="p-1 text-red-650 hover:bg-red-50 rounded"
                              title="Delete Player Card"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-650" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OFFICIALS BADGES LIST WITH CONTROLS */}
                <div className="space-y-4">
                  <div className="border-b border-slate-205 pb-2">
                    <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">Coaches &amp; Technical Crew Badges ({selectedTeam.officials.length})</h3>
                    <p className="text-xs text-slate-400">Officials badges mapped to credit card layout bounds.</p>
                  </div>

                  {selectedTeam.officials.length === 0 ? (
                    <div className="bg-white py-10 rounded-2xl text-center text-slate-400 text-xs border border-slate-100">
                      <span>No technical crew badges verified in this team.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                      {selectedTeam.officials.map((official) => (
                        <div key={official._id} className="relative group/card">
                          <PrintCard 
                            person={official} 
                            type="official" 
                            team={selectedTeam as unknown as Team} 
                          />
                          <div className="absolute top-2 right-2 flex gap-1 bg-white/95 rounded-md p-1 shadow border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => {
                                const styleNode = document.createElement("style");
                                styleNode.innerHTML = `
                                  @media print {
                                    body * { display: none !important; }
                                    #print-single-box, #print-single-box * { display: flex !important; }
                                    #print-single-box { position: absolute !important; top: 0 !important; left: 0 !important; }
                                  }
                                `;
                                const container = document.createElement("div");
                                container.id = "print-single-box";
                                container.className = "fixed inset-0 bg-white flex items-center justify-center pointer-events-none z-50 py-10";
                                document.body.appendChild(container);
                                document.head.appendChild(styleNode);
                                
                                window.print();
                                
                                setTimeout(() => {
                                  document.body.removeChild(container);
                                  document.head.removeChild(styleNode);
                                }, 500);
                              }}
                              className="p-1 text-emerald-700 hover:bg-green-50 rounded"
                              title="Print Official"
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
            )}
          </div>

        </div>
      </div>

      {/* CORE HIDDEN PRINT CONTAINER (EMULATED AND RENDERED GRID ON A4 UNDER PRINT STATE) */}
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

    </div>
  );
};
