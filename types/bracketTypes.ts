export interface Player {
    uuid: string;
    name: string;
    email: string;
}

export interface Matchup {
    matchId: number;
    player1: Player;
    player2: Player;
    scores: { [key: string]: number };
    winner: string;
}

export interface Round {
    matches: Matchup[];
}

export interface Bracket {
    rounds: Round[];
}
