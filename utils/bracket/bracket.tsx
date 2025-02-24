"use client"

import { Bracket, Matchup, BracketPlayer } from "@/types/bracketTypes"
import { createClient } from "../supabase/client"
import { useMessage } from "@/context/messageContext"

export const fetchBracket = async (tournamentID: number): Promise<{ bracket: Bracket | null, errorCode: number | null }> => {
    const supabase = createClient()

    const { data: matchesData, error: matchesError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentID);

    if (matchesError) {
        console.error("matches error!");
        return { bracket: null, errorCode: 500 };
    }

    const loggedInPlayerUUIDs = matchesData
        .flatMap(match => match.players)
        .filter(player => player.account_type === "logged_in")
        .map(player => player.uuid);

    const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("uuid, email")
        .in("uuid", loggedInPlayerUUIDs);

    if (usersError) {
        console.error("users error!");
        return { bracket: null, errorCode: 500 };
    }

    const userEmailMap = new Map<string, string>();
    usersData.forEach(user => {
        userEmailMap.set(user.uuid, user.email);
    });

    const bracket: Bracket = { rounds: [] };

    const matchesByRound: { [key: number]: Matchup[] } = {};

    matchesData.forEach(match => {
        const players = match.players.map((player: any) => {
            const playerData: BracketPlayer = {
                uuid: player.uuid,
                name: player.name,
                email: player.account_type === "logged_in" ? userEmailMap.get(player.uuid) || "" : "",
                score: player.score ? player.score : 0,
                account_type: player.account_type
            };
            return playerData;
        });

        const matchup: Matchup = {
            matchId: match.id,
            players: players,
            winner: match.winner,
            round: match.round,
        };

        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(matchup);
    });

    const firstRoundMatches = matchesByRound[1]?.length || 0;
    const totalRounds = Math.ceil(Math.log2(firstRoundMatches)) + 1;

    for (let round = 1; round <= totalRounds; round++) {
        if (!matchesByRound[round]) {
            matchesByRound[round] = [];
        }

        const numMatches = Math.pow(2, totalRounds - round);
        const tempPlayer = {
            uuid: "",
            name: "",
            email: "",
            account_type:"placeholder"
        }

        while (matchesByRound[round].length < numMatches) {
            const placeholderMatch: Matchup = {
                matchId: -1,
                players: [tempPlayer, tempPlayer],
                round: round,
            };
            matchesByRound[round].push(placeholderMatch);
        }
    }

    const sortedRounds = Object.keys(matchesByRound)
        .map(Number)
        .sort((a, b) => a - b);

    sortedRounds.forEach(round => {
        const matches = matchesByRound[round];
        matches.sort((a, b) => a.matchId - b.matchId);
        bracket.rounds.push({
            matches: matches,
        });
    });

    console.log("fetch bracket: ", bracket)

    return { bracket, errorCode: null };
};