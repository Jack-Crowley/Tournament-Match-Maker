"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCopy,
    faGear,
    faQrcode,
    faUsers,
    faCalendarAlt,
    faMapMarkerAlt,
    faInfoCircle,
    faDownload,
    faPlay,
    faUserPlus,
    faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { useMessage } from '@/context/messageContext';
import { createClient } from "@/utils/supabase/client";
import QRCode from "react-qr-code";
import { useParams } from 'next/navigation';
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { BracketPlayer, Matchup, PlayerSkill } from "@/types/bracketTypes";
import { Player } from "@/types/playerTypes";
import { TournamentModal } from "@/components/modals/tournamentEditModal";
import { AddPlaceholderPlayersModal } from "@/components/modals/addGeneratedPlayers";
import { PlayersTable } from "@/components/playersTable";
import { ConfirmModal, ConfirmModalInformation } from "@/components/modals/confirmationModal";
import { User } from "@/types/userType";
import { ConfigureRoundRobin } from "@/matching/robin";
import { SingleSettings, SwissSettings } from '@/types/tournamentTypes';
import { ConfigureSwissStyleTournament } from "@/matching/swiss";

export default function Initialization({ refreshTournament, user }: { user: User, refreshTournament: () => void }) {
    const supabase = createClient();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [joinLink, setJoinLink] = useState<null | string>(null);
    const [showQRCode, setShowQRCode] = useState<boolean>(false);
    const [starting, setStarting] = useState<boolean>(false);

    const [confirmModalInfo, setConfirmModalInfo] = useState<ConfirmModalInformation | null>(null);
    const [activePlayers, setActivePlayers] = useState<Player[]>([]);
    const [waitlistedPlayers, setWaitlistedPlayers] = useState<Player[]>([]);

    const [isTournamentEditModalOpen, setIsTournamentEditModalOpen] = useState<boolean>(false);
    const [isPlaceholderPlayersModalOpen, setIsPlaceholderPlayersModalOpen] = useState<boolean>(false);
    const [isPlayerModalOpen, setPlayerModalOpen] = useState<boolean>(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();
    const params = useParams();
    const tournament_id = params.id;
    const qrRef = useRef<HTMLDivElement>(null);

    const downloadQRCode = () => {
        if (!qrRef.current || !tournament) return;

        const svg = qrRef.current.querySelector('svg');

        if (svg) {
            const svgClone = svg.cloneNode(true);

            const svgData = new XMLSerializer().serializeToString(svgClone);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const img = new Image();

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            if (!ctx) {
                return;
            }

            img.onload = () => {
                // Set canvas size to match SVG
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0);

                const pngUrl = canvas.toDataURL('image/png');

                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `tournament-qr-code.png`;

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                URL.revokeObjectURL(url);
            };

            img.src = url;
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('id', tournament_id)
                    .single();


                // Validate skill_fields
                if (!Array.isArray(data.skill_fields)) {
                    console.error("Invalid skill_fields format:", data.skill_fields);
                    data.skill_fields = []; // Prevents React from breaking
                }

                if (error) {
                    triggerMessage("Error fetching tournament data: " + error.message, "red");
                } else {
                    setTournament(data);
                    setJoinLink(window.location.origin + "/tournament/join/" + data.join_code);
                }
            } catch (error) {
                triggerMessage("An unexpected error occurred", "red");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const fetchPlayers = async () => {
            try {
                const { data, error } = await supabase
                    .from('tournament_players')
                    .select('*')
                    .eq('tournament_id', tournament_id);

                if (error) {
                    triggerMessage("Error fetching players data: " + error.message, "red");
                } else {
                    setActivePlayers(data.filter(player => player.type === "active"));
                    setWaitlistedPlayers(data.filter(player => player.type === "waitlist"));
                }
            } catch (error) {
                triggerMessage("An unexpected error occurred", "red");
                console.error(error);
            }
        };

        fetchPlayers();

        // **Subscribe to real-time updates**
        const subscription = supabase
            .channel(`tournament-players-${tournament_id}`)
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to all insert/update/delete events
                    schema: "public",
                    table: "tournament_players",
                    filter: `tournament_id=eq.${tournament_id}`
                },
                async () => {
                    fetchPlayers(); // Refresh players after each change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournament_id, supabase]);

    const handleAllowJoinToggle = async () => {
        if (!tournament) return;

        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ allow_join: !tournament.allow_join })
                .eq('id', tournament_id);

            if (error) {
                triggerMessage("Error updating tournament: " + error.message, "red");
            } else {
                setTournament({ ...tournament, allow_join: !tournament.allow_join });
                triggerMessage(`Player joining ${tournament.allow_join ? 'disabled' : 'enabled'}`, "green");
            }
        } catch {
            triggerMessage("An error occurred while updating settings", "red");
        }
    };

    const handleCopyUrl = () => {
        if (joinLink == null) return;

        navigator.clipboard.writeText(joinLink);
        triggerMessage("Join URL copied to clipboard!", "green");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                if (isTournamentEditModalOpen) setIsTournamentEditModalOpen(false);
                if (isPlayerModalOpen) setPlayerModalOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isTournamentEditModalOpen, isPlayerModalOpen]);

    const formatDateTime = (date: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - new Date().getTimezoneOffset());
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleStartTournament = async () => {
        if (starting) return;

        setStarting(true)

        if (!tournament) return;

        if (tournament.max_players && activePlayers.length > tournament.max_players) {
            const waitlistSwitchConfirm: ConfirmModalInformation = {
                title: "Maximum Player Limit Exceeded",
                content: `You currently have ${activePlayers.length} active players, which exceeds the tournament limit of ${tournament.max_players}. Would you like to continue anyway?`,
                onCancel: () => { setConfirmModalInfo(null) },
                onSuccess: startTournamentAfterConfirmation
            };

            setConfirmModalInfo(waitlistSwitchConfirm);
            setStarting(false)
            return;
        }

        startTournamentAfterConfirmation();
    };

    const getMaxRounds = (numPlayers: number): number => {
        return Math.ceil(Math.log2(numPlayers));
    };

    async function startTournamentAfterConfirmation() {
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
                // triggerMessage(result.message, "green");
                const { error } = await supabase
                    .from('tournaments')
                    .update({ status: "started", max_rounds: getMaxRounds(activePlayers.length) })
                    .eq('id', tournament_id);

                if (error) {
                    triggerMessage("Error updating tournament: " + error.message, "red");
                } else {
                    setTournament({ ...tournament, status: "started" });

                    if (tournament.tournament_type == "single") {
                        const single = tournament.style_specific_settings as SingleSettings
                        setupBracket(single.sorting_algo, single.sorting_value);
                    }
                    else if (tournament.tournament_type == "robin") {
                        ConfigureRoundRobin(tournament, refreshTournament, triggerMessage)
                    }
                    else if (tournament.tournament_type == "swiss") {
                        const swiss = tournament.style_specific_settings as SwissSettings
                        ConfigureSwissStyleTournament(tournament, refreshTournament, triggerMessage, swiss.sorting_algo, swiss.sorting_value);
                    }
                }
            } else {
                triggerMessage(result.error, "red");
            }
        } catch (error) {
            triggerMessage("An error occurred while starting the tournament", "red");
            console.error(error);
        }

        setConfirmModalInfo(null);
    }

    const setupBracket = async (sorting_algo: "ranked" | "random" | "seeded", sorting_value: number) => {
        if (!tournament) return;

        const { data: tournamentPlayers, error: playerError } = await supabase
            .from('tournament_players')
            .select('*')
            .eq('tournament_id', tournament.id)
            .eq("type", "active");

        if (playerError || !tournamentPlayers?.length) {
            triggerMessage("Error! You have no players in the database!!!", "red");
            return;
        }

        const formattedPlayers: BracketPlayer[] = tournamentPlayers.map(player => {
            const formattedSkills: PlayerSkill[] = [];

            if (Array.isArray(tournament.skill_fields)) {
                tournament.skill_fields.forEach(skill => {
                    let skillValue: number = 0;
                    if (Array.isArray(player.skills)) {
                        const playerSkill = player.skills.find((s: { name: string }) => s.name === skill.name);
                        if (playerSkill) skillValue = playerSkill.value;
                    }
                    formattedSkills.push({ name: skill.name, type: skill.type, value: skillValue });
                });
            }

            return {
                uuid: player.member_uuid,
                name: player.player_name || "Unknown",
                email: player.email || "",
                account_type: player.is_anonymous ? "anonymous" : "logged_in",
                score: 0,
                skills: formattedSkills,
            };
        });

        function seedPlayers(players: BracketPlayer[]) {
            return [...players].sort((a: any, b: any) => {
                for (let i = 0; i < Math.min(a.skills?.length || 0, b.skills?.length || 0); i++) {
                    const aSkill = a.skills[i]?.value || 0;
                    const bSkill = b.skills[i]?.value || 0;
                    if (aSkill !== bSkill) return bSkill - aSkill;
                }
                return 0;
            });
        }

        function shuffleArray<T>(array: T[]): T[] {
            return [...array].sort(() => Math.random() - 0.5);
        }

        function sortPlayers(players: BracketPlayer[]): BracketPlayer[] {
            if (sorting_algo === "random") {
                return shuffleArray(players);
            } else if (sorting_algo === "seeded") {
                const seededGroups: BracketPlayer[] = [];
                const sorted = seedPlayers(players);
                for (let i = 0; i < sorted.length; i += sorting_value) {
                    const group = sorted.slice(i, i + sorting_value);
                    seededGroups.push(...shuffleArray(group));
                }
                return seededGroups;
            } else {
                // ranked (default)
                return seedPlayers(players);
            }
        }

        function generateMatchups(players: BracketPlayer[]): Matchup[] {
            const sortedPlayers = sortPlayers(players);
            const matchups: Matchup[] = [];
            const totalPlayers = sortedPlayers.length;


            if (tournament) {
                for (let i = 0; i < totalPlayers; i += 2) {
                    const player1 = sortedPlayers[i];
                    const player2 = sortedPlayers[i + 1] || {
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
                        is_tie:false
                    });
                }
            }

            return matchups;
        }

        const saveMatchupsToDatabase = async (matchups: Matchup[]) => {
            try {
                const { error } = await supabase
                    .from("tournament_matches")
                    .insert(matchups.map(match => ({
                        tournament_id: tournament.id,
                        round: match.round,
                        match_number: match.match_number,
                        players: match.players,
                    })));

                if (error) {
                    console.error("Error saving matchups:", error);
                    triggerMessage("Error creating tournament brackets", "red");
                } else {
                    triggerMessage("Tournament brackets created successfully", "green");
                    refreshTournament();
                }
            } catch (error) {
                console.error("Exception saving matchups:", error);
                triggerMessage("Error creating tournament brackets", "red");
            }
        };

        const generatedMatchups = generateMatchups(formattedPlayers);
        saveMatchupsToDatabase(generatedMatchups);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#160A3A] to-[#2A1A5E]">
                <SpinningLoader />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#160A3A] to-[#2A1A5E] text-white p-4">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-indigo-600/50 flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faTrophy} className="text-2xl text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
                    <p className="text-purple-200/80 mb-6">Unable to load tournament information.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#160A3A] to-[#2A1A5E] text-white py-10 px-4">
            <ConfirmModal information={confirmModalInfo} />

            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-4xl font-bold text-center md:text-left bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-300">
                            {tournament.name}
                        </h1>

                        {(user.permission_level === "owner" || user.permission_level === "admin") && (
                            <button
                                onClick={() => setIsTournamentEditModalOpen(true)}
                                className="bg-white/10 hover:bg-white/15 transition-colors p-2 rounded-lg flex items-center justify-center gap-2 px-4 text-purple-200 border border-white/10 shadow-md"
                            >
                                <span>Settings</span>
                                <FontAwesomeIcon icon={faGear} />
                            </button>
                        )}
                    </div>

                    {tournament.description && (
                        <div className="mt-4 text-purple-200/80 max-w-3xl">
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-purple-300 mt-1 mr-3" />
                                <p>{tournament.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tournament Details Card */}
                {(tournament.location || tournament.start_time || tournament.end_time || tournament.max_players) && (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FontAwesomeIcon icon={faInfoCircle} className="text-purple-300 mr-3" />
                            <span>Tournament Details</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tournament.location && (
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200/70">Location</p>
                                        <p className="text-white">{tournament.location}</p>
                                    </div>
                                </div>
                            )}

                            {tournament.start_time && (
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200/70">Start Time</p>
                                        <p className="text-white">{formatDateTime(tournament.start_time)}</p>
                                    </div>
                                </div>
                            )}

                            {tournament.end_time && (
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200/70">End Time</p>
                                        <p className="text-white">{formatDateTime(tournament.end_time)}</p>
                                    </div>
                                </div>
                            )}

                            {tournament.max_players && (
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faUsers} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200/70">Player Limit</p>
                                        <p className="text-white">{tournament.max_players} players</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Registration Section */}
                {(user.permission_level === "owner" || user.permission_level === "admin") && (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <FontAwesomeIcon icon={faPlay} className="text-purple-300 mr-3" />
                            <span>Joining</span>
                        </h2>

                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faUserPlus} className="text-purple-200" />
                                    </div>
                                    <span className="text-white">Allow Players to Join</span>
                                </div>

                                <motion.div
                                    className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer ${tournament.allow_join ? "justify-end" : "justify-start"}`}
                                    onClick={handleAllowJoinToggle}
                                    initial={false}
                                    animate={{
                                        background: tournament.allow_join
                                            ? "linear-gradient(45deg, #7458da, #8F78E6)"
                                            : "linear-gradient(45deg, #3A3A3A, #5C5C5C)",
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <motion.div
                                        className="w-4 h-4 bg-white rounded-full shadow-md"
                                        layout
                                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                                    />
                                </motion.div>
                            </div>
                        </div>

                        {joinLink && tournament.allow_join && (
                            <div className="space-y-6">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                                    <label className="text-sm text-purple-200/70 mb-2 block">Join Code</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={(tournament as any).join_code}
                                            readOnly
                                            className="w-full p-3 bg-[#22154F]/50 text-white focus:outline-none rounded-lg border border-white/5"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                                    <label className="text-sm text-purple-200/70 mb-2 block">Share Tournament Join Link</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={joinLink}
                                                readOnly
                                                className="flex-1 p-3 bg-[#22154F]/50 text-white focus:outline-none rounded-l-lg border border-white/5"
                                            />
                                            <button
                                                onClick={handleCopyUrl}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-r-lg transition duration-200 flex items-center justify-center"
                                            >
                                                <FontAwesomeIcon icon={faCopy} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowQRCode(!showQRCode)}
                                            className="bg-indigo-600/20 hover:bg-indigo-600/30 transition-colors p-2 rounded-lg flex items-center justify-center gap-2 px-4 text-white border border-indigo-600/30"
                                        >
                                            <span>{showQRCode ? "Hide QR" : "Show QR"}</span>
                                            <FontAwesomeIcon icon={faQrcode} />
                                        </button>
                                    </div>

                                    {showQRCode && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col items-center mt-6"
                                        >
                                            <div ref={qrRef} className="p-4 bg-white rounded-lg inline-block mb-4">
                                                <QRCode value={joinLink} size={160} />
                                            </div>

                                            <button
                                                onClick={downloadQRCode}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
                                            >
                                                <span>Download QR Code</span>
                                                <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Players Tables */}
                {(activePlayers.length > 0 || waitlistedPlayers.length > 0) && (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
                        <div className="mb-8">
                            <PlayersTable
                                players={activePlayers}
                                otherPlayers={waitlistedPlayers}
                                setPlayers={setActivePlayers}
                                setOtherPlayers={setWaitlistedPlayers}
                                type="active"
                                tournament={tournament}
                                permission_level={user.permission_level}
                            />
                        </div>

                        {waitlistedPlayers.length > 0 && (
                            <PlayersTable
                                players={waitlistedPlayers}
                                otherPlayers={activePlayers}
                                setPlayers={setWaitlistedPlayers}
                                setOtherPlayers={setActivePlayers}
                                type="waitlist"
                                tournament={tournament}
                                permission_level={user.permission_level}
                            />
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {(user.permission_level === "owner" || user.permission_level === "admin") && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                        <button
                            onClick={() => setIsPlaceholderPlayersModalOpen(true)}
                            className="w-full sm:w-auto bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-700/30"
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span>Add Placeholder Players</span>
                        </button>

                        <button
                            onClick={handleStartTournament}
                            disabled={starting}
                            className={`w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-700/30 ${starting ? 'opacity-75' : 'hover:translate-y-[-2px]'}`}
                        >
                            <FontAwesomeIcon icon={faPlay} />
                            <span>{starting ? "Starting..." : "Start Tournament"}</span>
                        </button>
                    </div>
                )}
            </div>

            <TournamentModal
                isOpen={isTournamentEditModalOpen}
                onClose={() => setIsTournamentEditModalOpen(false)}
                tournament={tournament}
                setTournament={setTournament}
            />

            <AddPlaceholderPlayersModal
                isOpen={isPlaceholderPlayersModalOpen}
                setOpen={setIsPlaceholderPlayersModalOpen}
                tournament={tournament}
                addActivePlayers={((players: any) => { setActivePlayers((prev) => [...prev, ...players]) })}
                addWaitlistPlayers={((players: any) => { setWaitlistedPlayers((prev) => [...prev, ...players]) })}
            />
        </div>
    );
}
