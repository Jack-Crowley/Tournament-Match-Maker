"use client";

import { useState } from "react";
import { Bracket, BracketPlayer, Matchup } from "@/types/bracketTypes";
import { MatchupModal } from "@/components/modals/displayMatchup";
import { motion } from "framer-motion";
import { addPlayerToMatchupFromWaitlist, moveOrSwapPlayerToMatchup } from "@/utils/bracket/bracket";
import { Tournament } from "@/types/tournamentTypes";
import { useMessage } from "@/context/messageContext";
import { User } from "@/types/userType";

import { AddPlayerButton, BracketViewType, MovingPlayer, OnMovePlayer } from "./bracketView";


interface MatchupElementProps {
    match: Matchup;
    viewType: BracketViewType;
    newPlayer: BracketPlayer | null;
    bracket?: Bracket | null;
    movingPlayer: MovingPlayer | null;
    onMovePlayer: OnMovePlayer;
    tournament: Tournament | null;
    onClose: (() => void) | null;
    user: User;
}
export const MatchupElement = ({
    match,
    viewType = BracketViewType.Single,
    newPlayer = null,
    tournament = null,
    movingPlayer = null,
    onMovePlayer,
    bracket = null,
    onClose = null,
    user,
}: MatchupElementProps) => {
    const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);
    const { triggerMessage } = useMessage?.() || { triggerMessage: () => { } };

    function openModal() {
        if (viewType === BracketViewType.Single) {
            console.log("we setIsmAthcingmodelopen to true");
            setIsMatchupModalOpen(true);
        }
    }
    const handleMoveHere = async (destIndex: number) => {
        console.log("handleMoveHere", destIndex, match)
        console.log("but moving player is ", movingPlayer)
        console.log("tournament is a poor old ", tournament)
        if (!movingPlayer || !tournament) return;
    

        const { success, errorCode } = await moveOrSwapPlayerToMatchup(
            tournament,
            match.match_number,
            match.round,
            movingPlayer,
            destIndex
        );

        if (success) {
            triggerMessage("Player moved/swapped successfully!", "green");
            onMovePlayer(null); // Reset moving state
        }
        else {
            triggerMessage(`Failed to move/swap player. Error code: ${errorCode}`, "red");
        }
        // setIsMatchupModalOpen(false);
    };


    const addPlayerFromWaitlist = async (index: number) => {
        if (viewType !== BracketViewType.AddPlayer || !tournament || !newPlayer || !onClose) return;

        const { success, errorCode } = await addPlayerToMatchupFromWaitlist(
            tournament,
            match.match_number,
            match.round,
            newPlayer,
            index
        );

        if (success) {
            triggerMessage("Player added successfully!", "green");
            onClose();
        } else {
            triggerMessage(`Failed to add player. Error code: ${errorCode}`, "red");
        }
    }

    const renderPlayerContent = (player: BracketPlayer, index: number) => {
        switch (viewType) {
            case BracketViewType.Single:
                if (!player.name) {
                    return (
                        <div
                            className={`p-4 font-bold border-l-8 
                                        ${match.winner
                                    ? "border-[#1e153e] text-[rgba(0,0,0,0)]"
                                    : "border-soft text-[#2e225b00]"} 
                                        bg-opacity-90 transition-all`}
                        >
                            Placeholder
                        </div>)
                }
                return (
                    <>
                        <span className="truncate mr-2">{player.name}</span>
                        <div
                            className={`w-6 h-6 flex items-center justify-center flex-shrink-0
                            ${match.winner
                                    ? player.uuid === match.winner
                                        ? "bg-[#baa6f6a2]"
                                        : "bg-[#1e153e9b]"
                                    : "bg-soft"
                                } 
                            text-white rounded-full text-sm font-bold`}
                        >
                            {player.score ?? 0}
                        </div>

                        <motion.button
                            className="p-2 bg-[#7458DA] rounded-lg text-white hover:bg-[#604BAC] transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(event) => {
                                triggerMessage("Move player button clicked", "blue");
                                event.stopPropagation();
                                onMovePlayer({ player, fromRound: match.round, fromMatch: match.match_number, fromIndex: index });
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowsAlt} />
                        </motion.button>
                    </>
                );

            case BracketViewType.AddPlayer:
                return player.name ? player.name : <AddPlayerButton onAddPlayer={() => addPlayerFromWaitlist(index)} />;

            case BracketViewType.MovePlayer:
                if (movingPlayer) {
                    // console.log("moving player!!!!!", movingPlayer);
                    return (
                        <MovePlayerButton
                            onMovePlayer={() => handleMoveHere(index)}
                            existingPlayer={player.name}
                        />
                    );
                }
                else {
                    triggerMessage("No player to move", "red");
                    return <p>ERROR NO MOVING PLAYER</p>
                }

            default:
                return <div className="p-4 font-bold border-l-8 border-soft text-secondary bg-opacity-90 transition-all">Placeholder</div>;
        }
    };


    return (
        <div className="flex justify-center items-center flex-shrink-0">
            <motion.div
                className={`${viewType === BracketViewType.Single ? "w-60" : "w-60"} bg-secondary rounded-lg shadow-xl overflow-hidden z-10 hover:cursor-pointer transition-all duration-300`}
                whileHover={viewType === BracketViewType.Single ? { scale: 1.05 } : undefined}
                transition={{ type: "spring", stiffness: 130 }}
                onClick={() => {
                    if (viewType === BracketViewType.Single && (user.permission_level !== "player" && user.permission_level !== "viewer")) {
                        console.log("open modal!")
                        openModal();
                    }
                    else if (viewType === "move-player") {
                        // console.log("moving player");
                    }
                    else {
                        console.log("no permission to open modal")
                    }
                }}
            >
                {match.players.map((player, index) => (
                    <div
                        key={index}
                        className={`relative ${match.winner && (player.uuid === match.winner ? "bg-[#98979b20]" : "bg-[#120b2950]")}`}
                    >
                        {player.name ? (
                            <div
                                className={`p-4 ${viewType === BracketViewType.Single ? "flex justify-between" : ""} font-bold border-l-8 
                ${match.winner
                                        ? player.uuid === match.winner
                                            ? "border-winner_text text-winner_text"
                                            : "border-loser_text text-loser_text"
                                        : "border-soft text-player_text"
                                    } 
                bg-opacity-90 hover:bg-opacity-100 transition-all duration-200`}
                            >
                                {renderPlayerContent(player, index)}
                            </div>
                        ) : (
                            renderPlayerContent(player, index)
                        )}

                        {index !== match.players.length - 1 && <div className="h-px bg-primary opacity-50"></div>}
                    </div>
                ))}


            </motion.div>
            {viewType === BracketViewType.Single && (
                <MatchupModal matchup={match} isOpen={isMatchupModalOpen} setOpen={setIsMatchupModalOpen} user={user} />
            )}
        </div>
    );


    // return (
    //     <div className="flex justify-center items-center flex-shrink-0">
    //         <motion.div
    //             className={`${viewType === BracketViewType.Single ? "w-44" : "w-40"} bg-secondary rounded-lg shadow-xl overflow-hidden z-10 hover:cursor-pointer transition-all duration-300`}
    //             whileHover={viewType === BracketViewType.Single ? { scale: 1.05 } : undefined}
    //             transition={{ type: "spring", stiffness: 300 }}
    //             onClick={(viewType === BracketViewType.Single && (user.permission_level != "player" && user.permission_level != "viewer")) ? openModal : undefined}
    //         >
    //             {match.players.map((player, index) => (
    //                 <div
    //                     key={index}
    //                     className={`${match.winner && (player.uuid === match.winner ? "bg-[#98979b20]" : "bg-[#120b2950]")}`}
    //                 >
    //                     {player.name ? (
    //                         <div
    //                             className={`p-4 ${viewType === BracketViewType.Single ? "flex justify-between" : ""} font-bold border-l-8 
    //               ${match.winner
    //                                     ? player.uuid === match.winner
    //                                         ? "border-winner_text text-winner_text"
    //                                         : `border-loser_text text-loser_text`
    //                                     : "border-soft text-player_text"} 
    //               bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 ${player.name === "" && "text-secondary"}`}
    //                         >
    //                             {/* //                       ? "border-[#baa6f6] text-[#baa6f6]"
    //             // : `border-[#1e153e] text-[#271c4e]` */}
    //                             {/* // : "border-soft text-[#2e225b]"}  */}
    //                             {viewType === BracketViewType.Single ? (
    //                                 <>
    //                                     <span className="truncate mr-2">{player.name}</span>
    //                                     <div
    //                                         className={`w-6 h-6 flex items-center justify-center flex-shrink-0
    //                       ${match.winner
    //                                                 ? player.uuid === match.winner
    //                                                     ? "bg-[#baa6f6a2]"
    //                                                     : "bg-[#1e153e9b]"
    //                                                 : "bg-soft"} 
    //                       text-white rounded-full text-sm font-bold`}
    //                                     >
    //                                         {player.score ? player.score : 0}
    //                                     </div>
    //                                 </>
    //                             ) : (
    //                                 player.name
    //                             )}
    //                         </div>
    //                     ) : (
    //                         viewType === "add-player" ? (
    //                             <AddPlayerButton onAddPlayer={() => addPlayerFromWaitlist(index)} />
    //                         ) : (
    //                             <div
    //                                 className={`p-4 font-bold border-l-8 
    //                 ${match.winner
    //                                         ? "border-[#1e153e] text-[rgba(0,0,0,0)]"
    //                                         : "border-soft text-[#2e225b00]"} 
    //                 bg-opacity-90 transition-all`}
    //                             >
    //                                 Placeholder
    //                             </div>
    //                         )
    //                     )}
    //                     {index !== match.players.length - 1 && (
    //                         <div className="h-px bg-primary opacity-50"></div>
    //                     )}
    //                 </div>
    //             ))}
    //         </motion.div>
    //         {viewType === BracketViewType.Single && (
    //             <MatchupModal matchup={match} isOpen={isMatchupModalOpen} setOpen={setIsMatchupModalOpen} />
    //         )}
    //     </div>
    // );
};


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrows, faArrowsAlt } from "@fortawesome/free-solid-svg-icons";

export const MovePlayerButton = ({
    onMovePlayer,
    existingPlayer
}: {
    onMovePlayer: () => void;
    existingPlayer?: string | null;
}) => {
    return (
        <motion.div
            className="bg-[#4A90E2] hover:bg-[#5FA6F3] transition-colors duration-200"
            onClick={onMovePlayer}
            style={{
                padding: "10px 20px",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "bold",
            }}
            whileHover={{ scale: 1.05 }}
        >
            <FontAwesomeIcon icon={faArrowsAlt} />
            {existingPlayer ? `Swap ${existingPlayer}` : "Move Here"}
        </motion.div>
    );
};
