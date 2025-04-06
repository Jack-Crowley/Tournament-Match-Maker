"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faGear, faQrcode, faUsers, faCalendarAlt, faMapMarkerAlt, faInfoCircle, faDownload } from '@fortawesome/free-solid-svg-icons';
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
                console.log("Failed to load CTX")
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
            console.log("Fetching players...");
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
            console.log("Players fetched!");
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
                async (payload) => {
                    console.log("Realtime Update:", payload);
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
                triggerMessage(result.message, "green");
                const { error } = await supabase
                    .from('tournaments')
                    .update({ status: "started", max_rounds: getMaxRounds(activePlayers.length) })
                    .eq('id', tournament_id);

                if (error) {
                    triggerMessage("Error updating tournament: " + error.message, "red");
                } else {
                    setTournament({ ...tournament, status: "started" });

                    if (tournament.tournament_type == "single") {
                        setupBracket();
                    }
                    else if (tournament.tournament_type == "robin") {
                        ConfigureRoundRobin(tournament, refreshTournament, triggerMessage)
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

    const setupBracket = async () => {
        if (!tournament) return;

        const { data: tournamentPlayers, error: playerError } = await supabase
            .from('tournament_players')
            .select('*')
            .eq('tournament_id', tournament.id)
            .eq("type", "active");

        if (playerError) {
            triggerMessage("Error! You have no players in the database!!!", "red");
            return;
        }

        const formattedPlayers: BracketPlayer[] = tournamentPlayers.map(player => {
            const formattedSkills: PlayerSkill[] = [];
        
            if (Array.isArray(tournament.skill_fields)) {
                tournament.skill_fields.forEach(skill => {
                    let skillValue: number = 0; // Default for missing skills
        
                    if (Array.isArray(player.skills)) {
                        const playerSkill: PlayerSkill = player.skills.find((s: { name: string; }) => s.name === skill.name);
                        if (playerSkill) {
                            skillValue = playerSkill.value;
                        }
        
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
                skills: formattedSkills, // Store skills as structured objects
            };
        });


        function seedPlayers(playersToSeed: BracketPlayer[]) {
            return [...playersToSeed].sort((a, b) => {
                // go in order of the skills arra
                for (let i = 0; i < Math.min(a.skills?.length || 0, b.skills?.length || 0); i++) {
                    // get their respective skill values
                    const aSkillValue = a.skills?.[i].value || 0;
                    const bSkillValue = b.skills?.[i].value || 0;

                    // but if they're the same, lets move on to the next skill value to determine who's better
                    if (aSkillValue !== bSkillValue) {
                        console.log("using skill value to sort", aSkillValue, bSkillValue);
                        return bSkillValue - aSkillValue;
                    }
                }
                return 0;
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

    const ActionButton = ({ onClick, children, color = "#7458da", hoverColor = "#604BAC", className = "" }:
        { onClick: () => void; children: React.ReactNode; color?: string; hoverColor?: string; className?: string }) => (
        <button
            className={`flex items-center justify-center px-4 py-2 rounded-lg text-white transition-all duration-300 shadow-md hover:shadow-lg ${className}`}
            style={{ backgroundColor: color }}
            onClick={onClick}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = color)}
        >
            {children}
        </button>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#160A3A" }}>
                <SpinningLoader />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-white" style={{ backgroundColor: "#160A3A" }}>
                <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
                <p>Unable to load tournament information.</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen py-10 px-4 md:px-8" style={{ backgroundColor: "#160A3A" }}>
            <ConfirmModal information={confirmModalInfo} />

            <div className="max-w-6xl mx-auto bg-[#201644] rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative px-6 pt-8 md:px-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-[#7458da] font-bold text-3xl md:text-4xl text-center">{tournament.name}</h1>
                        {(user.permission_level == "owner" || user.permission_level == "admin") && (
                            <button
                                onClick={() => setIsTournamentEditModalOpen(true)}
                                className="bg-[#7458da] hover:bg-[#604BAC] transition-colors p-2 rounded-full px-4"
                                title="Edit Tournament Settings"
                            >
                                Settings <FontAwesomeIcon icon={faGear} size="lg" />
                            </button>
                        )}
                    </div>

                    {tournament.description && (
                        <div className="mt-4 text-gray-300 max-w-3xl">
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#7458da] mt-1 mr-3" />
                                <p>{tournament.description}</p>
                            </div>
                        </div>
                    )}
                </div>



                <div className="p-6 md:p-8">
                    {(tournament.location || tournament.start_time || tournament.end_time || tournament.max_players) && (
                        <div className="bg-[#2a1a66] rounded-xl p-6 shadow-md mb-8">
                            <h2 className="text-[#7458da] font-bold text-2xl mb-4">Tournament Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tournament.location && (
                                    <div className="flex items-center text-gray-300">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#7458da] mr-3" />
                                        <span>{tournament.location}</span>
                                    </div>
                                )}

                                {tournament.start_time && (
                                    <div className="flex items-center text-gray-300">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7458da] mr-3" />
                                        <span>Start: {formatDateTime(tournament.start_time)}</span>
                                    </div>
                                )}

                                {tournament.end_time && (
                                    <div className="flex items-center text-gray-300">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7458da] mr-3" />
                                        <span>End: {formatDateTime(tournament.end_time)}</span>
                                    </div>
                                )}

                                {tournament.max_players && (
                                    <div className="flex items-center text-gray-300">
                                        <FontAwesomeIcon icon={faUsers} className="text-[#7458da] mr-3" />
                                        <span>Max Players: {tournament.max_players}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {(user.permission_level == "owner" || user.permission_level == "admin") && (
                        <div className="bg-[#2a1a66] rounded-xl p-6 shadow-md mb-8">
                            <h2 className="text-[#7458da] font-bold text-2xl mb-6">Player Registration</h2>

                            <div className="flex items-center justify-between mb-6 p-4 bg-[#22154F] rounded-lg">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faUsers} className="text-[#7458da] mr-3" />
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

                            {joinLink && tournament.allow_join && (
                                <div className="space-y-8">
                                    <div className="relative">
                                        <label className="text-white text-sm mb-2 block">Join Code</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={(tournament as any).join_code}
                                                readOnly
                                                className="w-full p-3 bg-[#22154F] border-l-4 border-[#7458da] text-white focus:outline-none rounded-l-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="relative">
                                            <label className="text-white text-sm mb-2 block">Join Code</label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    value={(tournament as any).join_code}
                                                    readOnly
                                                    className="w-full p-3 bg-[#22154F] border-l-4 border-[#7458da] text-white focus:outline-none rounded-l-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label className="text-white text-sm mb-2 block">Share Tournament Join Link</label>
                                            <div className="md:flex block">
                                                <div className="flex w-full">
                                                    <input
                                                        type="text"
                                                        value={joinLink}
                                                        readOnly
                                                        className="w-full p-3 bg-[#22154F] border-l-4 border-[#7458da] text-white focus:outline-none rounded-l-lg"
                                                    />
                                                    <ActionButton onClick={handleCopyUrl} className="rounded-l-none">
                                                        <FontAwesomeIcon icon={faCopy} />
                                                    </ActionButton>
                                                </div>

                                                <ActionButton
                                                    onClick={() => setShowQRCode(!showQRCode)}
                                                    className="border-l w-fit border-[#604BAC] ml-8 flex items-center gap-2"
                                                >
                                                    <p className="m-0">QR</p>
                                                    <FontAwesomeIcon icon={faQrcode} />
                                                </ActionButton>
                                            </div>
                                        </div>

                                        {showQRCode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex flex-col items-center p-4"
                                            >
                                                <div ref={qrRef} className="p-4 bg-white rounded-lg inline-block mb-3">
                                                    <QRCode value={joinLink} size={160} />
                                                </div>

                                                <ActionButton
                                                    onClick={downloadQRCode}
                                                    className="flex items-center gap-2 mt-2"
                                                >
                                                    <p className="m-0">Download QR</p>
                                                    <FontAwesomeIcon icon={faDownload} />
                                                </ActionButton>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {(activePlayers.length > 0 || waitlistedPlayers.length > 0) && (
                        <div className="bg-[#2a1a66] rounded-xl p-6 shadow-md mb-8 space-y-8">
                            <PlayersTable
                                players={activePlayers}
                                otherPlayers={waitlistedPlayers}
                                setPlayers={setActivePlayers}
                                setOtherPlayers={setWaitlistedPlayers}
                                type="active"
                                tournament={tournament}
                                permission_level={user.permission_level}
                            />

                            <PlayersTable
                                players={waitlistedPlayers}
                                otherPlayers={activePlayers}
                                setPlayers={setWaitlistedPlayers}
                                setOtherPlayers={setActivePlayers}
                                type="waitlist"
                                tournament={tournament}
                                permission_level={user.permission_level}
                            />
                        </div>
                    )}

                    {(user.permission_level == "owner" || user.permission_level == "admin") && (
                        <div className="flex flex-wrap justify-center gap-4 mb-6">
                            <ActionButton
                                onClick={() => setIsPlaceholderPlayersModalOpen(true)}
                                color="#4A6FFF"
                                hoverColor="#3A5FEF"
                                className="min-w-[180px]"
                            >
                                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                Add Placeholder Players
                            </ActionButton>

                            <ActionButton
                                onClick={handleStartTournament}
                                className="min-w-[180px]"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                {starting ? "Working..." : "Start Tournament"}
                            </ActionButton>
                        </div>
                    )}
                </div>

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
