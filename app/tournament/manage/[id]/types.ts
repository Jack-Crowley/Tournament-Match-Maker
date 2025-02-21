export interface DBTournament {
    id: number;
    created_at: Date | string;
    name: string;
    description?: string;
    owner?: string; // UUID
    organization?: string;
    team_tournament: boolean;
    require_account: boolean;
    custom_rules: any; // JSON
    status?: string;
    allow_join?: boolean;
    location?: string;
    start_time?: Date | string;
    end_time?: Date | string;
    join_code?: string;
    waitlist?: boolean;
    max_players?: number;
    skill_fields: string[];
    rules: string[];
}

export interface DBTournamentPlayer {
    id: number;
    last_update: Date | string;
    member_uuid?: string; // UUID
    tournament_id: number;
    tournament_director: boolean;
    player_name?: string;
    is_anonymous: boolean;
    skills: any; // JSON, e.g. { ELO: number }
}

export interface Bracket {
    tournament: DBTournament;
    players: DBTournamentPlayer[];
    matches: DBMatch[];
    seedPlayers(): void;
    generateBracket(): DBMatch[];
    enterResult(matchId: string, winnerId: number): void;
    nextRound(): DBMatch[];
    isEliminated(playerId: number): boolean;
    removePlayer(playerId: number): void;
    addPlayer(player: DBTournamentPlayer): void;
}

export interface DBMatch {
    id: string;
    round: number;
    player1?: DBTournamentPlayer;
    player2?: DBTournamentPlayer;
    winner?: DBTournamentPlayer;
    loser?: DBTournamentPlayer; // for debug or elimination checks
}

export class SingleEliminationBracket {
    tournament: DBTournament;
    players: DBTournamentPlayer[];
    matches: DBMatch[];

    constructor(tournament: DBTournament, players: DBTournamentPlayer[]) {
        this.tournament = tournament;
        this.players = players;
        this.matches = [];
    }

    // Sorts players by ELO rating (descending)
    seedPlayers() {
        this.players.sort((a, b) => {
            const eloA = a.skills?.ELO ?? 0;
            const eloB = b.skills?.ELO ?? 0;
            return eloB - eloA;
        });
    }

    // Creates the initial round of matches
    generateBracket() {
        // Usually called after seeding
        // Round 1
        let matchID = 0;
        for (let i = 0; i < this.players.length; i += 2) {
            matchID++;
            const match: DBMatch = {
                id: `match-${matchID}`,
                round: 1,
                player1: this.players[i],
                player2: this.players[i + 1],
            };
            this.matches.push(match);
        }
        return this.matches;
    }

    // Enters a result, sets winner & loser
    enterResult(matchId: string, winnerId: number) {
        const match = this.matches.find((m) => m.id === matchId);
        if (!match) {
            throw new Error("Match not found");
        }
        // If match is already resolved, skip
        if (match.winner) {
            return;
        }
        const isPlayer1Winner = match.player1?.id === winnerId;
        match.winner = isPlayer1Winner ? match.player1 : match.player2;
        match.loser = isPlayer1Winner ? match.player2 : match.player1;
    }

    // Creates a new round from winners in the highest existing round.
    // Returns newly created matches.
    nextRound(): DBMatch[] {
        if (this.matches.length === 0) {
            // No bracket yet
            return [];
        }
        // Find the highest existing round
        const maxRound = Math.max(...this.matches.map((m) => m.round));

        // Gather winners from that round
        const winners = this.matches
            .filter((m) => m.round === maxRound && m.winner)
            .map((m) => m.winner!);

        if (winners.length < 2) {
            // If fewer than 2 winners remain, no next round
            return [];
        }
        // New round number
        const newRound = maxRound + 1;
        const newMatches: DBMatch[] = [];

        let matchID = this.matches.length;
        // Pair up winners
        for (let i = 0; i < winners.length; i += 2) {
            matchID++;
            const player1 = winners[i];
            const player2 = i + 1 < winners.length ? winners[i + 1] : undefined;

            const match: DBMatch = {
                id: `match-${matchID}`,
                round: newRound,
                player1,
                player2,
            };
            newMatches.push(match);
            this.matches.push(match);
        }
        return newMatches;
    }

    // Check if a player is eliminated by seeing if there's a match
    // that concluded with them as loser.
    isEliminated(playerId: number): boolean {
        return this.matches.some((m) => m.loser && m.loser.id === playerId);
    }
}


export function generateRandomPlayers(
    count: number,
    tournamentId: number
): DBTournamentPlayer[] {
    // A small set of name fragments
    const nameFragments = [
        "Falcon", "Sparrow", "Raven", "Hawk", "Tiger",
        "Panther", "Orca", "Lynx", "Wolf", "Eagle",
        "Shark", "Cobra", "Mantis", "Puma", "Hyena",
    ];

    const players: DBTournamentPlayer[] = [];

    for (let i = 0; i < count; i++) {
        const fragment = nameFragments[Math.floor(Math.random() * nameFragments.length)];
        const randomName = `${fragment}${Math.floor(Math.random() * 1000)}`; // e.g. “Tiger237”
        const randomElo = Math.floor(Math.random() * 1601) + 800; // 800–2400

        players.push({
            id: i + 1, // or any unique identifier logic you prefer
            last_update: new Date().toISOString(),
            tournament_id: tournamentId,
            tournament_director: false,
            is_anonymous: true,
            skills: { ELO: randomElo },
            player_name: randomName,
            // no member_uuid
        });
    }

    return players;
}
