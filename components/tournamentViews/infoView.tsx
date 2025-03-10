"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCalendarAlt, faMapMarkerAlt, faInfoCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "../loading";

export const TournamentInfoView = ({
    tournament,
    setActiveTab,
}: {
    tournament: Tournament | undefined;
    setActiveTab: (state: string) => void;
}) => {
    const formatDateTime = (date: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - new Date().getTimezoneOffset());
        return d.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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
                        <button
                            onClick={() => setActiveTab("Settings")}
                            className="text-[#7458da] hover:text-[#604BAC] transition-colors p-3 rounded-full hover:bg-[#2a1a66]"
                            title="Edit Tournament Settings"
                        >
                            <FontAwesomeIcon icon={faGear} size="xl" />
                        </button>
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
