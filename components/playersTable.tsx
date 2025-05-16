"use client";

import { Player } from "@/types/playerTypes";
import { useEffect, useState } from "react";
import { useMessage } from "@/context/messageContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { PlayerModal } from "./modals/editPlayersModal";
import { ConfirmModal, ConfirmModalInformation } from "./modals/confirmationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrash,
    faUserClock,
    faUserMinus,
    faUserPlus,
    faUsers,
    faCheck,
    faXmark,
    faSort,
    faSortUp,
    faSortDown,
    faFilter
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";

// Define the SortConfig type
type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
    type: 'text' | 'numeric' | 'categorical';
    skillIndex?: number;
}

export const PlayersTable = ({
    players,
    setPlayers,
    otherPlayers,
    setOtherPlayers,
    type,
    tournament,
    permission_level
}: {
    permission_level: string;
    players: Player[];
    setPlayers: (players: Player[]) => void;
    otherPlayers: Player[];
    setOtherPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    type: string;
    tournament: Tournament;
}) => {
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
    const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
    const [canDelete, setCanDelete] = useState<boolean>(false);
    const [confirmModalInfo, setConfirmModalInfo] = useState<ConfirmModalInformation | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [selectionMode, setSelectionMode] = useState<boolean>(false);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [sortMenuOpen, setSortMenuOpen] = useState<boolean>(false);
    const [displayedPlayers, setDisplayedPlayers] = useState<Player[]>(players);

    const { triggerMessage } = useMessage();
    const supabase = createClient();

    // Update displayed players when original players or sort config changes
    useEffect(() => {
        if (sortConfig) {
            const sortedPlayers = [...players].sort((a, b) => {
                if (sortConfig.key === 'player_name') {
                    // Sort by player name
                    return sortConfig.direction === 'asc'
                        ? a.player_name.localeCompare(b.player_name)
                        : b.player_name.localeCompare(a.player_name);
                } else if (sortConfig.key.startsWith('skill_')) {
                    const skillIndex = sortConfig.skillIndex !== undefined ? sortConfig.skillIndex : 0;
                    const aSkill = a.skills[skillIndex];
                    const bSkill = b.skills[skillIndex];

                    // Handle missing skill values
                    if (!aSkill && !bSkill) return 0;
                    if (!aSkill) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (!bSkill) return sortConfig.direction === 'asc' ? 1 : -1;

                    // Sort based on skill type
                    if (sortConfig.type === 'numeric') {
                        return sortConfig.direction === 'asc'
                            ? aSkill.value - bSkill.value
                            : bSkill.value - aSkill.value;
                    } else if (sortConfig.type === 'categorical') {
                        // Sort categorical values alphabetically
                        return sortConfig.direction === 'asc'
                            ? (aSkill.category_type || '').localeCompare(bSkill.category_type || '')
                            : (bSkill.category_type || '').localeCompare(aSkill.category_type || '');
                    }
                }
                return 0;
            });
            setDisplayedPlayers(sortedPlayers);
        } else {
            setDisplayedPlayers(players);
        }
    }, [players, sortConfig]);

    useEffect(() => {
        setCanDelete(permission_level === "admin" || permission_level === "owner");
    }, [permission_level]);

    // Reset selection mode when no players are selected
    useEffect(() => {
        if (selectedPlayers.size === 0) {
            setSelectionMode(false);
        }
    }, [selectedPlayers]);

    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectedPlayers(new Set());
        }
        setSelectionMode(!selectionMode);
    };

    const handleSelectPlayer = (playerId: string, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
        }

        const newSelectedPlayers = new Set(selectedPlayers);

        if (newSelectedPlayers.has(playerId)) {
            newSelectedPlayers.delete(playerId);
        } else {
            newSelectedPlayers.add(playerId);
        }

        setSelectedPlayers(newSelectedPlayers);

        // If a player is selected, automatically enter selection mode
        if (newSelectedPlayers.size > 0 && !selectionMode) {
            setSelectionMode(true);
        }
    };

    const handleSelectAll = () => {
        if (selectedPlayers.size === displayedPlayers.length) {
            // Deselect all
            setSelectedPlayers(new Set());
        } else {
            // Select all
            setSelectedPlayers(new Set(displayedPlayers.map(player => player.id)));
        }
    };

    const handleCardClick = (player: Player, event: React.MouseEvent) => {
        // If we're in selection mode, clicking the card selects the player
        if (selectionMode) {
            handleSelectPlayer(player.id, event);
        } else {
            setModalPlayer(player);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPlayers.size === 0) {
            triggerMessage("No players selected", "red");
            return;
        }

        const confirmModal: ConfirmModalInformation = {
            title: "Delete Players",
            content: `Are you sure you want to delete ${selectedPlayers.size === 1 ? 'this player' : `these ${selectedPlayers.size} players`}? This action cannot be undone.`,
            onCancel: () => setConfirmModalInfo(null),
            onSuccess: async () => {
                setIsProcessing(true);

                try {
                    const { error } = await supabase
                        .from("tournament_players")
                        .delete()
                        .in("id", Array.from(selectedPlayers));

                    if (error) {
                        throw new Error(error.message);
                    }

                    triggerMessage(`${selectedPlayers.size === 1 ? 'Player' : 'Players'} deleted successfully`, "green");
                    setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
                    setSelectedPlayers(new Set());
                } catch (error) {
                    triggerMessage(`Error deleting players: ${error instanceof Error ? error.message : 'Unknown error'}`, "red");
                } finally {
                    setIsProcessing(false);
                    setConfirmModalInfo(null);
                }
            },
        };

        setConfirmModalInfo(confirmModal);
    };

    const handleBulkSwitch = async () => {
        const newType = type === "active" ? "waitlist" : "active";

        if (selectedPlayers.size === 0) {
            triggerMessage("No players selected", "red");
            return;
        }

        const playerIDs = Array.from(selectedPlayers);
        const payload = {
            tournamentID: tournament.id,
            playerIDs,
            type,
            maxPlayers: tournament.max_players,
            otherPlayersCount: otherPlayers.length,
        };

        const executeBulkSwitch = async () => {
            setIsProcessing(true);

            try {
                const res = await fetch("/api/tournament/bulk-switch", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || "Something went wrong");
                }

                triggerMessage(`${selectedPlayers.size === 1 ? 'Player' : 'Players'} moved to ${newType} successfully`, "green");

                setOtherPlayers(prev => [...prev, ...players.filter(p => selectedPlayers.has(p.id))]);
                setPlayers(players.filter(p => !selectedPlayers.has(p.id)));
                setSelectedPlayers(new Set());
            } catch (error) {
                triggerMessage(`Error moving players: ${error instanceof Error ? error.message : 'Unknown error'}`, "red");
            } finally {
                setIsProcessing(false);
                setConfirmModalInfo(null);
            }
        };

        // First check if there's a potential issue
        try {
            const res = await fetch("/api/tournament/bulk-switch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.status === 409 && result.warning) {
                const confirmModal: ConfirmModalInformation = {
                    title: "Player Limit Warning",
                    content: `Moving ${playerIDs.length > 1 ? `these ${playerIDs.length} players` : "this player"} to the active list would exceed the maximum player limit of ${tournament.max_players}. Do you want to proceed anyway?`,
                    onCancel: () => setConfirmModalInfo(null),
                    onSuccess: executeBulkSwitch,
                };

                setConfirmModalInfo(confirmModal);
                return;
            }

            if (!res.ok) {
                throw new Error(result.error || "Something went wrong");
            }

            // If no issues, execute the switch
            await executeBulkSwitch();
        } catch (error) {
            triggerMessage(`Error checking player limits: ${error instanceof Error ? error.message : 'Unknown error'}`, "red");
        }
    };

    const getActionButtonClass = (variant: 'primary' | 'danger' | 'default' = 'default') => {
        const baseClasses = "px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium";

        switch (variant) {
            case 'primary':
                return `${baseClasses} bg-indigo-600/20 hover:bg-indigo-600/30 text-purple-200 border border-indigo-600/30 hover:border-indigo-500/50`;
            case 'danger':
                return `${baseClasses} bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-600/30 hover:border-red-500/50`;
            default:
                return `${baseClasses} bg-gray-700/50 hover:bg-gray-700/70 text-gray-200 border border-gray-600/30 hover:border-gray-500/50`;
        }
    };

    const DestinationLabel = () => (
        <span className="text-sm font-medium">
            {type === "active" ? "Move to Waitlist" : "Move to Active List"}
        </span>
    );

    // Sort handling functions
    const handleSort = (key: string, type: 'text' | 'numeric' | 'categorical', skillIndex?: number) => {
        setSortMenuOpen(false);

        // If clicking the same key, toggle direction or reset
        if (sortConfig?.key === key) {
            if (sortConfig.direction === 'asc') {
                setSortConfig({ key, direction: 'desc', type, skillIndex });
            } else {
                // Reset sorting
                setSortConfig(null);
            }
        } else {
            // New sort key, default to ascending
            setSortConfig({ key, direction: 'asc', type, skillIndex });
        }
    };

    const getSortDirectionIcon = (key: string) => {
        if (sortConfig?.key !== key) return faSort;
        return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
    };

    return (
        <div>
            {modalPlayer && (
                <PlayerModal
                    isOpen={modalPlayer != null}
                    onClose={() => setModalPlayer(null)}
                    playerForModal={modalPlayer}
                    tournament={tournament}
                />
            )}
            <ConfirmModal information={confirmModalInfo} />

            {players.length > 0 && (
                <div className={`mb-6 ${type === "active" ? "" : "mt-8"}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-indigo-900/30">
                                <FontAwesomeIcon
                                    icon={type === "active" ? faUsers : faUserClock}
                                    className="text-purple-200"
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold flex items-center">
                                    <span className="text-white">
                                        {type === "active" ? "Registered Players" : "Waitlist"}
                                        <span className="ml-2 text-lg text-purple-300">({players.length})</span>
                                    </span>
                                </h2>
                                {selectedPlayers.size > 0 && (
                                    <div className="text-sm text-purple-300 mt-1">
                                        {selectedPlayers.size} {selectedPlayers.size === 1 ? 'player' : 'players'} selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            {/* Sorting dropdown */}
                            <div className="relative">
                                <button
                                    className={`${getActionButtonClass('default')} ${sortConfig ? 'border-indigo-500/50' : ''}`}
                                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                                >
                                    <FontAwesomeIcon icon={faFilter} />
                                    <span>
                                        {sortConfig
                                            ? `Sorted by ${sortConfig.key === 'player_name'
                                                ? 'Name'
                                                : tournament?.skill_fields[sortConfig.skillIndex || 0]?.name}`
                                            : 'Sort Players'}
                                    </span>
                                    {sortConfig && (
                                        <FontAwesomeIcon
                                            icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown}
                                            className="ml-1"
                                        />
                                    )}
                                </button>

                                {sortMenuOpen && (
                                    <div className="absolute z-10 right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 border border-gray-700">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleSort('player_name', 'text')}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex justify-between items-center"
                                            >
                                                <span>Player Name</span>
                                                <FontAwesomeIcon icon={getSortDirectionIcon('player_name')} />
                                            </button>

                                            {Array.isArray(tournament?.skill_fields) && tournament.skill_fields.map((skill, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSort(`skill_${index}`, skill.type === 'numeric' ? 'numeric' : 'categorical', index)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex justify-between items-center"
                                                >
                                                    <span>{skill.name}</span>
                                                    <FontAwesomeIcon icon={getSortDirectionIcon(`skill_${index}`)} />
                                                </button>
                                            ))}

                                            {sortConfig && (
                                                <button
                                                    onClick={() => setSortConfig(null)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-gray-700 flex items-center"
                                                >
                                                    <FontAwesomeIcon icon={faXmark} className="mr-2" />
                                                    <span>Clear Sorting</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {canDelete && (
                                selectionMode ? (
                                    <>
                                        <button
                                            className={getActionButtonClass('default')}
                                            onClick={handleSelectAll}
                                            disabled={isProcessing}
                                        >
                                            <span>{selectedPlayers.size === displayedPlayers.length ? 'Deselect All' : 'Select All'}</span>
                                        </button>

                                        {selectedPlayers.size > 0 && (
                                            <>
                                                <button
                                                    className={getActionButtonClass('primary')}
                                                    onClick={() => handleBulkSwitch()}
                                                    disabled={isProcessing}
                                                >
                                                    <FontAwesomeIcon icon={type === "active" ? faUserMinus : faUserPlus} />
                                                    <DestinationLabel />
                                                </button>
                                                <button
                                                    className={getActionButtonClass('danger')}
                                                    onClick={() => handleBulkDelete()}
                                                    disabled={isProcessing}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                    <span>Delete</span>
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className={getActionButtonClass('default')}
                                            onClick={toggleSelectionMode}
                                            disabled={isProcessing}
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                            <span>Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className={getActionButtonClass('default')}
                                        onClick={toggleSelectionMode}
                                    >
                                        <span>Select Players</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {displayedPlayers.map((player) => (
                                <motion.div
                                    layout
                                    key={player.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={(e) => handleCardClick(player, e)}
                                    className={`relative bg-[#6a33a15c] rounded-xl border shadow-md p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 
                                        ${selectionMode ? 'hover:bg-indigo-900/60' : 'hover:bg-indigo-900/40'}
                                        ${selectedPlayers.has(player.id)
                                            ? 'bg-indigo-800/60 border-indigo-400/50 shadow-lg shadow-indigo-900/20'
                                            : 'border-white/10'}`
                                    }
                                >
                                    {/* Selection indicator */}
                                    {selectionMode && (
                                        <div className="absolute top-3 right-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200
                                                ${selectedPlayers.has(player.id)
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-indigo-800/50 border border-indigo-500/30'}`}
                                            >
                                                {selectedPlayers.has(player.id) && (
                                                    <FontAwesomeIcon icon={faCheck} size="xs" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {player.player_name}
                                        </h3>
                                        {Array.isArray(tournament?.skill_fields) && player.skills.length > 0 &&
                                            tournament.skill_fields.map((skill, index) => (
                                                <div
                                                    key={index}
                                                    className={`mb-2 flex items-start ${sortConfig?.skillIndex === index ? 'bg-indigo-900/80 -mx-2 px-2 py-1 rounded-md' : ''}`}
                                                >
                                                    
                                                    {player.skills[index]?.type === "numeric" ? (
                                                        <div className="flex items-center">
                                                            <h1 className="text-xs text-gradient-to-r from-purple-400 to-indigo-400">
                                                                <span className="text-purple-200/80 text-sm mr-2">{skill.name}:</span> {player.skills[index]?.value}
                                                            </h1>
                                                            {/* <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center mr-2 border border-indigo-500/30">
                                                                <span className="text-xs font-medium">{player.skills[index]?.value}</span>
                                                            </div>
                                                            <div
                                                                className="h-2 rounded-full w-[5rem] bg-gradient-to-r from-purple-400 to-indigo-400"
                                                            ></div> */}
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-800/50 border border-indigo-700/50">
                                                            <span className="text-purple-200/80 text-sm mr-2">{skill.name}:</span> {player.skills[index]?.category_type}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {displayedPlayers.length === 0 && (
                        <div className="text-center my-8 p-6 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
                            <p className="text-purple-200">No players match the current sorting criteria.</p>
                        </div>
                    )}

                    {canDelete && players.length > 0 && !selectionMode && (
                        <div className="text-center mt-6 text-purple-200/60 text-sm">
                            {type === "active"
                                ? "Click on a player card to view details or use 'Select Players' to manage multiple players"
                                : "Click on a waitlisted player to view details or select players to move them to the active list"}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};