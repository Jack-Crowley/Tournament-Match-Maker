export interface Player {
    uuid: string;
    name: string;
    email: string;
    score?: number;
    account_type:string
}

export interface Matchup {
    matchId: number;
    winner?: string;
    players: Player[];
    round:number;
}

export interface Round {
    matches: Matchup[];
}

export interface Bracket {
    rounds: Round[];
}
