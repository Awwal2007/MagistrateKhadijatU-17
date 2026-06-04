import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, UserCheck, Shield, Upload, Trash2, ArrowRight, LogIn } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import { PlayerForm } from "../components/PlayerForm.js";
import { OfficialForm } from "../components/OfficialForm.js";

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    draftClubName,
    setDraftClubName,
    draftEmail,
    setDraftEmail,
    draftPassword,
    setDraftPassword,
    draftLogo,
    setDraftLogo,
    draftPlayers,
    addDraftPlayer,
    removeDraftPlayer,
    draftOfficials,
    addDraftOfficial,
    removeDraftOfficial,
    authToken
  } = useRegistration();

  // Modal Triggers
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quota tracking
  const currentU17 = draftPlayers.filter(p => p.category === "Under-17").length;
  const currentFreeAge = draftPlayers.filter(p => p.category === "Free Age").length;
  const totalPlayers = draftPlayers.length;
  const totalOfficials = draftOfficials.length;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file is too large. Max size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!draftClubName.trim()) {
      setValidationError("Club Name is a required field.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!draftEmail.trim()) {
      setValidationError("Club Email is a required field.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!draftPassword || draftPassword.length < 6) {
      setValidationError("Club Password must contain at least 6 characters.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!draftLogo) {
      setValidationError("Please upload your Club Logo to represent your registrations.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (draftPlayers.length === 0) {
      setValidationError("Please register at least one (1) player on your team roster to build submission.");
      return;
    }

    // Pass successfully to preview
    navigate("/preview");
  };

  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] pb-16 font-sans">
      
      {/* HERO REGISTRANT BANNER */}
      <div className="green-mesh border-b-4 border-[#FFD700] text-white py-12 px-4 shadow-md text-center relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-3">
          <span className="font-bebas text-xs sm:text-base tracking-widest text-[#FFD700] bg-white/10 px-3.5 py-1 rounded-full uppercase border border-white/5">
            Official Portal
          </span>
          <h1 className="font-bebas text-3xl sm:text-5xl md:text-6xl tracking-wide text-white uppercase drop-shadow-md leading-tight">
            Magistrate Khadijat Oloyade <br />
            <span className="text-[#FFD700]">Under 17 Football Competition</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-200 uppercase tracking-wider max-w-2xl mx-auto leading-relaxed">
            Register your sports club, details for your 25 athletes (supporting 21 Under-17 &amp; 4 Free Age limits), and manage up to 4 support officials.
          </p>
        </div>
      </div>

      {/* SUB-HEADER NAVIGATION BAR */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-[#0a3d0a]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0a3d0a]">Team Account Central</h2>
              <p className="text-[11px] text-gray-500 font-medium">Create a new tournament profile or login to access rosters.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="py-2 px-4 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-105 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Club Login
            </Link>
            <Link 
              to="/admin"
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-200"
            >
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* CORE FORM CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {validationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center gap-2.5 shadow-xs">
            <span className="bg-red-600 text-white rounded-full p-1 leading-none text-[9px] font-bold">⚠️</span>
            <div>
              <span className="font-bold block">Validation Error</span>
              {validationError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL: CLUB CONFIGURATION FORM */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 lg:col-span-1 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase">1. Club Details</h3>
              <p className="text-[11px] text-gray-400">Establish credential account parameters</p>
            </div>

            <div className="space-y-4">
              {/* Club Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Club / Academy Name *</label>
                <input 
                  type="text"
                  required
                  value={draftClubName}
                  onChange={(e) => setDraftClubName(e.target.value)}
                  placeholder="e.g. Lagos City FC"
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] bg-slate-50/50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Contact Email *</label>
                <input 
                  type="email"
                  required
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  placeholder="e.g. lagoscityfc@gmail.com"
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] bg-slate-50/50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Account Password (Min 6 Chars) *</label>
                <input 
                  type="password"
                  required
                  value={draftPassword}
                  onChange={(e) => setDraftPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] bg-slate-50/50"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Club Official Crest / Logo *</label>
                
                {draftLogo ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50/30 border border-emerald-600/30 rounded-2xl">
                    <img 
                      src={draftLogo} 
                      alt="Logo Draft" 
                      className="w-12 h-12 object-cover rounded-full border border-[#FFD700] bg-white flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-[#0a3d0a] block truncate">crest-custom.png</span>
                      <span className="text-[9px] text-gray-400 font-semibold block uppercase">Ready</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraftLogo("")}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#0a3d0a]/40 bg-slate-50/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center select-none">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Click to Select Crest</span>
                    <span className="text-[9px] text-gray-400">JPG, PNG, GIF up to 2MB allowed</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
              <h4 className="text-xs font-bold text-[#0a3d0a] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Shield className="h-4 w-4" /> Security Notice
              </h4>
              <p className="text-[10px] text-[#0a3d0a]/80 font-medium leading-relaxed">
                Registration details are processed securely. Logins can be reused to access/print cards anytime during the competition validation phase.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: ROSTERS DESIGN (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PLAYERS SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase mb-1">2. Team Players Roster</h3>
                  
                  {/* LIVE STATS COUNTER */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200">
                    <div>
                      Under-17: <span className={`text-[#0a3d0a] font-extrabold text-xs ${currentU17 >= 21 ? 'text-red-600':''}`}>{currentU17} / 21</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div>
                      Free Age: <span className={`text-[#0a3d0a] font-extrabold text-xs ${currentFreeAge >= 4 ? 'text-red-600':''}`}>{currentFreeAge} / 4</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div>
                      Total Athletes: <span className="text-[#0a3d0a] font-extrabold text-xs">{totalPlayers} / 25</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPlayerModal(true)}
                  className="w-full sm:w-auto py-2.5 px-5 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-105 text-xs font-extrabold rounded-xl shadow-xs transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  + Add Player
                </button>
              </div>

              {/* STAGED ATHLETE PREVIEWS LIST */}
              {draftPlayers.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <span className="text-3xl mb-1.5">🏃‍♂️</span>
                  <p className="text-xs font-semibold text-slate-700">No Players Drafted Yet</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-1">
                    Click the &quot;+ Add Player&quot; button to begin filling your team profile with legal Under-17 or Free Age competitors.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftPlayers.map((player, index) => (
                    <div 
                      key={index} 
                      className="border border-slate-250/70 rounded-2xl p-3 bg-white hover:shadow-xs transition flex gap-3 relative overflow-hidden group border-l-4 border-l-[#0a3d0a]"
                    >
                      {/* Jersey badge auto assigned index */}
                      <div className="absolute top-2 right-2 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] text-[#0a3d0a] font-extrabold font-mono hover:scale-105 transition">
                        #{index + 1}
                      </div>

                      <img 
                        src={player.photo} 
                        alt={player.name} 
                        className="w-14 h-14 object-cover rounded-lg border border-[#FFD700] bg-slate-50 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <span className="text-xs font-bold text-slate-800 block uppercase truncate leading-tight mb-1">{player.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-[#0a3d0a]">{player.position}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{player.age} Years</span>
                        </div>
                        <span className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none ${player.category === 'Under-17' ? 'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>
                          {player.category}
                        </span>
                      </div>

                      {/* Remove Draft Button */}
                      <button
                        type="button"
                        onClick={() => removeDraftPlayer(index)}
                        className="absolute bottom-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition"
                        title="Delete Player"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OFFICIALS SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="font-bebas text-2xl text-[#0a3d0a] tracking-wider uppercase mb-1">3. Officials &amp; Coaches Roster</h3>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-slate-100 py-1 px-2.5 rounded-lg inline-block border border-slate-200">
                    Officials Registered: <span className="text-[#0a3d0a] font-extrabold text-xs">{totalOfficials} / 4 Limit</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOfficialModal(true)}
                  className="w-full sm:w-auto py-2.5 px-5 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-105 text-xs font-extrabold rounded-xl shadow-xs transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  + Add Official
                </button>
              </div>

              {/* STAGED OFFICIALS PREVIEWS */}
              {draftOfficials.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <span className="text-3xl mb-1.5">👔</span>
                  <p className="text-xs font-semibold text-slate-700">No Officials Drafted</p>
                  <p className="text-[10px] text-gray-400 max-w-sm mt-1">
                    Register up to four (4) tactical/medical staff helpers such as Coach, Assistant Coach, Dr., or Kit Manager.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftOfficials.map((official, index) => (
                    <div 
                      key={index} 
                      className="border border-amber-200/60 rounded-2xl p-3 bg-amber-50/20 hover:shadow-xs transition flex gap-3 relative overflow-hidden border-l-4 border-l-amber-500"
                    >
                      <img 
                        src={official.photo} 
                        alt={official.name} 
                        className="w-14 h-14 object-cover rounded-lg border border-[#FFD700] bg-slate-50 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <span className="text-xs font-bold text-slate-800 block uppercase truncate leading-tight mb-1">{official.name}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/40 mt-1 inline-block">
                          {official.position}
                        </span>
                        <span className="block text-[8px] uppercase tracking-wide text-gray-400 font-extrabold mt-1">STAFF CREDENTIAL</span>
                      </div>

                      {/* Remove Draft button */}
                      <button
                        type="button"
                        onClick={() => removeDraftOfficial(index)}
                        className="absolute bottom-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition"
                        title="Delete Official"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PREVIEW SUBMISSION BLOCK */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePreviewSubmit}
                className="w-full bg-[#0a3d0a] text-[#FFD700] hover:brightness-110 py-4 px-6 text-base font-extrabold tracking-widest rounded-2xl shadow-md transition flex items-center justify-center gap-2 uppercase font-sans border-b-4 border-emerald-900"
              >
                Preview Submission Roster
                <ArrowRight className="h-5 w-5 shrink-0" />
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2.5 font-medium">
                You will review, customize layout configurations, and commit credentials on the next screen.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* FORM MODALS TRIGGERED */}
      {showPlayerModal && (
        <PlayerForm 
          currentU17Count={currentU17}
          currentFreeAgeCount={currentFreeAge}
          onAdd={(player) => {
            const added = addDraftPlayer(player);
            if (added) setShowPlayerModal(false);
          }}
          onClose={() => setShowPlayerModal(false)}
        />
      )}

      {showOfficialModal && (
        <OfficialForm 
          currentOfficialCount={totalOfficials}
          onAdd={(official) => {
            const added = addDraftOfficial(official);
            if (added) setShowOfficialModal(false);
          }}
          onClose={() => setShowOfficialModal(false)}
        />
      )}

    </div>
  );
};
