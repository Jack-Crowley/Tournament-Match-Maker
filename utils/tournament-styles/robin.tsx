import { Bracket, BracketPlayer, Round } from "@/types/bracketTypes";
import { Player } from "@/types/playerTypes";
import { RoundRobinRankedPlayer } from "@/types/rankedPlayerTypes";

export function RankRoundRobinPlayers(bracket:Bracket) {
    const playersMap : Map<string, RoundRobinRankedPlayer>= new Map();

    bracket.rounds.forEach((round) => {
        round.matches.forEach((match) => {
            match.players.forEach((player) => {
                if (!player) return;

                if (!playersMap.has(player.uuid)) {
                    playersMap.set(player.uuid, {
                        player : player, 
                        wins : [],
                        losses: [],
                        ties: [],
                        byes: 0
                    })
                }
                
                if (match.players.length == 1 && playersMap.get(player.uuid) != undefined) {
                    playersMap.get(player.uuid)!.byes++;
                }

                if (match.winner) {
                    if (match.winner == player.uuid) {
                        playersMap.get(player.uuid)?.wins.push(...match.players.filter(pl => pl.uuid != player.uuid))
                    }
                    else if (match.winner.startsWith("(tied)") && match.winner.includes(player.uuid)) {
                        playersMap.get(player.uuid)?.ties.push(...match.players.filter(pl => pl.uuid != player.uuid))
                    }
                    else {
                        playersMap.get(player.uuid)?.losses.push(...match.players.filter(pl => pl.uuid != player.uuid))
                    }
                }
            })
        })
    })

    const sortedList = Array.from(playersMap.values())
    
    sortedList.sort((a, b) => {
        if (b.wins.length !== a.wins.length) {
            return b.wins.length - a.wins.length;
        }
        if (a.losses.length !== b.losses.length) {
            return a.losses.length - b.losses.length;
        }
        return b.ties.length - a.ties.length;
    });

    return sortedList;
}