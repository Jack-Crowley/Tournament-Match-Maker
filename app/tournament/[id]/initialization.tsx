"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEye, faTrash, faGear } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { useMessage } from '@/context/messageContext';
import { createClient } from "@/utils/supabase/client";
import QRCode from "react-qr-code";
import { useParams, useRouter } from 'next/navigation';
import { useClient } from "@/context/clientContext";
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { BracketPlayer, Matchup } from "@/types/bracketTypes";
import { Player } from "@/types/playerTypes";
import { TournamentModal } from "@/components/modals/tournamentEditModal";
import { PlayerModal } from "@/components/modals/editPlayersModal";
import { AddPlaceholderPlayersModal } from "@/components/modals/addGeneratedPlayers";
import { Checkbox } from "@/components/checkbox";
import { PlayersTable } from "@/components/playersTable";
import { ConfirmModal, ConfirmModalInformation } from "@/components/modals/confirmationModal";

export default function Initialization({refreshTournament}:{refreshTournament : () => void}) {
    const supabase = createClient();
    const client = useClient();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [director, setDirector] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [joinLink, setJoinLink] = useState<null | string>(null);

    const [confirmModalInfo, setConfirmModalInfo] = useState<ConfirmModalInformation | null>(null)

    const [activePlayers, setActivePlayers] = useState<Player[]>([]);
    const [waitlistedPlayers, setWaitlistedPlayers] = useState<Player[]>([]);

    const [selectedActivePlayers, setSelectedActivePlayers] = useState<Set<string>>(new Set());
    const [selectedWaitlistedPlayers, setSelectedWaitlistedPlayers] = useState<Set<string>>(new Set());

    const [isTournamentEditModalOpen, setIsTournamentEditModalOpen] = useState<boolean>(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isPlaceholderPlayersModalOpen, setIsPlaceholderPlayersModalOpen] = useState<boolean>(false);
    const [playerForModal, setPlayerForModal] = useState<null | Player>();
    const [isPlayerModalOpen, setPlayerModalOpen] = useState<boolean>(false);
    const { triggerMessage } = useMessage();
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    
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
                setJoinLink(window.location.origin + "/tournament/join/" + data.join_code);
            }

            const { data: data1, error: error1 } = await supabase
                .from('tournament_players')
                .select('*')
                .eq('tournament_id', id);

            if (error1) {
                triggerMessage("Error fetching players data: " + error1.message, "red");
            } else {
                setActivePlayers(data1.filter(player => player.type == "active"));
                setWaitlistedPlayers(data1.filter(player => player.type == "waitlist"));
            }

            const uuid = client.session?.user.id;

            if (data && uuid == data.owner) {
                setDirector(true);
            }

            setLoading(false);
        };

        fetchData();
    }, [id, supabase, client]);

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

        if (tournament.max_players && activePlayers.length > tournament.max_players) {
            const waitlistSwitchConfirm: ConfirmModalInformation = {
                title: "Are you sure you want to do this?",
                content: `You have exceeded the maximum players defined by the tournament rules, are you sure you want to continue?`,
                onCancel: () => { setConfirmModalInfo(null) },
                onSuccess: StartTournamentAfterModal
            }

            setConfirmModalInfo(waitlistSwitchConfirm)
            return;
        }

        StartTournamentAfterModal()
    };

    async function StartTournamentAfterModal() {
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
                const { error } = await supabase
                    .from('tournaments')
                    .update({ status: "started" })
                    .eq('id', id);

                if (error) {
                    triggerMessage("Error updating tournament: " + error.message, "red");
                } else {
                    setTournament({ ...tournament, status: "started" });
                    setupBracket();
                }
            } else {
                triggerMessage(result.error, "red");
            }
        } catch {
            triggerMessage("An error occurred while starting the tournament", "red");
        }

        setConfirmModalInfo(null)
    }

    const setupBracket = async () => {
        if (!tournament) return;

        console.log("setting up bracket!!!", activePlayers);

        const formattedPlayers: BracketPlayer[] = activePlayers.map(player => ({
            uuid: player.member_uuid,
            name: player.player_name || "Unknown",
            email: player.email || "",
            account_type: player.is_anonymous ? "anonymous" : "logged_in",
            score: Number(player.skills?.score) || 0,
        }));
        console.log("setting up bracket now with players: ", formattedPlayers)


        function seedPlayers(playersToSeed: BracketPlayer[]) {
            return [...playersToSeed].sort((a, b) => {

                return (b.score ?? 0) - (a.score ?? 0); // Sort players by score in descending order
            });
        }


        function generateMatchups(players: BracketPlayer[]) {
            if (!tournament) return [];
            const seededPlayers = seedPlayers(players);
            const matchups: Matchup[] = [];
            const totalPlayers = seededPlayers.length;

            for (let i = 0; i < totalPlayers; i += 2) {
                const player1 = seededPlayers[i];
                const player2 = seededPlayers[i + 1] || {
                    uuid: "",
                    name: "",
                    account_type: "placeholder",
                    placeholder_player: true,
                };

                matchups.push({
                    match_number: i / 2 + 1,
                    players: [player1, player2],
                    round: 1,
                    tournament_id: Number(tournament.id),
                    id: -1,
                });
            }

            return matchups;
        }

        const saveMatchupsToDatabase = async (matchups: any[]) => {
            const { data, error } = await supabase
                .from("tournament_matches")
                .insert(matchups.map(match => ({
                    tournament_id: tournament.id,
                    round: match.round,
                    match_number: match.match_number,
                    players: match.players,
                })));

            if (error) {
                console.error("Error saving matchups in saveMatchupstoDB:", error);
            } else {
                console.log("Matchups saved successfully!", data);
                refreshTournament()
            }
        }

        const generatedMatchups = generateMatchups(formattedPlayers);
        console.log("here are our generated matchups: ", generatedMatchups);
        saveMatchupsToDatabase(generatedMatchups);
    }

    return (
        <div className="relative min-h-screen mt-10 mx-8 p-6 text-white" style={{ backgroundColor: "#160A3A" }}>
            {loading ? (
                <SpinningLoader />
            ) : (
                <div>
                    <ConfirmModal information={confirmModalInfo} />
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

                            <PlayersTable players={activePlayers} otherPlayers={waitlistedPlayers} setPlayers={setActivePlayers} setOtherPlayers={setWaitlistedPlayers} type="active" tournament={tournament} />
                            <PlayersTable players={waitlistedPlayers} otherPlayers={activePlayers} setPlayers={setWaitlistedPlayers} setOtherPlayers={setActivePlayers} type="waitlist" tournament={tournament} />

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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}