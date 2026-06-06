export interface Team {
  id: string;
  clubName: string;
  username: string;
  logoUrl: string;
  createdAt?: string;
  group?: "A" | "B" | "C" | null;
}

export interface Player {
  _id: string;
  teamId: string;
  name: string;
  age: number;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  category: "Under-17" | "Free Age";
  photoUrl: string;
  jerseyNumber: number;
}

export interface Official {
  _id: string;
  teamId: string;
  name: string;
  position: "Head Coach" | "Assistant Coach" | "Team Doctor" | "Kit Manager" | "Manager";
  photoUrl: string;
}

export interface RegistrationState {
  team: Team | null;
  players: Omit<Player, "_id" | "teamId" | "jerseyNumber">[];
  officials: Omit<Official, "_id" | "teamId">[];
}

export interface Match {
  _id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  homeTeamLogo?: string;
  awayTeamName?: string;
  awayTeamLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "Scheduled" | "Live" | "Completed";
  stage: "Group Stage" | "Quarter Final" | "Semi Final" | "Final";
  round?: string;
  group: "A" | "B" | "C" | null;
  matchDate: string;
  goals?: Array<{
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    team: "home" | "away";
    timestamp: string;
  }>;
  cards?: Array<{
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    team: "home" | "away";
    type: "Yellow" | "Red";
    timestamp: string;
  }>;
}

export interface GroupStanding {
  teamId: string;
  clubName: string;
  logoUrl: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
