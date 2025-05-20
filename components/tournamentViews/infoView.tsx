"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGear,
    faInfoCircle,
    faTrophy,
    faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Tournament } from "@/types/tournamentTypes";
import { useMessage } from "@/context/messageContext";
import { User } from "@/types/userType";
import { createClient } from "@/utils/supabase/client";
import { TournamentInfo } from "../tournament/TournamentInfo";
import { TournamentJoining } from "../tournament/TournamentJoining";

export const TournamentInfoView = ({
    tournament,
    setActiveTab,
    user
}: {
    tournament: Tournament | undefined;
    setActiveTab: (state: string) => void;
    user: User;
}) => {
    const [showQRCode, setShowQRCode] = useState<boolean>(false);
    const { triggerMessage } = useMessage();
    const joinLink = tournament ? `${window.location.origin}/tournament/join/${tournament.join_code}` : null;
    const supabase = createClient()

    const handleCopyUrl = () => {
        if (!joinLink) return;
        navigator.clipboard.writeText(joinLink);
        triggerMessage("Join URL copied to clipboard!", "green");
    };

    const formatDateTime = (date: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - new Date().getTimezoneOffset());
        return d.toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleAllowJoinToggle = async () => {
        if (!tournament) return;

        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ allow_join: !tournament.allow_join })
                .eq('id', tournament.id);

            if (error) {
                triggerMessage("Error updating tournament: " + error.message, "red");
            } else {
                triggerMessage(`Player joining ${tournament.allow_join ? 'disabled' : 'enabled'}`, "green");
                tournament.allow_join = !tournament.allow_join;
            }
        } catch {
            triggerMessage("An error occurred while updating settings", "red");
        }
    };

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

            <div className="container mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-4xl font-bold text-center md:text-left bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-300">
                            {tournament.name}
                        </h1>

                        {(user.permission_level === "owner" || user.permission_level === "admin") && (
                            <button
                                onClick={() => setActiveTab("Settings")}
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

                {/* Tournament Details */}
                <TournamentInfo tournament={tournament} />

                {/* Registration Section */}
                {(user.permission_level === "owner" || user.permission_level === "admin") && (
                    <TournamentJoining
                        tournament={tournament}
                        joinLink={joinLink}
                        onAllowJoinToggle={handleAllowJoinToggle}
                        onCopyUrl={handleCopyUrl}
                    />
                )}
            </div>

        </div>
    )
};
