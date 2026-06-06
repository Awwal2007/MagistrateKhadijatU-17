import React, { createContext, useContext, useState, useEffect } from "react";
import { Team, Player, Official } from "../types.js";

interface DraftPlayer {
  name: string;
  age: number;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  category: "Under-17" | "Free Age";
  photo: string; // Base64 or Object Url
}

interface DraftOfficial {
  name: string;
  position: "Head Coach" | "Assistant Coach" | "Team Doctor" | "Kit Manager" | "Manager";
  photo: string;
}

interface RegistrationContextProps {
  // Staging Draft State (New Registration)
  draftClubName: string;
  setDraftClubName: (name: string) => void;
  draftUsername: string;
  setDraftUsername: (username: string) => void;
  draftPassword: string;
  setDraftPassword: (pass: string) => void;
  draftLogo: string; // Base64
  setDraftLogo: (logo: string) => void;
  draftPlayers: DraftPlayer[];
  addDraftPlayer: (player: DraftPlayer) => boolean;
  removeDraftPlayer: (index: number) => void;
  draftOfficials: DraftOfficial[];
  addDraftOfficial: (official: DraftOfficial) => boolean;
  removeDraftOfficial: (index: number) => void;
  clearDrafts: () => void;

  // Authenticated State (Existing/Active Session)
  authToken: string | null;
  currentTeam: Team | null;
  rosterPlayers: Player[];
  rosterOfficials: Official[];
  isAdmin: boolean;
  loginTeam: (token: string, team: Team) => void;
  loginAdmin: (token: string) => void;
  logout: () => void;
  fetchRoster: () => Promise<void>;
  setRosterData: (players: Player[], officials: Official[]) => void;
}

const RegistrationContext = createContext<RegistrationContextProps | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Draft Stores
  const [draftClubName, setDraftClubName] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [draftPassword, setDraftPassword] = useState("");
  const [draftLogo, setDraftLogo] = useState("");
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [draftOfficials, setDraftOfficials] = useState<DraftOfficial[]>([]);

  // Auth Session Stores
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("mko_token"));
  const [currentTeam, setCurrentTeam] = useState<Team | null>(() => {
    const saved = localStorage.getItem("mko_team");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("mko_is_admin") === "true";
  });
  const [rosterPlayers, setRosterPlayers] = useState<Player[]>([]);
  const [rosterOfficials, setRosterOfficials] = useState<Official[]>([]);

  const addDraftPlayer = (player: DraftPlayer): boolean => {
    // Validation Quota limits on client side
    const u17Count = draftPlayers.filter(p => p.category === "Under-17").length;
    const freeAgeCount = draftPlayers.filter(p => p.category === "Free Age").length;

    if (draftPlayers.length >= 25) {
      alert("A club roster cannot exceed 25 players total.");
      return false;
    }
    if (player.category === "Under-17" && u17Count >= 20) {
      alert("Registration limit reached for Under-17 players (Max 20).");
      return false;
    }
    if (player.category === "Free Age" && freeAgeCount >= 6) {
      alert("Registration limit reached for Overage players (Max 6).");
      return false;
    }

    setDraftPlayers(prev => [...prev, player]);
    return true;
  };

  const removeDraftPlayer = (index: number) => {
    setDraftPlayers(prev => prev.filter((_, idx) => idx !== index));
  };

  const addDraftOfficial = (official: DraftOfficial): boolean => {
    if (draftOfficials.length >= 4) {
      alert("A club roster cannot exceed 4 officials total.");
      return false;
    }
    setDraftOfficials(prev => [...prev, official]);
    return true;
  };

  const removeDraftOfficial = (index: number) => {
    setDraftOfficials(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearDrafts = () => {
    setDraftClubName("");
    setDraftUsername("");
    setDraftPassword("");
    setDraftLogo("");
    setDraftPlayers([]);
    setDraftOfficials([]);
  };

  const loginTeam = (token: string, team: Team) => {
    localStorage.setItem("mko_token", token);
    localStorage.setItem("mko_team", JSON.stringify(team));
    localStorage.setItem("mko_is_admin", "false");
    setAuthToken(token);
    setCurrentTeam(team);
    setIsAdmin(false);
  };

  const loginAdmin = (token: string) => {
    localStorage.setItem("mko_token", token);
    localStorage.setItem("mko_is_admin", "true");
    setAuthToken(token);
    setIsAdmin(true);
    setCurrentTeam(null);
  };

  const logout = () => {
    localStorage.removeItem("mko_token");
    localStorage.removeItem("mko_team");
    localStorage.removeItem("mko_is_admin");
    setAuthToken(null);
    setCurrentTeam(null);
    setIsAdmin(false);
    setRosterPlayers([]);
    setRosterOfficials([]);
    clearDrafts();
  };

  const setRosterData = (players: Player[], officials: Official[]) => {
    setRosterPlayers(players);
    setRosterOfficials(officials);
  };

  const fetchRoster = async () => {
    if (!authToken || !currentTeam) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/teams/${currentTeam.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRosterPlayers(data.players || []);
        setRosterOfficials(data.officials || []);
      } else {
        console.error("Failed to load official roster details");
      }
    } catch (err) {
      console.error("Network error fetching team records:", err);
    }
  };

  return (
    <RegistrationContext.Provider
      value={{
        draftClubName,
        setDraftClubName,
        draftUsername,
        setDraftUsername,
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
        clearDrafts,
        authToken,
        currentTeam,
        rosterPlayers,
        rosterOfficials,
        isAdmin,
        loginTeam,
        loginAdmin,
        logout,
        fetchRoster,
        setRosterData
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error("useRegistration helper must be referenced inside a RegistrationProvider wrapper.");
  }
  return context;
};
