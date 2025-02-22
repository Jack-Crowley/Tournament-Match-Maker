"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEye, faTrash, faGear } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useMessage } from '@/context/messageContext';
import { createClient } from "@/utils/supabase/client";
import QRCode from "react-qr-code";
import { useParams } from 'next/navigation';
import { useClient } from "@/context/clientContext";
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { Player } from "@/types/playerTypes";
import { TournamentModal } from "@/components/modals/tournamentEditModal";
import { PlayerModal } from "@/components/modals/editPlayersModal";
import { AddPlaceholderPlayersModal } from "@/components/modals/addGeneratedPlayers";
import { Checkbox } from "@/components/checkbox";

export default function Initialization() {
    const supabase = createClient();
    const client = useClient();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [director, setDirector] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [joinLink, setJoinLink] = useState<null | string>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isTournamentEditModalOpen, setIsTournamentEditModalOpen] = useState<boolean>(false);
    const [contextMenu, setContextMenu] = useState<any>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
    const [isPlaceholderPlayersModalOpen, setIsPlaceholderPlayersModalOpen] = useState<boolean>(false);
    const [playerForModal, setPlayerForModal] = useState<null | Player>();
    const [isPlayerModalOpen, setPlayerModalOpen] = useState<boolean>(false);
    const { triggerMessage } = useMessage();
    const params = useParams();
    const id = params.id;

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                triggerMessage("Error fetching tournament data: " + error.message, "red");
            } else {
                setTournament(data);
                setJoinLink(window.location.href + "?join=" + data.join_code);
            }

            const { data: data1, error: error1 } = await supabase
                .from('tournament_players')
                .select('*')
                .eq('tournament_id', id);

            if (error1) {
                triggerMessage("Error fetching players data: " + error1.message, "red");
            } else {
                setPlayers(data1);
            }

            const uuid = client.session?.user.id;

            if (data && uuid == data.owner) {
                setDirector(true);
            }

            setLoading(false);
        };

        fetchData();
    }, [id, supabase, triggerMessage, client]);

    const handleAllowJoinToggle = async () => {
        if (!tournament) return;

        const { error } = await supabase
            .from('tournaments')
            .update({ allow_join: !tournament.allow_join })
            .eq('id', id);

        if (error) {
            triggerMessage("Error updating tournament: " + error.message, "red");
        } else {
            setTournament({ ...tournament, allow_join: !tournament.allow_join });
        }
    };

    const handleCopyUrl = () => {
        if (joinLink == null) return;

        navigator.clipboard.writeText(joinLink);
        triggerMessage("URL copied to clipboard!", "green");
    };

    const handleRightClick = (event: any, player: any) => {
        event.preventDefault();

        const navbar = document.getElementById("navbar"); // Assuming your navbar has this ID
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        console.log(navbarHeight)

        setContextMenu({
            x: event.pageX,
            y: event.pageY - navbarHeight * 1.5,
            player,
        });

        setPlayerForModal(player);
    };

    const handleDeletePlayers = async () => {
        if (!playerForModal) {
            triggerMessage("Player is not loaded", "red");
            return;
        }

        const { error } = await supabase
            .from('tournament_players')
            .delete()
            .eq('id', playerForModal.id);

        if (error) {
            triggerMessage("Error deleting player", "red");
        } else {
            triggerMessage("Player deleted successfully", "green");
        }

        setContextMenu(null);
    };

    const handleCloseMenu = () => setContextMenu(null);

    const Button = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
        <button
            className="bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
            onClick={onClick}
        >
            {children}
        </button>
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                // Close the currently open modal
                if (isTournamentEditModalOpen) setIsTournamentEditModalOpen(false);
                if (isPlayerModalOpen) setPlayerModalOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isTournamentEditModalOpen, isPlayerModalOpen]);

    const TimezoneConversion = (date: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - new Date().getTimezoneOffset());
        return d;
    };

    const handleStartTournament = async () => {
        if (!tournament) return;

        try {
            const response = await fetch('/api/tournament/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tournament_id: tournament.id }),
            });

            const result = await response.json();

            if (response.ok) {
                triggerMessage(result.message, "green");
            } else {
                triggerMessage(result.error, "red");
            }
        } catch (error) {
            triggerMessage("An error occurred while starting the tournament", "red");
        }
    };

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
            .from('tournament_players')
            .delete()
            .in('id', Array.from(selectedPlayers));

        if (error) {
            triggerMessage("Error deleting players", "red");
        } else {
            triggerMessage("Players deleted successfully", "green");
            setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
            setSelectedPlayers(new Set());
        }
    };

    return (
        <div className="relative min-h-screen mt-10 mx-8 p-6 text-white" style={{ backgroundColor: "#160A3A" }}>
            {loading ? (
                <SpinningLoader />
            ) : (
                <div>
                    {tournament && (
                        <div>
                            {/* Tournament Header with Gear Icon */}
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-[#7458da] font-bold text-3xl">{tournament?.name}</h1>
                                {director && (
                                    <button
                                        onClick={() => setIsTournamentEditModalOpen(true)}
                                        className="text-[#7458da] hover:text-[#604BAC] transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faGear} size="lg" />
                                    </button>
                                )}
                            </div>

                            {/* Tournament Details */}
                            <div className="space-y-4 mb-8">
                                {tournament.description && (
                                    <div className="text-center text-gray-300">
                                        {tournament.description}
                                    </div>
                                )}

                                {tournament.location && (
                                    <div className="text-center text-gray-300">
                                        Location: {tournament.location}
                                    </div>
                                )}

                                {tournament.start_time && (
                                    <div className="text-center text-gray-300">
                                        <strong>Start Time:</strong> {TimezoneConversion(tournament.start_time).toLocaleString('en-US')}
                                    </div>
                                )}

                                {tournament.end_time && (
                                    <div className="text-center text-gray-300">
                                        <strong>End Time:</strong> {TimezoneConversion(tournament.end_time).toLocaleString('en-US')}
                                    </div>
                                )}
                            </div>

                            {/* Player Joining Section */}
                            {director && (
                                <div className="mb-8">
                                    <h2 className="text-[#7458da] font-bold text-2xl mb-4 text-center">Player Joining</h2>

                                    {tournament.max_players && (
                                        <div className="text-center text-gray-300 mb-4">
                                            Maximum Players: {tournament.max_players}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center mb-4">
                                        <span className="text-white mr-2">Allow People to Join</span>
                                        <motion.div
                                            className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer ${tournament?.allow_join ? "justify-end" : "justify-start"}`}
                                            onClick={handleAllowJoinToggle}
                                            initial={false}
                                            animate={{
                                                background: tournament?.allow_join
                                                    ? "linear-gradient(45deg, #7458da, #cec5eb)"
                                                    : "linear-gradient(45deg, #3A3A3A, #5C5C5C)",
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <motion.div
                                                className="w-4 h-4 bg-white rounded-full"
                                                layout
                                                transition={{ type: "spring", stiffness: 200, damping: 30 }}
                                            />
                                        </motion.div>
                                    </div>

                                    {joinLink && tournament.allow_join && (
                                        <div className="text-center">
                                            <label className="text-white block text-sm mb-2">Join Code/URL</label>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="text"
                                                    value={joinLink}
                                                    readOnly
                                                    className="w-full max-w-md p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] rounded-lg"
                                                />
                                                <Button onClick={handleCopyUrl}>
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {joinLink && tournament.allow_join && (
                                        <div className="text-center mt-4">
                                            <label className="text-white block text-sm mb-2">QR Code</label>
                                            <div className="p-4 bg-[#a968b942] rounded-lg inline-block">
                                                <QRCode value={joinLink} size={128} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Registered Players Section */}
                            {players.length > 0 && (
                                <div className="mb-6 mt-16" onClick={handleCloseMenu}>
                                    <h2 className="text-[#7458da] font-bold text-2xl mb-4 text-center">Registered Players</h2>

                                    <table className="w-full max-w-4xl mx-auto bg-deep rounded-lg shadow-lg">
                                        <thead className="bg-[#7458da]">
                                            <tr>
                                                <th className="p-3 text-left text-white">
                                                    <Checkbox deep={true} checked={selectedPlayers.size === players.length} onChange={() => {
                                                        if (selectedPlayers.size != players.length) {
                                                            setSelectedPlayers(new Set(players.map(player => player.id)));
                                                        } else {
                                                            setSelectedPlayers(new Set());
                                                        }
                                                    }} />
                                                </th>

                                                <th className="p-3 text-left text-white">Name</th>
                                                {tournament?.skill_fields.map((skill, index) => (
                                                    <th key={index} className="p-3 text-left text-white">{skill}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {players.map((player) => (
                                                <tr
                                                    key={player.id}
                                                    className={`hover:bg-secondary ${playerForModal && playerForModal.id == player.id ? "bg-[#604BAC]" : ""} transition-colors duration-50 cursor-pointer`}
                                                    onContextMenu={(e) => handleRightClick(e, player)}
                                                >
                                                    <td className="p-3">
                                                        <Checkbox
                                                            checked={selectedPlayers.has(player.id)}
                                                            onChange={() => handleSelectPlayer(player.id)}
                                                        />
                                                    </td>
                                                    <td className={`p-3 ${player.anonymous ? "text-white" : "text-[#c8c8c8]"}`}>{player.player_name}</td>
                                                    {tournament?.skill_fields.map((skill, index) => (
                                                        <td key={index} className="p-3">{player.skills[skill] ? player.skills[skill] : "N/A"}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {selectedPlayers.size > 0 && (
                                        <div className="m-4 flex w-full mt-4 justify-center">
                                            <button
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                                onClick={handleBulkDelete}
                                            >
                                                Delete Selected
                                            </button>
                                        </div>
                                    )}

                                    {contextMenu && (
                                        <motion.ul
                                            className="absolute block bg-[#2b1668] text-white shadow-lg rounded-lg w-40"
                                            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <li
                                                className="flex items-center gap-2 p-3 hover:bg-[#604BAC] cursor-pointer"
                                                onClick={() => {
                                                    setPlayerModalOpen(true);
                                                    setPlayerForModal(contextMenu.player);
                                                    handleCloseMenu();
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEye} /> View Information
                                            </li>
                                            <li
                                                className="flex items-center gap-2 p-3 hover:bg-[#604BAC] cursor-pointer text-red-500"
                                                onClick={() => {
                                                    handleDeletePlayers();
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} /> Delete
                                            </li>
                                        </motion.ul>
                                    )}
                                </div>
                            )}

                            {players.length == 0 && (
                                <h2 className="text-[#604BAC] font-bold text-2xl mb-4 mt-12 text-center">No Registered Players</h2>
                            )}

                            {director && (
                                <div className="flex justify-center mt-8 space-x-4">
                                    <button
                                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                                        onClick={() => { setIsPlaceholderPlayersModalOpen(true) }}
                                    >
                                        Add Placeholder Players
                                    </button>
                                    <button
                                        className="bg-[#7458da] text-white px-6 py-3 rounded-lg hover:bg-[#604BAC] transition-colors"
                                        onClick={handleStartTournament}
                                    >
                                        Start Tournament
                                    </button>
                                </div>
                            )}

                            <TournamentModal
                                isOpen={isTournamentEditModalOpen}
                                onClose={() => setIsTournamentEditModalOpen(false)}
                                tournament={tournament}
                                setTournament={setTournament}
                            />
                            <AddPlaceholderPlayersModal isOpen={isPlaceholderPlayersModalOpen} setOpen={setIsPlaceholderPlayersModalOpen} tournament={tournament} />
                            {playerForModal && (
                                <PlayerModal
                                    isOpen={isPlayerModalOpen}
                                    onClose={() => setPlayerModalOpen(false)}
                                    playerForModal={playerForModal}
                                    tournament={tournament}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}