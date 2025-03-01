"use client"

import { Bracket, Matchup, BracketPlayer } from "@/types/bracketTypes"
import { createClient } from "../supabase/client"
import { useMessage } from "@/context/messageContext"
import { Tournament } from "@/types/tournamentTypes";

export const addPlayerToMatchupFromWaitlist = async (
    tournament: Tournament,
    matchNumber: number,
    roundNumber: number,
    player: BracketPlayer,
    playerIndex: number
): Promise<{ success: boolean, errorCode: number | null }> => {
    console.log(player)

    const supabase = createClient();

    const { data: existingMatch, error: fetchError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournament.id)
        .eq("round", roundNumber)
        .eq("match_number", matchNumber)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching match:", fetchError);
        return { success: false, errorCode: 500 };
    }

    let players: BracketPlayer[] = existingMatch?.players || [];

    while (players.length < 2) {
        players.push({
            uuid: "",
            name: "",
            email: "",
            account_type: "placeholder",
        });
    }

    if (playerIndex >= players.length) {
        for (let i = players.length; i < playerIndex; i++) {
            players.push({
                uuid: "",
                name: "",
                email: "",
                account_type: "placeholder",
            });
        }
    }

    players[playerIndex] = {
        uuid: (player as any).member_uuid,
        name: player.player_name!,
        email: player.email || "",
        account_type: (player as any).type,
    };

    const { error: upsertError } = await supabase
        .from("tournament_matches")
        .upsert({
            tournament_id: tournament.id,
            round: roundNumber,
            match_number: matchNumber,
            players: players,
            id: existingMatch?.id || undefined,
        });

    if (upsertError) {
        console.error("Error upserting match:", upsertError);
        return { success: false, errorCode: 500 };
    }

    const { error: updateError } = await supabase
        .from("tournament_players")
        .update({ type: "active" })
        .match({ id: (player as any).id });


    console.log((player as any).id)
    console.log(upsertError)
    console.log(updateError)

    return { success: true, errorCode: null };
};

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
            ...match,
            players: players
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
            account_type: "placeholder"
        }

        let counter = 1

        while (matchesByRound[round].length < numMatches) {
            if (matchesByRound[round].some(match => match.match_number == counter)) {
                counter++
                continue;
            }

            const placeholderMatch: Matchup = {
                tournament_id: tournamentID,
                match_number: counter,
                id: -1,
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
        matches.sort((a, b) => a.match_number - b.match_number);
        bracket.rounds.push({
            matches: matches,
        });
    });

    return { bracket, errorCode: null };
};