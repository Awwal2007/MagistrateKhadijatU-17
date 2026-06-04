export interface Team {
  id: string;
  clubName: string;
  email: string;
  logoUrl: string;
  createdAt?: string;
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
