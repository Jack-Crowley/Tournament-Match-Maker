export interface BracketPlayer {
    uuid: string;
    name: string;
    email: string;
    score?: number;
    account_type:string
}

export interface Matchup {
    matchId: number;
    matchNumber:number;
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
