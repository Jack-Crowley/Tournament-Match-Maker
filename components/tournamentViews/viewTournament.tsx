"use client"

import TournamentBracket, { BracketViewType } from "@/components/tournamentViews/single/bracketView";
import { Bracket } from "@/types/bracketTypes";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faUserClock, faBullhorn, faEnvelope, faCog } from "@fortawesome/free-solid-svg-icons";
import { fetchBracket } from "@/utils/bracket/bracket";
import { SpinningLoader } from "../loading";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AnnouncementSystem } from "../announcement";
import { WaitlistView } from "./waitlistView";
import { User } from "@/types/userType";
import { Tournament } from "@/types/tournamentTypes";
import { TournamentModal } from "../modals/tournamentEditModal";
import { useMessage } from "@/context/messageContext";

const NAV_ITEMS = [
    { key: "Bracket", icon: faTrophy },
    { key: "Waitlist", icon: faUserClock },
    { key: "Announcements", icon: faBullhorn },
    { key: "Messages", icon: faEnvelope },
    { key: "Settings", icon: faCog }
];

const SideNavbar = ({ tab, setTab }: { tab: string, setTab: (state: string) => void }) => {
    return (
        <div className="fixed top-1/2 transform -translate-y-1/2 w-[8%] z-20 flex items-center justify-center">
            <nav className="z-20 bg-deep p-3 flex w-fit shadow-lg rounded-full flex-col gap-2 border border-soft">
                {NAV_ITEMS.map(({ key, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`relative group text-2xl w-12 h-12 flex justify-center items-center transition-all rounded-full ${tab === key ? "bg-primary text-white" : "text-soft hover:bg-highlight hover:text-white"}`}
                    >
                        <FontAwesomeIcon icon={icon} />
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-1 bg-accent text-white text-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">{key}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

export const ViewTournament = ({ tournamentID, user }: { tournamentID: number, user: User }) => {
    const [bracket, setBracket] = useState<Bracket | null>(null)
    const [errorCode, setErrorCode] = useState<number | null>(null)
    const [tournament, setTournament] = useState<Tournament>();

    const supabase = createClient()
    const [activeTab, setActiveTab] = useState("Bracket");

    useEffect(() => {
        async function LoadBracket() {
            console.log("We are currently loading the barcket!")
            const { bracket, errorCode } = await fetchBracket(tournamentID);
            setBracket(bracket);
            setErrorCode(errorCode);
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
    }, [tournament]);


    return (
        <div className={`relative}`}>
            <SideNavbar tab={activeTab} setTab={setActiveTab} />
            {/* <button
                className="absolute top-4 right-4 px-6 py-3 text-lg font-semibold rounded-lg transition-all transform bg-background text-gray-400 hover:bg-highlight hover:text-white shadow-md z-50 pointer-events-auto"
                onClick={() => console.log("hello")}
            >
                Generate Scores (placeholder)
            </button> */}

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

                        {activeTab == "Waitlist" && (
                            <WaitlistView tournamentID={tournamentID} bracket={bracket} user={user} />
                        )}

                        {activeTab === "Announcements" && (
                            <AnnouncementSystem tournamentID={tournamentID} />
                        )}
                        {activeTab === "Settings" && tournament && (
                            <TournamentModal
                                isOpen={true}
                                onClose={() => (setActiveTab("Bracket"))}
                                tournament={tournament}
                                setTournament={setTournament}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <SpinningLoader />
            )}
        </div>
    )
}