"use client";

import { useState, useRef, useEffect } from "react";
import { Bracket, BracketPlayer, Matchup } from "@/types/bracketTypes";
import { MatchupModal } from "@/components/modals/displayMatchup";
import { motion } from "framer-motion";
import { addPlayerToMatchupFromWaitlist, moveOrSwapPlayerToMatchup } from "@/utils/bracket/bracket";
import { Tournament } from "@/types/tournamentTypes";
import { useMessage } from "@/context/messageContext";
import { User } from "@/types/userType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowsAlt, faCrown, faExchangeAlt } from "@fortawesome/free-solid-svg-icons";

import { AddPlayerButton, BracketViewType, MovingPlayer, OnMovePlayer } from "./bracketView";

interface ContextMenuProps {
    x: number;
    y: number;
    player: BracketPlayer;
    round: number;
    matchNumber: number;
    index: number;
    onMovePlayer: OnMovePlayer;
    onClose: () => void;
}

const ContextMenu = ({ x, y, player, round, matchNumber, index, onMovePlayer, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-deep rounded-md shadow-lg z-50 overflow-hidden"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                minWidth: '150px'
            }}
        >
            <div
                className="px-4 py-2 hover:bg-[#7458DA] hover:text-white cursor-pointer flex items-center gap-2"
                onClick={() => {
                    onMovePlayer({ player, fromRound: round, fromMatch: matchNumber, fromIndex: index });
                    onClose();
                }}
            >
                <FontAwesomeIcon icon={faArrowsAlt} />
                Move Player
            </div>
        </div>
    );
};

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
    viewType = BracketViewType.Normal,
    newPlayer = null,
    tournament = null,
    movingPlayer = null,
    onMovePlayer,
    bracket = null,
    onClose = null,
    user,
}: MatchupElementProps) => {
    const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        player: BracketPlayer;
        index: number;
    } | null>(null);
    const { triggerMessage } = useMessage?.() || { triggerMessage: () => { } };

    console.log(match)

    if (bracket) {

    }

    function openModal() {
        if (viewType === BracketViewType.Normal && tournament?.status !== "completed") {
            console.log(user.permission_level)
            if (["owner", "admin", "scorekeeper"].includes(user.permission_level.toLowerCase())) {
                setIsMatchupModalOpen(true);
            }
        } else {
            triggerMessage("Tournament has ended. No modifications allowed.", "yellow");
        }
    }

    const handleContextMenu = (e: React.MouseEvent, player: BracketPlayer, index: number) => {
        if (!player.name || viewType !== "normal" || (user.permission_level === "player" || user.permission_level === "viewer") || tournament?.status !== "started") {
            return;
        }

        e.preventDefault();

        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY - 20,
            player,
            index,
        });
    };
    const handleCancelMove = () => {
        onMovePlayer(null);
        // viewType = BracketViewType.Single;
        triggerMessage("Move operation canceled", "yellow");
    };


    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu?.visible) {
                setContextMenu(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && contextMenu?.visible) {
                setContextMenu(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [contextMenu]);

    const handleMoveHere = async (destIndex: number) => {
        if (!movingPlayer || !tournament) return;

        if (tournament.status === "completed") {
            triggerMessage("Tournament has ended. No modifications allowed.", "yellow");
            return;
        }

        const { success, errorCode } = await moveOrSwapPlayerToMatchup(
            tournament,
            match.match_number,
            match.round,
            movingPlayer,
            destIndex
        );

        if (success) {
            triggerMessage("Player moved/swapped successfully!", "green");
            onMovePlayer(null);
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
        const isWinner = match.winner && player.uuid === match.winner;
        
        switch (viewType) {
            case BracketViewType.Normal:
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
                        </div>
                    );
                }
                return (
                    <>
                        <span className="truncate mr-2">  {isWinner && <FontAwesomeIcon icon={faCrown} className="text-yellow-500 mr-2" />} {player.name}</span>
                       
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
                    </>
                );
    
            case BracketViewType.AddPlayer:
                return player.name ?
                    <span className="truncate mr-2">{player.name}</span>
                    : <AddPlayerButton onAddPlayer={() => addPlayerFromWaitlist(index)} />;
    
            case BracketViewType.MovePlayer:
                if (movingPlayer) {
                    return (
                        <MovePlayerButton
                            onMovePlayer={() => handleMoveHere(index)}
                            existingPlayer={player}
                            selectedPlayer={movingPlayer}
                            onCancelMove={handleCancelMove}
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
                className={`${viewType === BracketViewType.Normal ? "w-60" : "w-60"} bg-secondary rounded-lg shadow-xl overflow-hidden z-10 hover:cursor-pointer transition-all duration-300`}
                whileHover={viewType === BracketViewType.Normal ? { scale: 1.05 } : undefined}
                transition={{ type: "spring", stiffness: 130 }}
                onClick={(e) => {
                    // Prevent click propagation when right-clicking
                    if (e.button !== 2 && viewType === BracketViewType.Normal && (user.permission_level !== "player" && user.permission_level !== "viewer")) {
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
                        onContextMenu={(e) => handleContextMenu(e, player, index)}
                    >
                        {(player.name && viewType == BracketViewType.Normal || viewType == BracketViewType.AddPlayer) ? (
                            <div
                                className={`p-4 flex justify-between font-bold border-l-8 
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
            {viewType === BracketViewType.Normal && tournament && (
                <MatchupModal matchup={match} isOpen={isMatchupModalOpen} setOpen={setIsMatchupModalOpen} user={user} tournament_type={tournament?.tournament_type}/>
            )}

            {contextMenu && contextMenu.visible && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    player={contextMenu.player}
                    round={match.round}
                    matchNumber={match.match_number}
                    index={contextMenu.index}
                    onMovePlayer={onMovePlayer}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export const MovePlayerButton = ({
    onMovePlayer,
    onCancelMove,
    existingPlayer,
    selectedPlayer,
}: {
    onMovePlayer: () => void;
    onCancelMove: () => void;
    existingPlayer: BracketPlayer;
    selectedPlayer: MovingPlayer;
}) => {
    const isSamePlayer = existingPlayer.uuid === selectedPlayer.player.uuid;
    return (
        <motion.div
            className={`transition-colors duration-200 ${isSamePlayer
                ? 'bg-purple-700 cursor-not-allowed'
                : existingPlayer.name
                    ? 'bg-[#FFA559] hover:bg-[#FF9248]'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
            onClick={isSamePlayer ? undefined : onMovePlayer}
            style={{
                padding: "10px 20px",
                color: "white",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "bold",
            }}
            whileHover={isSamePlayer ? {} : { scale: 1.05 }}
        >
            {!isSamePlayer && (
                <FontAwesomeIcon icon={existingPlayer.name ? faExchangeAlt : faArrowRight} />

            )}
            {isSamePlayer
                ? "Current Position"
                : existingPlayer.name
                    ? `Swap with ${existingPlayer.name}`
                    : "Move Here"}
            {isSamePlayer && <CancelMoveButton onCancelMove={onCancelMove} />}

        </motion.div>
    );
};

export const CancelMoveButton = ({
    onCancelMove,
}: {
    onCancelMove: () => void;
}) => {
    return (
        <motion.button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all"
            onClick={onCancelMove}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            Cancel
        </motion.button>
    );
};
