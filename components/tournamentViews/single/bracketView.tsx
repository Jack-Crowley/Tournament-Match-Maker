"use client"

import { useEffect, useState } from "react";
import { Bracket, BracketPlayer } from "@/types/bracketTypes";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons/faUserPlus";

import { Tournament } from "@/types/tournamentTypes";
import { User } from "@/types/userType";

export const AddPlayerButton = ({ onAddPlayer }: { onAddPlayer: () => void }) => {
    return (
        <motion.div
            className="bg-[#947ed7] hover:bg-[#af9ce7] transition-colors duration-200"
            onClick={onAddPlayer}
            style={{
                padding: '10px 20px',
                color: 'white',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
            }}
            whileHover={{ scale: 1.05 }}
        >
            <FontAwesomeIcon icon={faUserPlus} />
            Add Player
        </motion.div>
    );
};



import { createClient } from "@/utils/supabase/client";
import BracketCreator from "./bracketCreator";

// Represents a player being moved, including their original matchup details
export interface MovingPlayer {
    player: BracketPlayer;
    fromRound: number;
    fromMatch: number;
    fromIndex: number;
}

export type OnMovePlayer = (player: MovingPlayer | null) => void;


export enum BracketViewType {
    Normal = "normal",
    AddPlayer = "add-player",
    MovePlayer = "move-player",
}

const TournamentBracket = ({
    bracket,
    newPlayer = null,
    tournamentID = null,
    onClose = null,
    user,
    bracketViewType = BracketViewType.Normal,
    
}: {
    bracket: Bracket;
    newPlayer?: BracketPlayer | null;
    tournamentID?: number | null;
    onClose?: (() => void) | null;
    user: User;
    bracketViewType: BracketViewType;

}) => {

    const [viewType, setViewType] = useState<BracketViewType>(bracketViewType);

    const [movingPlayer, setMovingPlayer] = useState<MovingPlayer | null>(null);

    const handleMovePlayer: OnMovePlayer = (player) => {
        console.log("TOURNAMENT BRACKET: MOVING PLAYER", player);
        if (player === null) {
            setMovingPlayer(null);
            setViewType(BracketViewType.Normal);
        } else {
            setMovingPlayer(player);
            setViewType(BracketViewType.MovePlayer);
        }
    };

    const [tournament, setTournament] = useState<Tournament | null>(null);

    useEffect(() => {
        const getTournament = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from("tournaments").select("*").eq("id", tournamentID).single();

            if (error) {
                console.error("Error fetching tournament data");
                return;
            }

            // console.log("TOURNAMENT BRACKET: TOURNAMENT DATA", data);

            setTournament(data); // ✅ Store the tournament in state
        };

        getTournament();
    }, [tournamentID]); // Runs when `tournamentID` changes


    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
        return <div className="flex justify-center items-center h-full">No tournament data available</div>;
    }

    const containerClass = viewType === BracketViewType.Normal
        ? "mt-12 ml-[8%] h-[89vh] overflow-auto pb-16"
        : "mt-[50px] ml-[8%] h-[89vh]";

    return (
        <div className={containerClass}>
            <BracketCreator
                roundIndex={bracket.rounds.length - 1}
                matchIndex={0}
                bracket={bracket}
                viewType={viewType}
                newPlayer={newPlayer}
                movingPlayer={movingPlayer}
                onMovePlayer={handleMovePlayer}
                tournament={tournament}
                onClose={onClose}
                user={user}
            />
        </div>
    );
};

export default TournamentBracket;