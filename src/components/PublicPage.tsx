import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Calendar, Users, Shield, TrendingUp, Info } from "lucide-react";
import { TournamentHub } from "./TournamentHub";
import tournamentLogo from "../assets/logo.jpeg";

export const PublicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tournament" | "fixtures">("tournament");

  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] font-sans pb-20 animate-fade-in">
      
      {/* PROFESSIONAL NAVBAR */}
      <nav className="green-mesh border-b-4 border-[#FFD700] text-white py-4 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={tournamentLogo} alt="Magistrate Khadijat Oloyade Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-[#FFD700] bg-white object-cover shadow-sm" />
            <div className="block">
              <h1 className="font-bebas text-base sm:text-2xl tracking-wider text-[#FFD700] leading-none uppercase">
                Magistrate Khadijat Oloyade U-17 CUP
              </h1>
              <span className="text-[8px] sm:text-[10px] text-slate-300 font-mono tracking-widest leading-none uppercase block mt-0.5">Official Tournament Center</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              to="/login"
              className="text-[10px] font-black uppercase tracking-widest bg-[#FFD700] text-[#0a3d0a] px-4 py-2 rounded-xl border-2 border-white/20 transition-all hover:brightness-110 shadow-sm"
            >
              Club Entry
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="green-mesh py-6 sm:py-12 px-4 text-center border-b border-white/10 mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#155e15_0%,transparent_100%)] opacity-30" />
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
           <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-[#FFD700] text-[9px] font-black px-3 py-1 rounded-full border border-white/10 uppercase tracking-[0.3em] mb-1 animate-bounce-slow">
            <Shield className="h-3 w-3" /> Season 2026/2027
          </span>
          <h2 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide uppercase drop-shadow-2xl">Competition Hub</h2>
          <p className="text-[10px] sm:text-xs text-slate-200 uppercase tracking-[0.2em] max-w-2xl mx-auto font-bold opacity-80 leading-relaxed">
            Tracking the next generation of football excellence with live scoring, tactical insights, and real-time standings.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 space-y-6 sm:space-y-10">
        {/* PUBLIC TABS */}
        <div className="flex justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab("tournament")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-8 py-3 sm:py-4 rounded-[2rem] text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 border-2 ${
              activeTab === "tournament"
                ? "bg-[#0a3d0a] text-[#FFD700] border-[#0a3d0a] shadow-xl -translate-y-1"
                : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:text-emerald-700"
            }`}
          >
            <Trophy className={`h-3 w-3 sm:h-4 sm:w-4 ${activeTab === 'tournament' ? 'animate-pulse' : ''}`} />
            Standings
          </button>
          <button
            onClick={() => setActiveTab("fixtures")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-8 py-3 sm:py-4 rounded-[2rem] text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 border-2 ${
              activeTab === "fixtures"
                ? "bg-[#0a3d0a] text-[#FFD700] border-[#0a3d0a] shadow-xl -translate-y-1"
                : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:text-emerald-700"
            }`}
          >
            <Calendar className={`h-4 w-4 ${activeTab === 'fixtures' ? 'animate-pulse' : ''}`} />
            Match Schedule
          </button>
        </div>

        {/* MAIN TOURNAMENT ENGINE */}
        <div className="bg-white/40 backdrop-blur-xs rounded-[3rem] p-2">
          <TournamentHub authToken="" activeTab={activeTab} />
        </div>
      </div>

      {/* FOOTER ACCENT */}
      <footer className="mt-20 py-10 text-center border-t border-slate-200">
        <img src={tournamentLogo} className="h-8 w-8 mx-auto grayscale opacity-20 mb-4" alt="footer logo" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Magistrate Khadijat Oloyade U-17 Competition Registry</p>
      </footer>
    </div>
  );
};