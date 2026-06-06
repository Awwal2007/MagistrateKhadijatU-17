import React, { useState, useEffect } from "react";
import { Match, GroupStanding } from "../types.js";
import { Trophy, Calendar, MapPin, Clock, Layers } from "lucide-react";

interface TournamentHubProps {
  authToken: string;
  activeTab: "tournament" | "fixtures";
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ authToken, activeTab }) => {
  const [standings, setStandings] = useState<{ A: GroupStanding[]; B: GroupStanding[]; C: GroupStanding[] }>({ A: [], B: [], C: [] });
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [authToken]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [standingsRes, matchesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/standings`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/matches`, { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (standingsRes.ok) {
        const sData = await standingsRes.json();
        setStandings(sData.standings || { A: [], B: [], C: [] });
      }

      if (matchesRes.ok) {
        const mData = await matchesRes.json();
        setMatches(mData.matches || []);
      }
    } catch (err) {
      console.error(err);
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
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Group and sort matches by Round
  const getGroupedMatches = () => {
    const sorted = [...matches].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    const grouped = sorted.reduce((acc, match) => {
      const roundName = match.round || "Match Fixtures";
      if (!acc[roundName]) acc[roundName] = [];
      acc[roundName].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    // Return rounds in the order they first appear chronologically
    const roundOrder = Array.from(new Set(sorted.map(m => m.round || "Match Fixtures")));
    return { grouped, roundOrder };
  };

  const renderGroupTable = (groupName: string, groupStandings: GroupStanding[]) => (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60 mb-6 sm:mb-8">
      <h3 className="font-bebas text-lg sm:text-xl text-[#0a3d0a] tracking-wider uppercase mb-3 sm:mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFD700]" />
        Group {groupName}
      </h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-[10px] sm:text-xs text-left min-w-[500px] sm:min-w-full">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4">Club</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">P</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">W</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">D</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">L</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GF</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GA</th>
              <th className="py-2 sm:py-3 px-1 sm:px-2 text-center">GD</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-[#0a3d0a] text-[11px] sm:text-sm">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupStandings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 sm:py-8 text-center text-slate-400 text-xs">No teams assigned yet.</td>
              </tr>
            ) : groupStandings.map((team, idx) => (
              <tr key={team.teamId} className="hover:bg-slate-50 transition">
                <td className="py-2 sm:py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-slate-400 text-[10px] sm:text-xs w-3 sm:w-4">{idx + 1}</span>
                    <img src={team.logoUrl} alt="logo" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-slate-200 bg-white object-cover flex-shrink-0" />
                    <span className="font-bold text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">{team.clubName}</span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.played}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.won}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.drawn}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.lost}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalsFor}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalsAgainst}</td>
                <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-black text-[11px] sm:text-sm text-[#0a3d0a]">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // If fixtures tab is active, prioritize showing fixtures prominently
  if (activeTab === "fixtures") {
    const { grouped, roundOrder } = getGroupedMatches();
    return (
      <div className="space-y-6 animate-fade-in">
        {loading ? (
          <div className="py-10 text-center text-slate-500 text-xs">Loading fixtures...</div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60">
            <h3 className="font-bebas text-xl sm:text-2xl text-[#0a3d0a] tracking-wider uppercase mb-4 sm:mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFD700]" />
              All Match Fixtures
            </h3>
            {matches.length === 0 ? (
              <div className="py-12 sm:py-16 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-slate-300" />
                <p>No matches scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {roundOrder.map(roundName => (
                  <div key={roundName} className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-[#FFD700] pl-3 py-1">
                      <Layers className="h-4 w-4 text-[#0a3d0a]" />
                      <h4 className="font-bebas text-lg text-[#0a3d0a] tracking-widest uppercase">{roundName}</h4>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {grouped[roundName].map(match => {
                        const { date, time } = formatMatchDateTime(match.matchDate);
                        return (
                          <div key={match._id} className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/50 hover:bg-white transition shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase mb-2 sm:mb-3">
                              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                {match.stage} {match.group ? `- Group ${match.group}` : ''}
                                {match.round && match.round !== roundName ? ` - ${match.round}` : ''}
                              </span>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>{date}</span>
                              </div>
                            </div>
                            
                            {/* Match Time Display */}
                            <div className="flex justify-center mb-3 sm:mb-4">
                              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>Kick-off: {time}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                              {/* Home Team */}
                              <div className="flex-1 text-center">
                                <div className="flex justify-center mb-1 sm:mb-2">
                                  <img 
                                    src={match.homeTeamLogo} 
                                    alt={match.homeTeamName} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 bg-white object-cover shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.homeTeamName || "")}&background=0a3d0a&color=fff&rounded=true&size=48`;
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700 line-clamp-2">{match.homeTeamName}</span>
                              </div>
                              
                              {/* Score / VS */}
                              <div className="flex-shrink-0 min-w-[60px] sm:min-w-[80px] text-center">
                                {match.status === "Completed" ? (
                                  <div className="flex items-center justify-center gap-1 sm:gap-2 font-black text-lg sm:text-2xl text-[#0a3d0a] bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                    <span>{match.homeScore}</span>
                                    <span className="text-gray-400 text-base sm:text-xl">-</span>
                                    <span>{match.awayScore}</span>
                                  </div>
                                ) : (
                                  <div className="bg-slate-200 text-slate-500 text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold inline-block">
                                    VS
                                  </div>
                                )}
                              </div>
      
                              {/* Away Team */}
                              <div className="flex-1 text-center">
                                <div className="flex justify-center mb-1 sm:mb-2">
                                  <img 
                                    src={match.awayTeamLogo} 
                                    alt={match.awayTeamName} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 bg-white object-cover shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.awayTeamName || "")}&background=0a3d0a&color=fff&rounded=true&size=48`;
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700 line-clamp-2">{match.awayTeamName}</span>
                              </div>
                            </div>
      
                            {/* Venue (if available) */}
                            {match.venue && (
                              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-slate-400">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span>{match.venue}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Show standings with fixtures on the side
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {loading ? (
        <div className="py-10 text-center text-slate-500 text-xs">Loading tournament data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {renderGroupTable("A", standings.A)}
            {renderGroupTable("B", standings.B)}
            {renderGroupTable("C", standings.C)}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60 sticky top-24">
              <h3 className="font-bebas text-lg sm:text-xl text-[#0a3d0a] tracking-wider uppercase mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" /> 
                Upcoming Fixtures
              </h3>
              {matches.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No matches scheduled.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                  {matches.slice(0, 10).map(match => {
                    const { date, time } = formatMatchDateTime(match.matchDate);
                    return (
                      <div key={match._id} className="border border-slate-200 rounded-xl p-2 sm:p-3 bg-slate-50/50 hover:bg-white transition shadow-sm">
                        <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase mb-2">
                          <span className="bg-slate-200 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px]">
                            {match.stage}
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{time}</span>
                          </div>
                        </div>
                        
                        {/* Date display */}
                        <div className="text-center mb-2">
                          <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium">{date}</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1">
                            <img 
                              src={match.homeTeamLogo} 
                              alt="home" 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.homeTeamName)}&background=0a3d0a&color=fff&rounded=true&size=32`;
                              }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-[60px] sm:max-w-[80px]">
                              {match.homeTeamName}
                            </span>
                          </div>
                          
                          <div className="flex-shrink-0 text-center">
                            {match.status === "Completed" ? (
                              <div className="flex items-center gap-0.5 sm:gap-1 font-black text-xs sm:text-sm text-[#0a3d0a]">
                                <span>{match.homeScore}</span>
                                <span className="text-gray-300 text-[10px] sm:text-xs">-</span>
                                <span>{match.awayScore}</span>
                              </div>
                            ) : (
                              <div className="bg-slate-200 text-slate-500 text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded font-bold">VS</div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1">
                            <img 
                              src={match.awayTeamLogo} 
                              alt="away" 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.awayTeamName)}&background=0a3d0a&color=fff&rounded=true&size=32`;
                              }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-[60px] sm:max-w-[80px]">
                              {match.awayTeamName}
                            </span>
                          </div>
                        </div>

                        {/* Venue for mobile */}
                        {match.venue && (
                          <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-center gap-1">
                            <MapPin className="h-2 w-2 text-slate-400" />
                            <span className="text-[7px] sm:text-[8px] text-slate-400 truncate">{match.venue}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {matches.length > 10 && (
                    <button 
                      onClick={() => {
                        const fixturesTab = document.querySelector('button[class*="FIXTURES"]');
                        if (fixturesTab) {
                          (fixturesTab as HTMLButtonElement).click();
                        }
                      }}
                      className="w-full text-center text-[10px] sm:text-xs text-emerald-600 font-bold py-2 hover:underline transition-colors"
                    >
                      View All Fixtures →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};