export interface BracketPlayer {
    uuid: string;
    name: string;
    player_name?: string;
    email: string;
    score?: number;
    skills?: PlayerSkill[];
    account_type:string
}
export interface PlayerSkill {
    name: string;  // Name of the skill (e.g., "rating", "Metal")
    type: "numeric" | "categorical";  // Skill type
    value: number; // always stored as a number
    category_type?: string;   // example Bronze
}


export interface Matchup {
    id: number;
    tournament_id: number;
    match_number:number;
    winner?: string;
    players: BracketPlayer[];
    round:number;
}

export interface Round {
    matches: Matchup[];
}

export interface Bracket {
    rounds: Round[];
}
