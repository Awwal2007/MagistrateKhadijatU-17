import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, ArrowLeft, AlertCircle, ShieldAlert } from "lucide-react";
import { useRegistration } from "../context/RegistrationContext.js";
import tournamentLogo from "../assets/logo.jpeg";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginTeam } = useRegistration();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Invalid username or password credentials.");
      }

      const data = await response.json();
      loginTeam(data.token, data.team);
      
      // Send them to the roster dashboard
      navigate("/portal");
    } catch (err: any) {
      console.error("Login fail:", err);
      setError(err.message || "A network failure occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fcf8] text-[#141414] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 green-mesh opacity-5 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* <Link 
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Registration
        </Link> */}
        <img src={tournamentLogo} alt="Magistrate Khadijat Oloyade U17 Logo" className="mx-auto h-20 w-20 object-contain rounded-full shadow-md border-2 border-[#0a3d0a] mb-3 bg-white" />
        {/* <span className="font-bebas text-[#0a3d0a] text-center block text-sm tracking-widest font-bold">OFFICIAL TOURNAMENT ENTRY</span> */}
        <h2 className="mt-2 text-center font-bebas text-3xl sm:text-4xl tracking-wider text-[#0a3d0a] uppercase">
          CLUB ACCESS TERMINAL
        </h2>
        <p className="mt-1 text-center text-2xl text-slate-400 font-medium">
          Magistrate Khadijat Oloyade U-17 Football Competition
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium flex items-start gap-2 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Registered Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. lagoscityfc"
                className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Club Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] bg-slate-50/50"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] tracking-wider hover:brightness-105 font-bold rounded-xl text-xs uppercase shadow transition"
              >
                {loading ? "Authenticating lens..." : "Sign In to Roster Control"}
              </button>
            </div>
          </form>

          {/* <div className="border-t border-slate-100 pt-4 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">New Academy or unregistered?</span>
            <Link 
              to="/"
              className="text-[11px] font-extrabold text-[#0a3d0a] hover:underline uppercase tracking-wide block mt-1"
            >
              Start New Registration Profile
            </Link>
          </div> */}

        </div>
      </div>
    </div>
  );
};
