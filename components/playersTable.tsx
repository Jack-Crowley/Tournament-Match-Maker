"use client";

import { Player } from "@/types/playerTypes";
import { Checkbox, CheckboxWithEvent } from "./checkbox";
import { useEffect, useState } from "react";
import { useMessage } from "@/context/messageContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { PlayerModal } from "./modals/editPlayersModal";
import { ConfirmModal, ConfirmModalInformation } from "./modals/confirmationModal";

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
                <div className={`mb-6 ${type == "active" ? "" : "mt-12"} mx-auto`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[#7458da] font-bold text-2xl">{type == "active" ? "Registered Players" : "Waitlist"}</h2>
                        {canDelete && (
                            <div className="space-x-4">
                                <button
                                    className={`px-4 py-2 border-2 transition-all duration-300 ease-in-out rounded-lg text-white ${selectedPlayers.size > 0
                                        ? "bg-[#1f1f1f] border-[#222222] hover:bg-[#171717] hover:border-[#171717]"
                                        : "border-[#000000] bg-[#1717178d] cursor-not-allowed"
                                        }`}
                                    onClick={() => handleBulkSwitch()}
                                >
                                    {type == "active" ? "Move to Waitlist" : "Move to active"}
                                </button>
                                <button
                                    className={`px-4 py-2 border-2 transition-all duration-300 ease-in-out rounded-lg text-white ${selectedPlayers.size > 0
                                        ? "bg-[#c02a2a] border-[#c02a2a] hover:bg-[#a32424] hover:border-[#a32424]"
                                        : "border-[#c02a2a8b] bg-[#4512127b] cursor-not-allowed"
                                        }`}
                                    onClick={() => handleBulkDelete()}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <table className="w-full mx-auto bg-deep rounded-lg shadow-lg">
                        <thead className="bg-[#1b113d]">
                            <tr>
                                {canDelete && (
                                    <th className="p-3 text-left text-white w-10">
                                        <Checkbox deep={true} checked={selectedPlayers.size === players.length} onChange={() => {
                                            if (selectedPlayers.size !== players.length) {
                                                setSelectedPlayers(new Set(players.map(player => player.id)));
                                            } else {
                                                setSelectedPlayers(new Set());
                                            }
                                        }} />
                                    </th>
                                )}
                                <th className="p-3 text-left text-white">Name</th>
                                {Array.isArray(tournament?.skill_fields) && tournament.skill_fields.map((skill, index) => (
                                    <th key={index} className="p-3 text-left text-white">
                                        {skill.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {players.map(player => (
                                <tr
                                    key={player.id}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).tagName !== "INPUT") {
                                            setModalPlayer(player);
                                        }
                                    }}
                                    className="hover:bg-[#2a1b5f] bg-[#22154F] transition-colors duration-50 cursor-pointer"
                                >
                                    {canDelete && (
                                        <td className="p-3">
                                            <CheckboxWithEvent checked={selectedPlayers.has(player.id)} onChange={(e) => {
                                                e.stopPropagation();
                                                handleSelectPlayer(player.id);
                                            }} />
                                        </td>
                                    )}
                                    <td className="p-3 text-white">{player.player_name}</td>
                                    {Array.isArray(tournament?.skill_fields) && tournament.skill_fields.map((skill, index) => (
                                        <td key={index} className="p-3">
                                            {player.skills[index].type === "numeric" ? player.skills[index].value : player.skills[index].category_type}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
