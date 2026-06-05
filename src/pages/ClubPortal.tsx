import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Printer, Users, UserCheck, ShieldAlert, BadgeCheck, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";
import { PlayerForm } from "../components/PlayerForm.js";
import { OfficialForm } from "../components/OfficialForm.js";
import tournamentLogo from "../assets/logo.jpeg";

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

  // Form modals state
  const [showPlayerModal, setShowPlayerModal] = useState<"Under-17" | "Free Age" | null>(null);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken || !currentTeam) {
      navigate("/login");
      return;
    }
    loadRoster();
  }, [authToken, currentTeam]);

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

      await loadRoster(); // refresh
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

      await loadRoster(); // refresh
      setShowOfficialModal(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const triggerPrintAll = () => {
    window.print();
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
              <span className="text-[9px] text-slate-300 font-mono tracking-widest leading-none">ROSTER CONTROL DESK</span>
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

      {/* CORE INTERACTION VIEW (HIDDEN DURING PRINT) */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6 no-print">
        
        {/* ACTION OR RETRIEVAL ALERTS */}
        {errorOnLoad && (
          <div className="p-4 bg-red-50 border border-red-205 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-650 shrink-0" />
            <span>{errorOnLoad}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-205 rounded-2xl text-xs text-red-700 flex items-start gap-2 animate-fade-in mb-4">
            <AlertCircle className="h-4 w-4 text-red-650 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Action Rejected</span>
              {actionError}
            </div>
          </div>
        )}

        {/* PROFILE ATTRIBUTION HUD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
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
              className="w-full sm:w-auto py-2.5 px-5 bg-emerald-700 hover:bg-[#0a3d0a] text-[#FFD700] hover:brightness-105 disabled:opacity-50 text-xs font-bold rounded-xl shadow-xs transition uppercase flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Roster Cards
            </button>
          </div>
        </div>

        {/* QUOTA COMPLIANCE DASHBOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/60 shadow-xs rounded-2xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-700">Under-17</span>
              <span className="text-xs text-slate-400 font-bold">/ 20 Limit</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(u17Count/20)*100}%` }} />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-700">Overage (Free Age)</span>
              <span className="text-xs text-slate-400 font-bold">/ 5 Limit</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(freeAgeCount/5)*100}%` }} />
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 shadow-xs rounded-2xl p-4 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Officials Registered</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-800">{totalOfficials}</span>
              <span className="text-xs text-slate-400 font-bold">/ 4 Allocation</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(totalOfficials/4)*100}%` }} />
            </div>
          </div>
        </div>

        {/* COMPETITOR MANAGEMENT ROW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">PLAYERS ID CREDENTIALS</h3>
              <p className="text-xs text-slate-400">Manage, preview, and output passport sports credentials</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {u17Count < 20 && (
                <button
                  onClick={() => setShowPlayerModal("Under-17")}
                  className="py-1.5 px-3.5 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] text-xs font-bold rounded-lg transition uppercase flex items-center gap-1 shadow-sm"
                >
                  + Add Under-17 Player
                </button>
              )}
              {freeAgeCount < 5 && (
                <button
                  onClick={() => setShowPlayerModal("Free Age")}
                  className="py-1.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition uppercase flex items-center gap-1 shadow-sm"
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
                {freeAgeCount < 5 && (
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
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              {rosterPlayers.map((player) => (
                <div key={player._id} className="relative group/card">
                  <div ref={(el) => { if (el) el.dataset.cardRef = "true"; }}>
                    <PrintCard 
                      person={player} 
                      type="player" 
                      team={currentTeam} 
                    />
                  </div>
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
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
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
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">SUPPORT OFFICIAL CREDENTIALS</h3>
              <p className="text-xs text-slate-400">Tac-medic officials, media, and manager card codes</p>
            </div>
            {totalOfficials < 4 && (
              <button
                onClick={() => setShowOfficialModal(true)}
                className="py-1.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition uppercase flex items-center gap-1 shadow-sm"
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
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
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
                      className="p-1 text-amber-700 hover:bg-amber-50 rounded"
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
