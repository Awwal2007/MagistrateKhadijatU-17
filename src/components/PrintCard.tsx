import React from "react";
import { Player, Official, Team } from "../types.js";
import tournamentLogo from "../assets/logo.jpeg";

interface PrintCardProps {
  person: Player | Official | any;
  type: "player" | "official";
  team: Team | null;
}

export const PrintCard: React.FC<PrintCardProps> = ({ person, type, team }) => {
  const isPlayer = type === "player";
  
  // Safe helper to extract photo url
  const getPhoto = () => {
    if (!person.photoUrl && !person.photo) {
      return "/placeholder-card.png";
    }
    return person.photoUrl || person.photo;
  };

  // Safe helper to obtain logo url
  const getLogo = () => {
    if (team?.logoUrl) return team.logoUrl;
    return "/placeholder-logo.png";
  };

  return (
    <div 
      className="print-card-container w-[85mm] h-[54mm] bg-white border-2 border-[#FFD700] rounded-xl flex flex-col justify-between overflow-hidden shadow-md text-slate-800 scale-95 sm:scale-100 origin-top-left flex-shrink-0"
      style={{
        width: "85mm",
        height: "54mm",
        boxSizing: "border-box",
        pageBreakInside: "avoid"
      }}
    >
      {/* CARD HEADER: Tournament Banner */}
      <div className="bg-[#0a3d0a] text-center py-1 px-2 border-b border-[#FFD700] flex items-center justify-center">
        <h3 className="font-bebas text-[9px] tracking-wider text-[#FFD700] leading-tight select-none uppercase truncate max-w-full">
          Magistrate Khadijat Oloyade U-17 Football Competition
        </h3>
      </div>

      {/* CARD BODY: Profile Details */}
      <div className="flex-1 p-2 bg-white relative isolate flex">
        {/* Repeating Watermark Background */}
        <div 
          className="absolute inset-0 opacity-[0.013] pointer-events-none -z-10 mix-blend-multiply" 
          style={{ 
            backgroundImage: `url(${tournamentLogo})`, 
            backgroundSize: "15mm 15mm", 
            backgroundRepeat: "repeat",
            backgroundPosition: "center"
          }}
        />

        <div className="w-full flex gap-2">
        {/* Profile Image (Passport-style on left) */}
        <div className="w-[30mm] h-[36mm] bg-slate-100 border border-[#FFD700] rounded overflow-hidden flex-shrink-0 relative">
          <img 
            src={getPhoto()} 
            alt={person.name} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=300&q=80`;
            }}
          />
          {/* Positional Tag at the bottom of standard photo */}
          {isPlayer && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#0a3d0a] text-[7px] text-white font-semibold text-center select-none py-0.5 uppercase tracking-wide">
              {person.position}
            </div>
          )}
        </div>

        {/* Profile Stats / Metadata on right */}
        <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
          <div>
            <h4 className="font-bold text-[13px] text-[#0a3d0a] truncate leading-tight uppercase font-sans">
              {person.name || "UNNAMED PLAYER"}
            </h4>
            
            <div className="flex justify-between items-center mt-1 border-b border-dashed border-slate-200 pb-1">
              <span className="text-[8px] uppercase tracking-wide text-gray-500 font-semibold">Cred Status:</span>
              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase leading-none ${isPlayer ? 'bg-green-100 text-[#0a3d0a]' : 'bg-amber-100 text-amber-800'}`}>
                {isPlayer ? "PLAYER" : "OFFICIAL"}
              </span>
            </div>

            {isPlayer ? (
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[8.5px]">
                <div>
                  <div className="text-[7.5px] text-gray-400 font-medium">AGE</div>
                  <div className="font-extrabold text-slate-800 text-[10px] leading-none mt-0.5">{person.age ?? "—"}<span className="text-[6.5px] font-semibold text-gray-400 ml-0.5">yrs</span></div>
                </div>
                <div>
                  <div className="text-[7.5px] text-gray-400 font-medium">Category</div>
                <div className={`font-bold uppercase leading-none mt-0.5 ${person.category === "Free Age" ? 'text-amber-700' : 'text-slate-800'}`}>{person.category === "Free Age" ? "Overage" : "Under-17"}</div>
                </div>
                <div>
                  <div className="text-[7.5px] text-gray-400 font-medium">POSITION</div>
                  <div className="font-extrabold text-[#0a3d0a] text-[9.5px] leading-none uppercase truncate">{person.position || "—"}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-[9px]">
                <div className="text-[7px] text-gray-400 font-medium uppercase tracking-wide">Role Assignment</div>
                <div className="font-semibold text-amber-700 bg-amber-50 border border-amber-200/50 rounded py-0.5 px-1 truncate mt-0.5">
                  {person.position || "Staff"}
                </div>
              </div>
            )}
          </div>

          {/* Badge indicator */}
          {!isPlayer && (
            <div className="mt-1 flex items-center justify-end">
              <div className="bg-red-600 text-white font-bebas text-[11px] px-2 py-0.5 rounded tracking-widest text-center shadow-sm select-none border border-red-500 leading-none">
                OFFICIAL
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* CARD FOOTER: Club name & logo */}
      <div className="bg-[#FFD700] px-2.5 py-1.5 border-t border-[#0a3d0a] flex items-center justify-between">
        <span className="font-bold text-[9px] text-[#0a3d0a] uppercase font-sans tracking-wide truncate max-w-[70%]">
          {team?.clubName || "MEMBER CLUB"}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <img 
            src={getLogo()} 
            alt="Club" 
            className="w-4 h-4 rounded-full border border-[#0a3d0a] object-cover" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80`;
            }}
          />
          <span className="text-[7px] text-[#0a3d0a] font-mono select-none font-bold">2026/27</span>
        </div>
      </div>
    </div>
  );
};
