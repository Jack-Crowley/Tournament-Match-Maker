export interface BracketPlayer {
    uuid: string;
    name: string;
    player_name?: string;
    email: string;
    score?: number;
    skills?: PlayerSkill[];
    account_type:string
}
type PlayerSkill = [string, number]

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
