"use client"

import TournamentBracket from "@/components/tournamentViews/single/bracketView";
import { Bracket } from "@/types/bracketTypes";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faList, faBullhorn, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { fetchBracket } from "@/utils/bracket/bracket";
import { SpinningLoader } from "../loading";
import { AnimatePresence, motion } from "framer-motion";
import { AnnouncementSystem } from "../announcement";

const NAV_ITEMS = [
    { key: "Bracket", icon: faTrophy },
    { key: "Waitlist", icon: faList },
    { key: "Announcements", icon: faBullhorn },
    { key: "Messages", icon: faEnvelope },
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

export const ViewTournament = ({ tournamentID }: { tournamentID: number }) => {
    const [bracket, setBracket] = useState<Bracket | null>(null)
    const [errorCode, setErrorCode] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState("Bracket");

    useEffect(() => {
        async function LoadBracket() {
            const { bracket, errorCode } = await fetchBracket(tournamentID);
            setBracket(bracket);
            setErrorCode(errorCode);
        }

        LoadBracket()
    }, [tournamentID])

    if (errorCode) {
        return <div>Error: {errorCode}</div>;
    }

    return (
        <div className="relative">
            <SideNavbar tab={activeTab} setTab={setActiveTab} />
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
                            <TournamentBracket bracket={bracket} />
                        )}

                        {activeTab === "Announcements" && (
                            <AnnouncementSystem tournamentID={tournamentID}/>
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <SpinningLoader />
            )}
        </div>
    )
}