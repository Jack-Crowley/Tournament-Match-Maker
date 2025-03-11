
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


export const SideNavbar = ({ tab, setTab, tournament, user }: {
    tab: string,
    setTab: (state: string) => void,
    tournament: Tournament,
    user: User,
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const isCompleted = tournament?.status === "completed";

    // Define nav items dynamically based on tournament status
    const NAV_ITEMS = [
        { key: "Bracket", icon: faTrophy },
        { key: "Players", icon: faList },
        { key: "Score Report", icon: faFileAlt },
        { key: "Announcements", icon: faBullhorn },
        { key: "Messages", icon: faEnvelope },
        { key: "Tournament Info", icon: faInfoCircle },
    ];

    if (user.permission_level === "admin" || user.permission_level === "owner") {
        NAV_ITEMS.push({ key: "End Tournament", icon: faFlagCheckered });
    }

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="fixed top-1/2 transform -translate-y-1/2 left-8 z-20">
            <nav className="bg-deep p-3 flex flex-col gap-2 rounded-full border-2 shadow-lg border-soft">
                {NAV_ITEMS.map(({ key, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`relative group text-2xl w-12 h-12 flex justify-center items-center transition-all rounded-full 
                            ${tab === key ? "bg-primary text-white" : "text-soft hover:bg-highlight hover:text-white"}`}
                    >
                        <FontAwesomeIcon icon={icon} />
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-1 bg-accent text-white text-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                            {key}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
};


export const ViewTournament = ({ tournamentID, user }: { tournamentID: number, user: User }) => {
    const [bracket, setBracket] = useState<Bracket | null>(null)
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

        const { error } = await supabase
            .from("tournaments")
            .update({ status: "completed" })
            .eq("id", tournamentID);

        if (error) {
            triggerMessage("Error ending tournament", "red");
        } else {
            triggerMessage("Tournament ended successfully!", "green");
            setActiveTab("Score Report"); // Redirect to Score Report
        }
    };


    return (
        <div className="relative">
            {tournament && (
                <SideNavbar tab={activeTab} setTab={setActiveTab} user={user} tournament={tournament} />
            )}

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
                            <AnnouncementSystem tournamentID={tournamentID} user={user} />
                        )}

                        {activeTab === "Messages" && (
                            <MessagingSystem tournamentID={tournamentID} user={user} />
                        )}

                        {activeTab === "Tournament Info" && (
                            <TournamentInfoView tournament={tournament} setActiveTab={setActiveTab} user={user} />
                        )}
                        {activeTab === "Settings" && tournament && (
                            <TournamentModal
                                isOpen={true}
                                onClose={() => setActiveTab("Tournament Info")} // Close and return to Tournament Info
                                tournament={tournament}
                                setTournament={setTournament}
                            />
                        )}
                        {activeTab === "End Tournament" && tournament && (
                            <div className="bg-[#2e225b] p-6 rounded-xl text-white w-[60%] ml-[20%]">
                                <h2 className="text-2xl font-semibold mb-4">End Tournament</h2>
                                <p className="text-gray-300 mb-6">
                                    Are you sure you want to end the tournament? This action is irreversible.
                                </p>
                                <button
                                    onClick={handleEndTournament}
                                    className="px-4 py-2 bg-[#f08c8a] text-[#2e225b] font-bold rounded-lg hover:bg-[#e15151] transition"
                                >
                                    Yes, End Tournament
                                </button>
                            </div>
                        )}


                        {activeTab === "Score Report" && tournament && tournament.status === "completed" && (
                            <div className="bg-[#2e225b] p-6 rounded-xl text-white w-[60%] ml-[20%]">
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
                    </motion.div>
                </AnimatePresence>
            ) : (
                <SpinningLoader />
            )}
        </div>
    );
}
