"use client";

import { Player } from "@/types/playerTypes";
import { Checkbox, CheckboxWithEvent } from "./checkbox";
import { useEffect, useState } from "react";
import { useMessage } from "@/context/messageContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { PlayerModal } from "./modals/editPlayersModal";
import { ConfirmModal, ConfirmModalInformation } from "./modals/confirmationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUserClock, faUserMinus, faUserPlus, faUsers } from "@fortawesome/free-solid-svg-icons";
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
    const { triggerMessage } = useMessage();
    const supabase = createClient();

    useEffect(() => {
        setCanDelete(permission_level == "admin" || permission_level == "owner");
    }, [permission_level]);

    const handleSelectPlayer = (playerId: string) => {
        const newSelectedPlayers = new Set(selectedPlayers);
        if (newSelectedPlayers.has(playerId)) {
            newSelectedPlayers.delete(playerId);
        } else {
            newSelectedPlayers.add(playerId);
        }
        setSelectedPlayers(newSelectedPlayers);
    };

    const handleBulkDelete = async () => {
        if (selectedPlayers.size === 0) {
            triggerMessage("No players selected", "red");
            return;
        }

        const { error } = await supabase
            .from("tournament_players")
            .delete()
            .in("id", Array.from(selectedPlayers));

        if (error) {
            triggerMessage("Error deleting players", "red");
        } else {
            triggerMessage("Players deleted successfully", "green");
            setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
            setSelectedPlayers(new Set());
        }
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

        const attemptSwitch = async () => {
            const res = await fetch("/api/tournament/bulk-switch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                triggerMessage(result.error || "Something went wrong", "red");
                return;
            }

            triggerMessage(`Players moved to ${newType} successfully`, "green");

            setOtherPlayers(prev => [...prev, ...players.filter(p => selectedPlayers.has(p.id))]);
            setPlayers(players.filter(p => !selectedPlayers.has(p.id)));
            setSelectedPlayers(new Set());
        };

        const res = await fetch("/api/tournament/bulk-switch", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.status === 409 && result.warning) {
            const confirmModal: ConfirmModalInformation = {
                title: "Are you sure you want to do this?",
                content: `Switching ${playerIDs.length > 1 ? `these ${playerIDs.length} players` : "this 1 player"} over to the active players table would violate the maximum players constraint.`,
                onCancel: () => setConfirmModalInfo(null),
                onSuccess: async () => {
                    await attemptSwitch();
                    setConfirmModalInfo(null);
                },
            };

            setConfirmModalInfo(confirmModal);
            return;
        }

        if (!res.ok) {
            triggerMessage(result.error || "Something went wrong", "red");
            return;
        }

        triggerMessage(`Players moved to ${newType} successfully`, "green");
        setOtherPlayers(prev => [...prev, ...players.filter(p => selectedPlayers.has(p.id))]);
        setPlayers(players.filter(p => !selectedPlayers.has(p.id)));
        setSelectedPlayers(new Set());
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
                        <h2 className="text-xl font-bold flex items-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                <FontAwesomeIcon
                                    icon={type === "active" ? faUsers : faUserClock}
                                    className="text-purple-200"
                                />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r text-white">
                                {type === "active" ? "Registered Players" : "Waitlist"}
                                <span className="ml-2 text-lg">({players.length})</span>
                            </span>
                        </h2>

                        {canDelete && selectedPlayers.size > 0 && (
                            <div className="flex space-x-3">
                                <button
                                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 transition-colors rounded-lg flex items-center justify-center gap-2 text-purple-200 border border-indigo-600/30"
                                    onClick={() => handleBulkSwitch()}
                                >
                                    <FontAwesomeIcon icon={type === "active" ? faUserMinus : faUserPlus} />
                                    <span>{type === "active" ? "Move to Waitlist" : "Move to Active"}</span>
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 transition-colors rounded-lg flex items-center justify-center gap-2 text-red-200 border border-red-600/30"
                                    onClick={() => handleBulkDelete()}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`bg-[#6a33a15c] rounded-xl border border-white/10 shadow-md p-4 flex flex-col justify-between cursor-pointer hover:bg-indigo-900/50 transition-colors duration-150 ${selectedPlayers.has(player.id) ? "bg-indigo-600" : ""
                                    }`}
                            >
                                <div>
                                    {canDelete && (
                                        <div className="top-2 right-2">
                                            <CheckboxWithEvent
                                                checked={selectedPlayers.has(player.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectPlayer(player.id);
                                                }}
                                                deep={true}
                                            />
                                        </div>
                                    )}
                                    <h3
                                        className="text-lg font-semibold text-white mb-2 cursor-pointer"
                                        onClick={() => setModalPlayer(player)}
                                    >
                                        {player.player_name}
                                    </h3>
                                    {Array.isArray(tournament?.skill_fields) &&
                                        tournament.skill_fields.map((skill, index) => (
                                            <div key={index} className="mb-1">
                                                <span className="text-purple-200/80 text-sm">{skill.name}:</span>
                                                {player.skills[index]?.type === "numeric" ? (
                                                    <div className="flex items-center ml-2">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-600/20 flex items-center justify-center mr-1">
                                                            <span className="text-xs font-medium">{player.skills[index]?.value}</span>
                                                        </div>
                                                        <div className="w-16 bg-indigo-900/30 rounded-full h-1">
                                                            <div
                                                                className="h-1 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400"
                                                                style={{ width: `${(player.skills[index]?.value / 10) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-800/30 border border-indigo-800/50">
                                                        {player.skills[index]?.category_type}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                </div>

                                <div className="mt-4 flex justify-end">
                                    
                                </div>
                            </div>
                        ))}
                    </div>

                    {canDelete && players.length > 0 && selectedPlayers.size === 0 && (
                        <div className="text-center mt-8 text-purple-200/60 text-sm">
                            Click on a player to edit details or select players to perform actions
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};