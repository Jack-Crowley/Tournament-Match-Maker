import { Bracket, BracketPlayer, Round } from "@/types/bracketTypes";
import { Player } from "@/types/playerTypes";
import { RoundRobinRankedPlayer } from "@/types/rankedPlayerTypes";

export function RankRoundRobinPlayers(bracket: Bracket) {
    const playersMap: Map<string, RoundRobinRankedPlayer> = new Map();

    bracket.rounds.forEach((round) => {
        round.matches.forEach((match) => {
            match.players.forEach((player) => {
                if (!player) return;

                if (!playersMap.has(player.uuid)) {
                    playersMap.set(player.uuid, {
                        player: player,
                        wins: [],
                        losses: [],
                        ties: [],
                        byes: 0,
                    });
                }

                if (match.players.length == 1 && playersMap.get(player.uuid) != undefined) {
                    playersMap.get(player.uuid)!.byes++;
                }

                if (match.winner) {
                    if (match.winner === player.uuid) {
                        playersMap.get(player.uuid)?.wins.push(...match.players.filter(pl => pl.uuid !== player.uuid));
                    } else {
                        playersMap.get(player.uuid)?.losses.push(...match.players.filter(pl => pl.uuid !== player.uuid));
                    }
                }
                else if (match.is_tie) {
                    playersMap.get(player.uuid)?.ties.push(...match.players.filter(pl => pl.uuid !== player.uuid));

                }
            });
        });
    });

    const allPlayers = Array.from(playersMap.values());

    const scoreMap: Map<string, number> = new Map();
    allPlayers.forEach(p => {
        const score = p.wins.length * 3 + p.ties.length;
        scoreMap.set(p.player.uuid, score);
    });

    const strengthMap: Map<string, number> = new Map();
    allPlayers.forEach(p => {
        const strengthScore = p.wins.reduce((acc, opponent) => {
            const oppScore = scoreMap.get(opponent.uuid) ?? 0;
            return acc + oppScore;
        }, 0);
        strengthMap.set(p.player.uuid, strengthScore);
    });

    allPlayers.sort((a, b) => {
        const winsDiff = b.wins.length - a.wins.length;
        if (winsDiff !== 0) return winsDiff;

        const lossesDiff = a.losses.length - b.losses.length;
        if (lossesDiff !== 0) return lossesDiff;

        const tiesDiff = b.ties.length - a.ties.length;
        if (tiesDiff !== 0) return tiesDiff;

        // Tiebreaker: strength of opponents beaten
        const aStrength = strengthMap.get(a.player.uuid) ?? 0;
        const bStrength = strengthMap.get(b.player.uuid) ?? 0;
        return bStrength - aStrength;
    });

    return allPlayers;
}
