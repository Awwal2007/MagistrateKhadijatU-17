import React, { useState, useEffect } from "react";
import { Match, GroupStanding } from "../types.js";
import { Trophy, Calendar } from "lucide-react";

interface TournamentHubProps {
  authToken: string;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ authToken }) => {
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

  const renderGroupTable = (groupName: string, groupStandings: GroupStanding[]) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 mb-8">
      <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase mb-4 flex items-center gap-2">
        Group {groupName}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Club</th>
              <th className="py-3 px-2 text-center">P</th>
              <th className="py-3 px-2 text-center">W</th>
              <th className="py-3 px-2 text-center">D</th>
              <th className="py-3 px-2 text-center">L</th>
              <th className="py-3 px-2 text-center">GF</th>
              <th className="py-3 px-2 text-center">GA</th>
              <th className="py-3 px-2 text-center">GD</th>
              <th className="py-3 px-4 text-center text-[#0a3d0a] text-sm">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupStandings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">No teams assigned yet.</td>
              </tr>
            ) : groupStandings.map((team, idx) => (
              <tr key={team.teamId} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <img src={team.logoUrl} alt="logo" className="w-6 h-6 rounded-full border border-slate-200 bg-white object-cover" />
                  <span className="font-bold">{team.clubName}</span>
                </td>
                <td className="py-3 px-2 text-center">{team.played}</td>
                <td className="py-3 px-2 text-center">{team.won}</td>
                <td className="py-3 px-2 text-center">{team.drawn}</td>
                <td className="py-3 px-2 text-center">{team.lost}</td>
                <td className="py-3 px-2 text-center">{team.goalsFor}</td>
                <td className="py-3 px-2 text-center">{team.goalsAgainst}</td>
                <td className="py-3 px-2 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td className="py-3 px-4 text-center font-black text-sm text-[#0a3d0a]">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {loading ? (
        <div className="py-10 text-center text-slate-500 text-xs">Loading tournament data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-2">
              {renderGroupTable("A", standings.A)}
              {renderGroupTable("B", standings.B)}
              {renderGroupTable("C", standings.C)}
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                <h3 className="font-bebas text-xl text-[#0a3d0a] tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> All Fixtures
                </h3>
                {matches.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">No matches scheduled.</div>
                ) : (
                  <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                    {matches.map(match => (
                      <div key={match._id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white transition shadow-xs">
                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase mb-2">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{match.stage} {match.group ? `- Group ${match.group}` : ''}</span>
                          <span>{new Date(match.matchDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <img src={match.homeTeamLogo} alt="home" className="w-8 h-8 rounded-full border border-slate-200 bg-white object-cover" />
                            <span className="text-[10px] font-bold text-center leading-tight">{match.homeTeamName}</span>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center justify-center">
                            {match.status === "Completed" ? (
                              <div className="flex items-center gap-1 font-black text-lg text-[#0a3d0a]">
                                <span>{match.homeScore}</span>
                                <span className="text-gray-300">-</span>
                                <span>{match.awayScore}</span>
                              </div>
                            ) : (
                              <div className="bg-slate-200 text-slate-500 text-[10px] px-2 py-1 rounded font-bold">VS</div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-1 flex-1">
                            <img src={match.awayTeamLogo} alt="away" className="w-8 h-8 rounded-full border border-slate-200 bg-white object-cover" />
                            <span className="text-[10px] font-bold text-center leading-tight">{match.awayTeamName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
