import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, Sparkles, LogOut, ExternalLink } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PrintCard } from "../components/PrintCard.js";

export const PreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    draftClubName,
    draftEmail,
    draftPassword,
    draftLogo,
    draftPlayers,
    draftOfficials,
    clearDrafts,
    loginTeam
  } = useRegistration();

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<any | null>(null);

  // If there's no dry draft data, push them back to registration page so they don't see blank screens
  if (!draftClubName && !isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-200 text-center shadow-md space-y-4">
          <span className="text-4xl">⚠️</span>
          <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">DRAFT ARCHIVE EMPTY</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There is no pending club roster data found to preview. Please return to the registration terminal.
          </p>
          <Link
            to="/"
            className="w-full inline-block py-2.5 bg-[#0a3d0a] text-[#FFD700] hover:brightness-105 font-bold rounded-xl text-xs uppercase"
          >
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionProgress("Provisioning tactical sports club account...");

    try {
      // 1. Register Team account first
      const registerRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: draftClubName,
          email: draftEmail,
          password: draftPassword,
          logo: draftLogo
        })
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json();
        throw new Error(errData.message || "Failed to create core club registration profile.");
      }

      const teamData = await registerRes.json();
      const { token, team } = teamData;
      const teamId = team.id;

      // Log in temporarily to run secure cascade uploads
      loginTeam(token, team);

      // 2. Cascade upload drafted players
      for (let i = 0; i < draftPlayers.length; i++) {
        const p = draftPlayers[i];
        setSubmissionProgress(`Registering player cards (${i + 1}/${draftPlayers.length}): ${p.name}...`);
        
        const playerRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${teamId}/players`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: p.name,
            age: p.age,
            position: p.position,
            photo: p.photo
          })
        });

        if (!playerRes.ok) {
          const pErr = await playerRes.json();
          throw new Error(`Player allocation failed at [${p.name}]: ${pErr.message || "Unknown schema refusal"}`);
        }
      }

      // 3. Cascade upload drafted officials
      for (let j = 0; j < draftOfficials.length; j++) {
        const o = draftOfficials[j];
        setSubmissionProgress(`Validating staff credentials (${j + 1}/${draftOfficials.length}): ${o.name}...`);

        const officialRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${teamId}/officials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: o.name,
            position: o.position,
            photo: o.photo
          })
        });

        if (!officialRes.ok) {
          const oErr = await officialRes.json();
          throw new Error(`Staff integration failed at official [${o.name}]: ${oErr.message || "Unknown schema refusal"}`);
        }
      }

      // Success achieved
      setSubmissionProgress("Finalizing roster verification indices...");
      setRegisteredTeam(team);
      setIsSuccess(true);
      clearDrafts(); // reset forms
    } catch (err: any) {
      console.error("Cascade Registration Error:", err);
      setSubmissionError(err.message || "A network transaction went out of sync during roster creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe helper to build temporary structures for PrintCard matching
  const buildTeamHelper = () => {
    return {
      id: "preview-raw",
      clubName: draftClubName,
      email: draftEmail,
      logoUrl: draftLogo || "/placeholder-logo.png"
    };
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(#155e15_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-15" />
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-8 max-w-lg w-full border border-emerald-600/30 text-center shadow-2xl relative z-10 space-y-6 animate-fade-in">
          
          <div className="relative inline-block mx-auto">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-16 h-16 bg-emerald-600 rounded-full border border-[#FFD700] flex items-center justify-center text-white">
              <CheckCircle className="h-9 w-9 text-[#FFD700]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-bebas text-4xl tracking-wider text-[#FFD700]">ROSTER COMMITTED SUCCESSFULLY</h2>
            <p className="text-sm text-emerald-100 font-semibold uppercase tracking-wider">{registeredTeam?.clubName}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your under-17 sports club registration and credentials have been processed. Individual credentials can now be downloaded or printed anytime.
            </p>
          </div>

          <div className="p-4 bg-emerald-950/45 border border-emerald-800/30 rounded-2xl flex items-center gap-3.5 text-left">
            <img 
              src={registeredTeam?.logoUrl} 
              alt="Club Logo" 
              className="w-12 h-12 rounded-full border border-[#FFD700] bg-white flex-shrink-0" 
            />
            <div>
              <p className="text-xs font-bold text-[#FFD700]">Welcome to MKO Cup</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                We have logged you in automatically. Read and print your tournament rosters via the User Panel.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate("/portal")}
              className="w-full py-3.5 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-110 font-bold tracking-widest text-sm rounded-xl transition shadow flex items-center justify-center gap-2 uppercase font-sans"
            >
              Enter Club Portal <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] pb-20 font-sans">
      
      {/* HEADER BANNER */}
      <div className="green-mesh border-b-4 border-[#FFD700] text-white py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <h1 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase">
            REGISTRATION PREVIEW TERMINAL
          </h1>
          <p className="text-[11px] text-gray-300 font-medium uppercase tracking-wider">
            Magistrate Khadijat Oloyade Under 17 Football Competition
          </p>
        </div>
      </div>

      {/* STICKY ACTIONS HEADER */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate("/")}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition disabled:opacity-55"
          >
            <ArrowLeft className="h-4 w-4" />
            Edit Registration Inputs
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider hidden md:inline">
              Roster: {draftPlayers.length} Players • {draftOfficials.length} Staff
            </span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="py-2.5 px-6 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-110 text-xs font-extrabold tracking-wider rounded-xl shadow transition uppercase flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
                  Submit Registration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CORE LAYOUT PREVIEWS */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* SUBMISSION STATE FEEDBACK (LOADING) */}
        {isSubmitting && (
          <div className="bg-[#0a3d0a] text-white p-5 rounded-3xl border border-[#FFD700] flex items-center gap-4 animate-pulse">
            <RefreshCw className="h-6 w-6 text-[#FFD700] animate-spin shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] text-[#FFD700] font-bold uppercase tracking-widest block">SYSTEM DISPATCH ROUTER STATUS</span>
              <p className="text-sm font-semibold">{submissionProgress}</p>
            </div>
          </div>
        )}

        {submissionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Failed Network Synchronizer</span>
              <p className="mt-1 leading-normal">{submissionError}</p>
              <button 
                onClick={handleSubmit}
                className="mt-3 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-[10px] uppercase transition"
              >
                Retry Dispatch
              </button>
            </div>
          </div>
        )}

        {/* TEAM ATTRIBUTION LOGO CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-md opacity-25" />
            <img 
              src={draftLogo} 
              alt="Crest Draft" 
              className="w-24 h-24 rounded-full border-4 border-[#0a3d0a] bg-white object-cover shadow-sm relative z-10" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80`;
              }}
            />
          </div>
          <div className="text-center md:text-left space-y-1">
            <span className="text-[10px] text-[#0a3d0a] font-bold uppercase tracking-wider bg-green-50 py-1 px-2.5 rounded-lg border border-[#0a3d0a]/20">
              PENDING REGISTRANT CLUB
            </span>
            <h2 className="font-bebas text-3xl text-slate-900 tracking-wide uppercase pt-1">{draftClubName || "UNNAMED CLUB"}</h2>
            <p className="text-xs text-slate-400 font-mono">Sign-in correspondence: {draftEmail}</p>
          </div>
        </div>

        {/* PLAYERS CARD LISTING IN SPORTS SHAPE  */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">Active Players Roster ({draftPlayers.length})</h3>
            <p className="text-xs text-slate-400 font-medium">Render preview layout of legal competition player cards</p>
          </div>

          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {draftPlayers.map((player, index) => {
              // Map to standard object format with jersey mapping
              const playerObj = {
                name: player.name,
                age: player.age,
                position: player.position,
                category: player.category,
                photoUrl: player.photo,
                jerseyNumber: index + 1
              };
              
              return (
                <div key={index} className="transition-all hover:scale-[1.02] hover:shadow-lg rounded-xl duration-200">
                  <PrintCard 
                    person={playerObj} 
                    type="player" 
                    team={buildTeamHelper()} 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* STAFF MEMBERS CARD LISTING */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase">Support Officials Roster ({draftOfficials.length})</h3>
            <p className="text-xs text-slate-400 font-medium font-sans">Tactical support, kits, and coaching crew identification badges</p>
          </div>

          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {draftOfficials.map((official, idx) => {
              const officialObj = {
                name: official.name,
                position: official.position,
                photoUrl: official.photo
              };

              return (
                <div key={idx} className="transition-all hover:scale-[1.02] hover:shadow-lg rounded-xl duration-200">
                  <PrintCard 
                    person={officialObj} 
                    type="official" 
                    team={buildTeamHelper()} 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* MANUAL FINAL ACTIONS CARDS */}
        <div className="border-t border-slate-200 pt-6 text-center">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full max-w-md mx-auto py-3 px-6 bg-[#0a3d0a] text-[#FFD700] hover:brightness-110 font-extrabold tracking-widest text-sm rounded-xl inline-flex items-center justify-center gap-2 shadow-md uppercase transition border-b-4 border-emerald-950"
          >
            {isSubmitting ? "Submitting Registration Records..." : "Verify & Finalize Submission"}
          </button>
        </div>

      </div>
    </div>
  );
};
