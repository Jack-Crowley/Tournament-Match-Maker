"use client"

import React from "react";
import { useMessage } from "@/context/messageContext";
import { Player } from "@/types/playerTypes";
import { Bracket, BracketPlayer } from "@/types/bracketTypes";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";
import { faUserClock, faExclamationCircle, faInfoCircle, faEnvelope, faUserPlus, faTimes, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TournamentBracket, { BracketViewType } from "./single/bracketView";
import { User } from "@/types/userType";
import { RoundRobinRankedPlayer } from "@/types/rankedPlayerTypes";
import { RankRoundRobinPlayers } from "@/utils/tournament-styles/robin";

export const PlayersView = ({ tournamentID, bracket, user, setActiveTab }: { setActiveTab: (state: string) => void, tournamentID: number, bracket: Bracket, user: User }) => {
    const [activePlayer, setActivePlayer] = useState<Player | null>(null);
    const [activeContextPlayer, setActiveContextPlayer] = useState<Player | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addingPlayer, setAddingPlayer] = useState<Player | null>(null);
    const [isMessaging, setIsMessaging] = useState<boolean>(false);
    const [messageText, setMessageText] = useState<string>("");
    const [currentFilter, setCurrentFilter] = useState<string>("all");

    // Touranment Rankings
    const [rankingMap] = useState<Map<string, number>>(new Map());
    const [roundRobinRanked, setRoundRobinRanked] = useState<RoundRobinRankedPlayer[]>([]);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        player: Player;
    } | null>(null);

    const [openContextMenuId] = useState<string | null>(null);
    const contextMenuRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const { triggerMessage } = useMessage();
    const supabase = createClient();

    // Debug effect for activePlayer changes
    useEffect(() => {
        console.log('Active Player Changed:', {
            id: activePlayer?.id,
            name: activePlayer?.player_name,
            type: (activePlayer as any)?.type,
            isAdding: !!addingPlayer,
            isMessaging
        });
    }, [activePlayer, addingPlayer, isMessaging]);

    // Debug effect for context menu changes
    useEffect(() => {
        console.log('Context Menu State:', {
            isOpen: !!contextMenu,
            activeContextPlayer: activeContextPlayer?.player_name,
            position: contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null
        });
    }, [contextMenu, activeContextPlayer]);

    // Debug effect for addingPlayer changes
    useEffect(() => {
        console.log('[DEBUG] addingPlayer state changed:', {
            addingPlayer: addingPlayer ? {
                id: addingPlayer.id,
                name: addingPlayer.player_name
            } : null
        });
    }, [addingPlayer]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Check if click is inside the detailed popup
            const popup = document.querySelector('.player-details-popup');
            if (popup && popup.contains(e.target as Node)) {
                return;
            }

            console.log('[DEBUG] handleClickOutside: Click outside detected', {
                addingPlayer: addingPlayer ? {
                    id: addingPlayer.id,
                    name: addingPlayer.player_name
                } : null,
                hasActivePlayer: !!activePlayer,
                hasContextMenu: !!contextMenu
            });

            // Don't clear states if we're in the process of adding a player
            if (addingPlayer) {
                console.log('[DEBUG] handleClickOutside: Ignoring click outside while adding player');
                return;
            }

            console.log('[DEBUG] handleClickOutside: Clearing states');
            setContextMenu(null);
            setActivePlayer(null);
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openContextMenuId]);

    useEffect(() => {
        if (!tournament) return;

        if ((tournament?.tournament_type == "robin" || tournament?.tournament_type == "swiss")) {
            const rankedPlayers = RankRoundRobinPlayers(bracket);

            rankedPlayers.forEach((player, index) => {
                rankingMap.set(player.player.uuid, index);
            })

            setRoundRobinRanked(rankedPlayers)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournament, bracket])

    const sendMessageSuccess = async () => {
        if (!activePlayer || !messageText.trim()) return;

        const { error } = await supabase.from("private_messages").insert({
            player_uuid: activePlayer.member_uuid,
            tournament_id: tournamentID,
            content: messageText.trim(),
            player_seen: false,
            admin_seen: true,
            admin_sent: true
        })

        if (error) {
            triggerMessage("Failed to send message", "red");
        }
        else {
            triggerMessage("Message sent successfully", "green");
            setActiveTab("Messages")
        }

        try {

        } catch (error) {
            console.error("Error sending message:", error);
        }
    }

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);

            const { data, error } = await supabase
                .from("tournament_players")
                .select("*")
                .eq("tournament_id", tournamentID);

            if (error) {
                triggerMessage("Error fetching players", "red");
                console.error(error);
            } else {
                data.sort((a, b) => {
                    const typeOrder: any = { "active": 0, "waitlist": 1, "inactive": 2 };
                    const typeA = typeOrder[(a as any).type] || 0;
                    const typeB = typeOrder[(b as any).type] || 0;

                    if (typeA !== typeB) return typeA - typeB;

                    return a.last_update - b.last_update;
                });

                setPlayers(data as Player[]);
            }

            const { data: tourn, error: tournamentError } = await supabase
                .from("tournaments")
                .select("*")
                .eq("id", tournamentID)
                .single();

            if (tournamentError) {
                triggerMessage("Error fetching tournament details", "red");
                console.error(tournamentError);
            } else {
                setTournament(tourn as Tournament);
            }

            setIsLoading(false);
        }

        loadData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentID, supabase]);

    const getFilteredPlayers = () => {
        let filtered = players;

        if (currentFilter !== "all") {
            filtered = players.filter(player => (player as any).type === currentFilter);
        }

        if (tournament?.tournament_type === "robin" || tournament?.tournament_type == "swiss") {
            console.log(rankingMap)

            filtered = [...filtered].sort((a, b) => {
                const rankA = rankingMap.get(a.member_uuid);
                const rankB = rankingMap.get(b.member_uuid);

                if (rankA === undefined && rankB === undefined) return 0;
                if (rankA === undefined) return 1;
                if (rankB === undefined) return -1;

                return rankA - rankB;
            });
        }

        return filtered;
    };


    const getStatusChip = (type: string) => {
        switch (type) {
            case "active":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1b4e3a] text-[#4ade80] shadow-md">
                        Active
                    </span>
                );
            case "waitlist":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3a2b7d] text-[#a899e0] shadow-md">
                        Waitlist
                    </span>
                );
            case "inactive":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E3A8A] text-[#BFDBFE] shadow-md">
                        Inactive
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#4b5563] text-[#e5e7eb] shadow-md">
                        Unknown
                    </span>
                );
        }
    };

    const getPlayerCount = (type: string) => {
        return type === "all"
            ? players.length
            : players.filter(player => (player as any).type === type).length;
    };

    const getFilterButtonClass = (filter: string) => {
        return `px-4 py-2 rounded-lg text-sm transition-all duration-200 font-medium ${currentFilter === filter
            ? "bg-[#7458da] text-white shadow-lg"
            : "bg-[#2a1a66] text-[#a899e0] hover:bg-[#342373]"
            }`;
    };



    return (
        <div>
            {addingPlayer && tournament ? (
                <TournamentBracket
                    user={user}
                    bracketViewType={BracketViewType.AddPlayer}
                    tournamentID={Number(tournament.id)}
                    bracket={bracket}
                    newPlayer={addingPlayer as unknown as BracketPlayer}
                    onClose={() => {
                        console.log('[DEBUG] TournamentBracket onClose called', {
                            addingPlayer: addingPlayer ? {
                                id: addingPlayer.id,
                                name: addingPlayer.player_name
                            } : null
                        });
                        setAddingPlayer(null);
                    }}
                />
            ) : (
                <motion.div
                    className="w-full max-w-6xl mx-auto bg-[#1F1346] p-6 md:p-12 rounded-2xl shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="relative mb-8"
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative px-6 pt-8 md:px-10">
                                <div className="flex items-center justify-center mb-4">
                                    <h1 className="text-center group">
                                        <FontAwesomeIcon icon={faUserClock} className="mr-3 transform group-hover:rotate-12 transition-transform duration-300 text-[#7458da] text-3xl md:text-4xl" />
                                        <span className="bg-gradient-to-r from-purple-200 to-indigo-300 bg-clip-text text-transparent font-bold text-3xl md:text-4xl">
                                            Tournament Players
                                        </span>
                                    </h1>
                                </div>
                            </div>
                            {tournament && (
                                <div className="text-center">
                                    <p className="text-[#b8b8b8] text-lg max-w-2xl">
                                        All players for <span className="text-white font-medium">{tournament.name || "this tournament"}</span>
                                    </p>
                                    <div className="flex items-center justify-center mt-2">
                                        <div className="flex space-x-2 text-sm text-[#a899e0]">
                                            <span>{getPlayerCount("active")} active</span>
                                            <span>•</span>
                                            <span>{getPlayerCount("waitlist")} waiting</span>
                                            <span>•</span>
                                            <span>{getPlayerCount("inactive")} inactive</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {!isLoading && (
                        <motion.div
                            className="flex justify-center gap-2 mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                        >
                            <button
                                className={getFilterButtonClass("all")}
                                onClick={() => setCurrentFilter("all")}
                            >
                                All ({getPlayerCount("all")})
                            </button>
                            <button
                                className={getFilterButtonClass("active")}
                                onClick={() => setCurrentFilter("active")}
                            >
                                Active ({getPlayerCount("active")})
                            </button>
                            <button
                                className={getFilterButtonClass("waitlist")}
                                onClick={() => setCurrentFilter("waitlist")}
                            >
                                Waitlist ({getPlayerCount("waitlist")})
                            </button>
                            <button
                                className={getFilterButtonClass("inactive")}
                                onClick={() => setCurrentFilter("inactive")}
                            >
                                Inactive ({getPlayerCount("inactive")})
                            </button>
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                className="flex justify-center items-center py-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-[#3a2b7d] border-t-[#7458da] rounded-full animate-spin"></div>
                                    <p className="text-[#a899e0] mt-4 text-center">Loading players...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isLoading && (
                        <AnimatePresence>
                            {getFilteredPlayers().length > 0 ? (
                                <motion.div
                                    className="mb-8"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <div className="overflow-hidden rounded-lg shadow-2xl bg-[#2a1a66] p-4 md:p-6">
                                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#3a2b7d] scrollbar-track-[#221655]">
                                            <table className="w-full mx-auto rounded-lg shadow-lg">
                                                <thead className="bg-[#1b113d] sticky top-0">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-white font-semibold text-base border-b-2 border-[#3a2b7d]">Name</th>
                                                        {(tournament?.tournament_type == "robin" || tournament?.tournament_type == "swiss") && (
                                                            <th className="px-6 py-3 text-center text-white font-semibold text-base border-b-2 border-[#3a2b7d] w-20">History</th>
                                                        )}
                                                        {tournament?.skill_fields?.map((skill, index) => (
                                                            <th
                                                                key={index}
                                                                className="px-6 py-3 text-left text-white font-semibold text-base border-b-2 border-[#3a2b7d] truncate max-w-[180px]"
                                                            >
                                                                {skill.name}
                                                            </th>
                                                        ))}
                                                        <th className="px-6 py-3 text-center text-white font-semibold text-base border-b-2 border-[#3a2b7d] w-24">Status</th>

                                                        <th className="px-6 py-3 text-left text-white font-semibold text-base border-b-2 border-[#3a2b7d]" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredPlayers().map((player, index) => (
                                                        <React.Fragment key={player.id}>
                                                            <motion.tr
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (activePlayer?.id === player.id) {
                                                                        setActivePlayer(null);
                                                                    } else {
                                                                        setActivePlayer(player);
                                                                        setIsMessaging(false);
                                                                    }
                                                                }}
                                                                className={`
                                                                    ${activePlayer && activePlayer.id === player.id ? "bg-[#342373]" : "bg-[#22154F]"} 
                                                                    transition-all duration-200 ${user.permission_level !== "player" && user.permission_level !== "viewer" ? "cursor-pointer" : ""}
                                                                    hover:bg-[#2a1b5f] hover:shadow-md
                                                                `}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <td className={`p-4 text-lg border-b border-[#3a2b7d] ${player.is_anonymous ? "text-white font-medium" : "text-[#d8d8d8] font-medium"}`}>
                                                                    <div className="flex items-center">
                                                                        {rankingMap.get(player.member_uuid) == undefined ? "-  " : `${rankingMap.get(player.member_uuid)! + 1}.`}
                                                                        <div className="w-8 h-8 ml-4 bg-[#3a2b7d] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                                            <span className="text-sm font-bold text-white">
                                                                                {player.player_name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        {player.player_name}
                                                                    </div>
                                                                </td>
                                                                {(tournament?.tournament_type == "robin" || tournament?.tournament_type == "swiss") && roundRobinRanked && (
                                                                    <td className="border-b border-[#3a2b7d]">
                                                                        {(index >= players.length) ? (
                                                                            ((player as any).type != "waitlist") ? (<div className="text-gray-300 text-center">0/0/0</div>) : (<div className="text-gray-300 text-center">-/-/-</div>)
                                                                        ) : (
                                                                            <h1 className="text-center text-white">
                                                                                {roundRobinRanked[index] != undefined && (
                                                                                    <div><span className="text-green-500">{roundRobinRanked[index].wins.length}</span> / <span className="text-red-300">{roundRobinRanked[index].losses.length}</span> / <span className="text-blue-300">{roundRobinRanked[index].ties.length}</span></div>
                                                                                )}
                                                                            </h1>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                {tournament?.skill_fields?.map((skill, index) => (
                                                                    <td
                                                                        key={index}
                                                                        className="p-4 text-lg border-b border-[#3a2b7d] text-[#b8b8b8]"
                                                                    >
                                                                        {player.skills && player.skills.findIndex(s => s.name === skill.name) !== -1 ? (
                                                                            <div className="flex items-center">
                                                                                <div className="w-2 h-2 rounded-full bg-[#7458da] mr-2"></div>
                                                                                {player.skills[index].type === "numeric" ? player.skills[index].value : player.skills[index].category_type}
                                                                            </div>
                                                                        ) : "—"}
                                                                    </td>
                                                                ))}
                                                                <td className="p-4 text-center border-b border-[#3a2b7d]">
                                                                    <div className="flex justify-center">
                                                                        {getStatusChip((player as any).type || "unknown")}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 border-b border-[#3a2b7d] relative">
                                                                    {(user.permission_level === "admin" || user.permission_level === "owner") &&
                                                                        (['waitlist', 'inactive'].includes((player as any).type)) && (
                                                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                                                <div
                                                                                    className="relative"
                                                                                    ref={(el) => {
                                                                                        if (contextMenuRef.current) {
                                                                                            contextMenuRef.current[player.member_uuid] = el;
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveContextPlayer(player)

                                                                                            setContextMenu({
                                                                                                x: e.pageX,
                                                                                                y: e.pageY - 100,
                                                                                                player,
                                                                                            });
                                                                                        }}
                                                                                        className="text-[#a899e0] hover:text-white p-2 rounded-full hover:bg-[#342575] transition-colors"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEllipsisV} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </td>
                                                            </motion.tr>
                                                            {activePlayer && activePlayer.id === player.id && (
                                                                <motion.tr>
                                                                    <td colSpan={tournament?.skill_fields?.length ? tournament.skill_fields.length + 3 : 3} className="p-0">
                                                                        <motion.div
                                                                            className="bg-[#2a1a66] player-details-popup rounded-lg shadow-xl overflow-hidden"
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            transition={{ duration: 0.3 }}
                                                                        >
                                                                            <div className="p-6 border-b border-[#3a2b7d]">
                                                                                <div className="flex items-start justify-between">
                                                                                    <div className="flex items-center">
                                                                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#3a2b7d] to-[#7458da] rounded-full flex items-center justify-center shadow-lg">
                                                                                            <span className="text-xl font-bold text-white">
                                                                                                {activePlayer.player_name.charAt(0).toUpperCase()}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="ml-4">
                                                                                            <h3 className="text-xl font-bold text-white flex items-center">
                                                                                                {activePlayer.player_name}
                                                                                                {(activePlayer as any).account_type !== "generated" && !activePlayer.is_anonymous && !((activePlayer as any).placeholder_player) && (
                                                                                                    <span className="ml-2 text-xs bg-[#7458da] text-white px-2 py-1 rounded">Verified</span>
                                                                                                )}
                                                                                            </h3>
                                                                                            <div className="mt-1 flex items-center flex-wrap gap-2">
                                                                                                {getStatusChip((activePlayer as any).type || "unknown")}
                                                                                                {(activePlayer as any).type === "waitlist" && (
                                                                                                    <span className="text-[#b8b8b8] text-sm">
                                                                                                        Position: #{players.filter(p => (p as any).type === "waitlist").findIndex(p => p.id === activePlayer.id) + 1}
                                                                                                    </span>
                                                                                                )}

                                                                                                {(activePlayer as any).account_type !== "generated" && (
                                                                                                    <span className="text-[#b8b8b8] text-sm bg-[#342575] px-2 py-1 rounded">
                                                                                                        {!activePlayer.is_anonymous && !((activePlayer as any).placeholder_player) ? "Logged In User" : !(activePlayer as any).placeholder_player ? "Anonymous User" : "Generated User"}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <button
                                                                                        className="text-[#7458da] hover:text-white p-2 rounded-full hover:bg-[#342575] transition-colors"
                                                                                        onClick={() => setActivePlayer(null)}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                                    </button>
                                                                                </div>

                                                                                <div className="mt-6 mb-2">
                                                                                    <h4 className="text-[#a899e0] font-medium">Player Skills</h4>
                                                                                </div>

                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    {tournament?.skill_fields?.map((skill, index) => (
                                                                                        activePlayer.skills && activePlayer.skills[index] && (
                                                                                            <motion.div
                                                                                                key={index}
                                                                                                className="bg-[#342575] p-3 rounded-md shadow-md"
                                                                                                whileHover={{ scale: 1.02 }}
                                                                                                transition={{ duration: 0.2 }}
                                                                                            >
                                                                                                <p className="text-[#a899e0] text-sm">{skill.name}</p>
                                                                                                <p className="text-white font-medium">
                                                                                                    {activePlayer.skills[index].type === "numeric" ?
                                                                                                        activePlayer.skills[index].value
                                                                                                        : activePlayer.skills[index].category_type}
                                                                                                </p>
                                                                                            </motion.div>
                                                                                        )
                                                                                    ))}
                                                                                </div>

                                                                                <div className="mt-6 flex flex-wrap gap-3">
                                                                                    {(['waitlist', 'inactive'].includes((activePlayer as any).type) && (user.permission_level === "admin" || user.permission_level === "owner")) && (
                                                                                        <motion.button
                                                                                            className="px-4 py-2 bg-gradient-to-r from-[#7458da] to-[#634bc1] hover:from-[#634bc1] hover:to-[#523aad] text-white rounded-md transition-all flex items-center shadow-md"
                                                                                            onClick={() => {
                                                                                                console.log('[DEBUG] Move to Roster button clicked', {
                                                                                                    activePlayer: activePlayer ? {
                                                                                                        id: activePlayer.id,
                                                                                                        name: activePlayer.player_name
                                                                                                    } : null
                                                                                                });
                                                                                                setAddingPlayer(activePlayer);
                                                                                            }}
                                                                                            whileHover={{ scale: 1.05 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                        >
                                                                                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                                                                            Move to Roster
                                                                                        </motion.button>
                                                                                    )}

                                                                                    {!((activePlayer as any).placeholder_player) && (["owner", "admin"].includes(user.permission_level)) && (
                                                                                        <motion.button
                                                                                            className="px-4 py-2 bg-[#342575] hover:bg-[#3a2b7d] text-white rounded-md transition-colors flex items-center shadow-md"
                                                                                            onClick={() => setIsMessaging(!isMessaging)}
                                                                                            whileHover={{ scale: 1.05 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                        >
                                                                                            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                                                                            Message Player
                                                                                        </motion.button>
                                                                                    )}
                                                                                </div>

                                                                                <AnimatePresence>
                                                                                    {isMessaging && (
                                                                                        <motion.div
                                                                                            className="mt-6 bg-[#221655] p-5 rounded-lg border border-[#3a2b7d] shadow-inner"
                                                                                            initial={{ opacity: 0, y: -10 }}
                                                                                            animate={{ opacity: 1, y: 0 }}
                                                                                            exit={{ opacity: 0, y: -10 }}
                                                                                        >
                                                                                            <h4 className="text-white font-medium mb-3 flex items-center">
                                                                                                <FontAwesomeIcon icon={faEnvelope} className="text-[#7458da] mr-2" />
                                                                                                Message to {activePlayer.player_name}
                                                                                            </h4>
                                                                                            <textarea
                                                                                                className="w-full p-3 rounded bg-[#1b113d] text-white border border-[#3a2b7d] focus:border-[#7458da] focus:outline-none transition-colors shadow-inner"
                                                                                                rows={4}
                                                                                                placeholder="Type your message here..."
                                                                                                value={messageText}
                                                                                                onChange={(e) => setMessageText(e.target.value)}
                                                                                            ></textarea>
                                                                                            <div className="flex justify-end mt-3 gap-2">
                                                                                                <motion.button
                                                                                                    className="px-4 py-2 bg-[#221655] hover:bg-[#1b113d] text-white rounded-md transition-colors"
                                                                                                    onClick={() => setIsMessaging(false)}
                                                                                                    whileHover={{ scale: 1.05 }}
                                                                                                    whileTap={{ scale: 0.95 }}
                                                                                                >
                                                                                                    Cancel
                                                                                                </motion.button>
                                                                                                <motion.button
                                                                                                    className={`px-4 py-2 rounded-md transition-colors flex items-center shadow-md ${messageText.trim()
                                                                                                        ? "bg-gradient-to-r from-[#7458da] to-[#634bc1] hover:from-[#634bc1] hover:to-[#523aad] text-white"
                                                                                                        : "bg-[#342575] text-[#a899e0] cursor-not-allowed"
                                                                                                        }`}
                                                                                                    onClick={sendMessageSuccess}
                                                                                                    disabled={!messageText.trim()}
                                                                                                    whileHover={messageText.trim() ? { scale: 1.05 } : {}}
                                                                                                    whileTap={messageText.trim() ? { scale: 0.95 } : {}}
                                                                                                >
                                                                                                    Send Message
                                                                                                </motion.button>
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        </motion.div>
                                                                    </td>
                                                                </motion.tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="text-center p-8 bg-[#22154F] rounded-lg shadow-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <FontAwesomeIcon icon={faExclamationCircle} className="text-[#7458da] text-4xl mb-4" />
                                    <h3 className="text-white text-xl font-semibold mb-2">No Players Found</h3>
                                    <p className="text-[#a8a8a8] text-lg">
                                        {currentFilter === "all"
                                            ? "There are currently no players in this tournament."
                                            : `There are no players with ${currentFilter} status.`}
                                    </p>
                                    {currentFilter !== "all" && (
                                        <button
                                            className="mt-4 px-4 py-2 bg-[#342575] hover:bg-[#3a2b7d] text-white rounded-md transition-colors"
                                            onClick={() => setCurrentFilter("all")}
                                        >
                                            Show All Players
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Info Section at bottom */}
                    {!isLoading && getFilteredPlayers().length > 0 && (
                        <motion.div
                            className="mt-8 p-5 bg-[#221655] rounded-lg border border-[#3a2b7d] shadow-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#7458da] text-xl mt-1 flex-shrink-0" />
                                <div className="ml-3">
                                    <h4 className="text-white font-medium">Player Status Guide</h4>
                                    <div className="text-[#b8b8b8] text-sm mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-[#4ade80] mr-2"></div>
                                            <span className="font-medium text-[#4ade80] mr-1">Active:</span>
                                            <span>Players in tournament</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-[#a899e0] mr-2"></div>
                                            <span className="font-medium text-[#a899e0] mr-1">Waitlist:</span>
                                            <span>Pending players</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-[#BFDBFE] mr-2"></div>
                                            <span className="font-medium text-[#BFDBFE] mr-1">Inactive:</span>
                                            <span>Removed players</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
            <div className="h-10"></div>
            <AnimatePresence>
                {activeContextPlayer && contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                            minWidth: '150px'
                        }}
                        className="absolute z-50 right-full mr-2 bg-[#342575] rounded-lg shadow-xl border border-[#3a2b7d] overflow-hidden"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePlayer(activeContextPlayer)
                                setAddingPlayer(activeContextPlayer)
                            }}
                            className="w-full text-left px-4 py-2 text-white hover:bg-[#3a2b7d] flex items-center"
                        >
                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                            Move to Roster
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};