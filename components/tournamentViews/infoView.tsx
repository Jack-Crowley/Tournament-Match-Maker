"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGear,
    faCalendarAlt,
    faMapMarkerAlt,
    faInfoCircle,
    faUsers,
    faCopy,
    faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import QRCode from "react-qr-code";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "../loading";
import { useMessage } from "@/context/messageContext";
import { User } from "@/types/userType";
import { createClient } from "@/utils/supabase/client";

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

    return (
        <div className="relative min-h-screen flex justify-center items-start bg-[#160A3A] px-6">
            {tournament ? (
                <motion.div
                    key="Tournament Info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-4xl w-full bg-[#201644] rounded-2xl shadow-2xl p-10 mt-12"
                >
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-[#7458da] font-bold text-5xl">{tournament.name}</h1>
                        {["owner", "admin"].includes(user.permission_level.toLowerCase()) && (
                            <button
                                onClick={() => setActiveTab("Settings")}
                                className="text-[#7458da] hover:text-[#604BAC] transition-colors p-3 rounded-full hover:bg-[#2a1a66]"
                                title="Edit Tournament Settings"
                            >
                                <FontAwesomeIcon icon={faGear} size="xl" />
                            </button>
                        )}
                    </div>

                    {/* Description */}
                    {tournament.description && (
                        <div className="mt-6 text-gray-300 max-w-3xl text-lg leading-relaxed">
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#7458da] mt-1 mr-3 text-2xl" />
                                <p>{tournament.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Tournament Details */}
                    {(tournament.location || tournament.start_time || tournament.end_time || tournament.max_players) && (
                        <div className="bg-[#2a1a66] rounded-xl p-8 shadow-md mt-10">
                            <h2 className="text-[#7458da] font-bold text-3xl mb-6">Tournament Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tournament.location && (
                                    <div className="flex items-center text-lg text-gray-300">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#7458da] mr-3 text-2xl" />
                                        <span>{tournament.location}</span>
                                    </div>
                                )}

                                {tournament.start_time && (
                                    <div className="flex items-center text-lg text-gray-300">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7458da] mr-3 text-2xl" />
                                        <span>Start: {formatDateTime(tournament.start_time)}</span>
                                    </div>
                                )}

                                {tournament.end_time && (
                                    <div className="flex items-center text-lg text-gray-300">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7458da] mr-3 text-2xl" />
                                        <span>End: {formatDateTime(tournament.end_time)}</span>
                                    </div>
                                )}

                                {tournament.max_players && (
                                    <div className="flex items-center text-lg text-gray-300">
                                        <FontAwesomeIcon icon={faUsers} className="text-[#7458da] mr-3 text-2xl" />
                                        <span>Max Players: {tournament.max_players}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Join Code & QR Code */}
                    {joinLink && (
                        <div className="bg-[#2a1a66] rounded-xl p-8 shadow-md mt-10">
                            <h2 className="text-[#7458da] font-bold text-3xl mb-6">Join Tournament</h2>

                            {["owner", "admin"].includes(user.permission_level.toLowerCase()) && (
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
                                </div>)}

                            {/* Join Code */}
                            <div className="mb-6">
                                <label className="text-white text-lg font-semibold mb-2 block">Join Code</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={tournament.join_code}
                                        readOnly
                                        className="w-full p-3 bg-[#22154F] border-l-4 border-[#7458da] text-white focus:outline-none rounded-l-lg"
                                    />
                                </div>
                            </div>

                            {/* Join Link & QR Code */}
                            <div className="mb-6">
                                <label className="text-white text-lg font-semibold mb-2 block">Join Link</label>
                                <div className="md:flex block">
                                    <div className="flex w-full">
                                        <input
                                            type="text"
                                            value={joinLink}
                                            readOnly
                                            className="w-full p-3 bg-[#22154F] border-l-4 border-[#7458da] text-white focus:outline-none rounded-l-lg"
                                        />
                                        <button
                                            onClick={handleCopyUrl}
                                            className="bg-[#7458da] hover:bg-[#604BAC] text-white p-3 rounded-r-lg transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faCopy} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowQRCode(!showQRCode)}
                                        className="ml-4 px-5 py-3 bg-[#604BAC] hover:bg-[#7458da] text-white rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <span>QR</span>
                                        <FontAwesomeIcon icon={faQrcode} />
                                    </button>
                                </div>
                            </div>

                            {/* QR Code Display */}
                            {showQRCode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex justify-center p-4"
                                >
                                    <div className="p-4 bg-white rounded-lg inline-block">
                                        <QRCode value={joinLink} size={160} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            ) : (
                // Spinning Loader for Loading State
                <div className="flex justify-center items-center h-40 mt-20">
                    <SpinningLoader />
                </div>
            )}
        </div>
    );
};
