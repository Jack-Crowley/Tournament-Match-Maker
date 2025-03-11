
"use client"

import TournamentBracket, { BracketViewType } from "@/components/tournamentViews/single/bracketView";
import { Bracket, Matchup } from "@/types/bracketTypes";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faBullhorn, faEnvelope, faFlagCheckered, faFileAlt, faInfoCircle, faList } from "@fortawesome/free-solid-svg-icons";
import { fetchBracket } from "@/utils/bracket/bracket";
import { SpinningLoader } from "../loading";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AnnouncementSystem } from "../announcement";
import { PlayersView } from "./playersView";
import { User } from "@/types/userType";
import { Tournament } from "@/types/tournamentTypes";
import { TournamentModal } from "../modals/tournamentEditModal";
import { useMessage } from "@/context/messageContext";
import { MessagingSystem } from "../messanging";
import { TournamentInfoView } from "./infoView";

const NAV_ITEMS = [
    { key: "Bracket", icon: faTrophy },
    { key: "Players", icon: faList },
    { key: "Announcements", icon: faBullhorn },
    { key: "Messages", icon: faEnvelope },
    { key: "Tournament Info", icon: faInfoCircle },
    { key: "End Tournament", icon: faFlagCheckered }, // Add End Tournament option
];

export const EndTournamentButton = ({ tournamentID, bracket }: { tournamentID: number; bracket: { rounds: { matches: Matchup[] }[] } }) => {
    const supabase = createClient();
    const { triggerMessage } = useMessage();

    const handleEndTournament = async () => {
        // 1. Generate a simple score report
        const scoreReport = bracket.rounds.flatMap((round, roundIndex) =>
            round.matches.map(match => ({
                round: roundIndex + 1,
                match: match.match_number,
                player1: match.players[0]?.name || "TBD",
                player2: match.players[1]?.name || "TBD",
                winner: match.winner ? match.players.find(p => p.uuid === match.winner)?.name : "No Winner"
            }))
        );

        console.table(scoreReport); // Log report to console

        // 2. Update tournament status to 'completed'
        const { error } = await supabase
            .from("tournaments")
            .update({ status: "completed" })
            .eq("id", tournamentID);

        if (error) {
            triggerMessage("Error ending tournament", "red");
        } else {
            triggerMessage("Tournament ended successfully!", "green");
            alert("Tournament has ended. Check the console for score report.");
        }
    };

    return (
        <button
            onClick={handleEndTournament}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
        >
            End Tournament
        </button>
    );
};


export const SideNavbar = ({ tab, setTab, setShowEndTournamentModal, showScoreReport }: {
    tab: string,
    setTab: (state: string) => void,
    setShowEndTournamentModal: (state: boolean) => void,
    showScoreReport: boolean
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={`fixed ${isMobile ? "bottom-0 left-0 right-0" : "top-1/2 transform -translate-y-1/2 left-8"} z-20`}>
            {/* <nav className="z-20 bg-deep p-3 flex w-fit shadow-lg rounded-full flex-col gap-2 border border-soft"></nav> */}
            <nav className={`z-20 bg-deep p-3 flex ${isMobile ? "flex-row justify-around" : "flex-col gap-2 rounded-full border-2"} w-full shadow-lg border-soft`}>
                {NAV_ITEMS.map(({ key, icon }) => (
                    <button
                        key={key}
                        onClick={() => {
                            if (key === "End Tournament") {
                                setShowEndTournamentModal(true);
                            } else {
                                setTab(key);
                            }
                        }}
                        className={`relative group text-2xl w-12 h-12 flex justify-center items-center transition-all rounded-full ${tab === key ? "bg-primary text-white" : "text-soft hover:bg-highlight hover:text-white"}`}
                    >
                        <FontAwesomeIcon icon={icon} />
                        {!isMobile && (
                            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-1 bg-accent text-white text-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                {key}
                            </span>
                        )}
                    </button>
                ))}

                {showScoreReport && (
                    <button
                        onClick={() => setTab("Score Report")}
                        className={`relative group text-2xl w-12 h-12 flex justify-center items-center transition-all rounded-full ${tab === "Score Report" ? "bg-primary text-white" : "text-soft hover:bg-highlight hover:text-white"}`}
                    >
                        <FontAwesomeIcon icon={faFileAlt} />
                        {!isMobile && (
                            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-1 bg-accent text-white text-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                Score Report
                            </span>
                        )}
                    </button>
                )}
            </nav>
        </div>
    );
};


export const ViewTournament = ({ tournamentID, user }: { tournamentID: number, user: User }) => {
    const [bracket, setBracket] = useState<Bracket | null>(null)
    const [showEndTournamentModal, setShowEndTournamentModal] = useState(false);
    const [tournament, setTournament] = useState<Tournament>();

    const supabase = createClient()
    const [activeTab, setActiveTab] = useState("Bracket");

    const { triggerMessage } = useMessage();

    useEffect(() => {
        async function LoadBracket() {
            console.log("We are currently loading the barcket!")
            const { bracket } = await fetchBracket(tournamentID);
            setBracket(bracket);
        }

        async function LoadTournament() {
            const { data, error } = await supabase.from("tournaments").select("*").eq("id", tournamentID).single();
            if (error) {
                console.error("Error fetching tournament data", error);
                return;
            }
            setTournament(data);
        }

        LoadBracket()
        LoadTournament()

        // ** Subscribe to Supabase real-time updates **
        const subscription = supabase
            .channel("tournament-matches-channel") // Unique channel name
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to all insert/update/delete events
                    schema: "public",
                    table: "tournament_matches",
                },
                async () => {
                    await LoadBracket();
                }
            )
            .subscribe();

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(subscription);
        };

    }, [tournamentID, supabase])

    // ** Effect to update the tournament in the database whenever it changes **
    useEffect(() => {
        async function updateTournamentInDatabase() {
            if (tournament) {
                const { error } = await supabase
                    .from("tournaments")
                    .update(tournament)
                    .eq("id", tournamentID);

                if (error) {
                    console.error("Error updating tournament in database", error);
                } else {
                    console.log("Tournament updated successfully in database");
                }
            }
        }

        updateTournamentInDatabase();
    }, [tournament, supabase, tournamentID]);

    const handleEndTournament = async () => {
        if (!bracket) {
            triggerMessage("No bracket data available", "red");
            return;
        }
        // Generate a simple score report
        const scoreReport = bracket.rounds.flatMap((round, roundIndex) =>
            round.matches.map(match => ({
                round: roundIndex + 1,
                match: match.match_number,
                player1: match.players[0]?.name || "TBD",
                player2: match.players[1]?.name || "TBD",
                winner: match.winner ? match.players.find(p => p.uuid === match.winner)?.name : "No Winner"
            }))
        );

        console.table(scoreReport); // Log report to console

        // Update tournament status to 'completed'
        const { error } = await supabase
            .from("tournaments")
            .update({ status: "completed" })
            .eq("id", tournamentID);

        if (error) {
            triggerMessage("Error ending tournament", "red");
        } else {
            triggerMessage("Tournament ended successfully!", "green");
            setShowEndTournamentModal(false);
            window.location.reload();
        }
    };

    return (
        <div className="relative">
            <SideNavbar tab={activeTab} setTab={setActiveTab} setShowEndTournamentModal={setShowEndTournamentModal} showScoreReport={tournament?.status === "completed"} />

            {bracket ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mt-8 px-4 sm:px-8 lg:px-16"
                    >
                        {activeTab === "Bracket" && (
                            <TournamentBracket bracket={bracket} bracketViewType={BracketViewType.Single} tournamentID={tournamentID} user={user} />
                        )}

                        {activeTab == "Players" && (
                            <PlayersView tournamentID={tournamentID} bracket={bracket} user={user} setActiveTab={setActiveTab} />
                        )}

                        {activeTab === "Announcements" && (
                            <AnnouncementSystem tournamentID={tournamentID} />
                        )}

                        {activeTab === "Messages" && (
                            <MessagingSystem tournamentID={tournamentID} user={user} />
                        )}

                        {activeTab === "Tournament Info" && (
                            <TournamentInfoView tournament={tournament} setActiveTab={setActiveTab} />
                        )}
                        {activeTab === "Settings" && tournament && (
                            <TournamentModal
                                isOpen={true}
                                onClose={() => setActiveTab("Tournament Info")} // Close and return to Tournament Info
                                tournament={tournament}
                                setTournament={setTournament}
                            />
                        )}

                        {activeTab === "Score Report" && tournament && tournament.status === "completed" && (
                            <div className="bg-[#2e225b] p-6 rounded-xl text-white">
                                <h2 className="text-2xl font-semibold mb-4">Score Report</h2>
                                <ul className="space-y-2">
                                    {bracket.rounds.flatMap((round, roundIndex) =>
                                        round.matches.map((match, matchIndex) => (
                                            <li key={`${roundIndex}-${matchIndex}`} className="p-2 bg-[#3a2f6b] rounded-md shadow">
                                                <strong>Round {roundIndex + 1}, Match {match.match_number}:</strong> {match.players[0]?.name || "TBD"} vs {match.players[1]?.name || "TBD"} - <span className="font-bold">{match.winner ? match.players.find(p => p.uuid === match.winner)?.name : "No Winner"}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                        {showEndTournamentModal && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
                                <div className="bg-[#2e225b] p-6 rounded-2xl shadow-2xl text-center relative z-[10000] text-white w-[90%] max-w-md">
                                    <h2 className="text-xl font-semibold mb-4">End Tournament?</h2>
                                    <p className="text-gray-300 mb-6">This action is irreversible. Are you sure?</p>
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => setShowEndTournamentModal(false)}
                                            className="px-4 py-2 bg-[#7458DA] text-white rounded-lg hover:bg-[#604BAC] transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleEndTournament}
                                            className="px-4 py-2 bg-[#f08c8a] text-[#2e225b] font-bold rounded-lg hover:bg-[#e15151] transition"
                                        >
                                            Yes, End Tournament
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <SpinningLoader />
            )}
        </div>
    );
}
