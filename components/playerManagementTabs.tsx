"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserClock, faUserSlash, faUserPlus, faSearch, faExclamationCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Player, TournamentPlayer } from "@/types/playerTypes";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";
import { motion, AnimatePresence } from "framer-motion";
import { BracketPlayer, Matchup } from "@/types/bracketTypes";
import { v4 } from "uuid";

export const PlayerManagementTabs = ({ tournamentID, matchup, index, onClose }: { tournamentID: number, matchup: Matchup, index: number, onClose: (player:BracketPlayer) => void }) => {
    const [activeTab, setActiveTab] = useState("waitlist");
    const [waitlistPlayers, setWaitlistPlayers] = useState<TournamentPlayer[]>([]);
    const [inactivePlayers, setInactivePlayers] = useState<TournamentPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [displayLimit, setDisplayLimit] = useState(5);
    const [selectedPlayer, setSelectedPlayer] = useState<TournamentPlayer | null>(null)
    const [newPlayerName, setNewPlayerName] = useState("");

    const { triggerMessage } = useMessage();
    const supabase = createClient();

    const addPlayer = async (player: TournamentPlayer | null) => {
        if (!player) return;

        const bracketPlayer : BracketPlayer = {
            uuid: player.member_uuid,
            name: player.player_name,
            email: "",
            account_type: player.type
        } 

        onClose(bracketPlayer)
    }

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from("tournament_players")
                    .select("*")
                    .eq("tournament_id", tournamentID);

                if (error) {
                    triggerMessage("Error fetching players", "red");
                    console.log(error);
                } else {
                    data.sort((a, b) => a.last_update - b.last_update);

                    setWaitlistPlayers(data.filter(player => player.type === "waitlist"));
                    setInactivePlayers(data.filter(player => player.type === "inactive"));
                }
            } catch (err) {
                console.error("Error loading data:", err);
                triggerMessage("Error fetching player data", "red");
            } finally {
                setIsLoading(false);
            }
        }

        loadData();

        setSearchQuery("");
        setSelectedPlayer(null);
        setDisplayLimit(5);
    }, [tournamentID, supabase, activeTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchQuery("");
        setSelectedPlayer(null);
        setDisplayLimit(5);
    };

    const handleSearch = (e: any) => {
        setSearchQuery(e.target.value);
        setDisplayLimit(5);
    };

    const handleLoadMore = () => {
        setDisplayLimit(prevLimit => prevLimit + 5);
    };

    const handleAddNewPlayer = async () => {
        if (!newPlayerName.trim()) {
            triggerMessage("Please enter a player name", "yellow");
            return;
        }

        setIsLoading(true);

        try {
            const newPlayer = {
                tournament_id: tournamentID,
                player_name: newPlayerName.trim(),
                member_uuid: v4(),
                type: "active",
                is_anonymous: true,
            };

            const { data, error } = await supabase
                .from("tournament_players")
                .insert(newPlayer)
                .select()
                .single();

            if (error) {
                triggerMessage("Error adding player", "red");
                console.error(error);
            } else {
                setNewPlayerName("");
                addPlayer(data)
            }
        } catch (err) {
            console.error("Error adding new player:", err);
            triggerMessage("Error adding player", "red");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredWaitlistPlayers = waitlistPlayers.filter(player =>
        player.player_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredInactivePlayers = inactivePlayers.filter(player =>
        player.player_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDisplayPlayers = () => {
        if (activeTab === "waitlist") {
            return filteredWaitlistPlayers.slice(0, displayLimit);
        } else if (activeTab === "inactive") {
            return filteredInactivePlayers.slice(0, displayLimit);
        }
        return [];
    };

    const hasMoreToLoad = () => {
        if (activeTab === "waitlist") {
            return filteredWaitlistPlayers.length > displayLimit;
        } else if (activeTab === "inactive") {
            return filteredInactivePlayers.length > displayLimit;
        }
        return false;
    };

    return (
        <motion.div
            className="w-full mt-12 max-w-6xl mx-auto rounded-2xl shadow-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-wrap space-x-1 mb-8 border-b border-[#3a2b7d]">
                <button
                    onClick={() => handleTabChange("waitlist")}
                    className={`px-4 py-3 rounded-t-lg text-lg font-medium transition-colors duration-200 ${activeTab === "waitlist"
                        ? "bg-[#342373] text-white border-b-2 border-[#7458da]"
                        : "text-[#b8b8b8] hover:bg-[#2a1b5f] hover:text-white"
                        }`}
                >
                    <FontAwesomeIcon icon={faUserClock} className="mr-2" />
                    Waitlist
                </button>
                <button
                    onClick={() => handleTabChange("inactive")}
                    className={`px-4 py-3 rounded-t-lg text-lg font-medium transition-colors duration-200 ${activeTab === "inactive"
                        ? "bg-[#342373] text-white border-b-2 border-[#7458da]"
                        : "text-[#b8b8b8] hover:bg-[#2a1b5f] hover:text-white"
                        }`}
                >
                    <FontAwesomeIcon icon={faUserSlash} className="mr-2" />
                    Inactive
                </button>
                <button
                    onClick={() => handleTabChange("new")}
                    className={`px-4 py-3 rounded-t-lg text-lg font-medium transition-colors duration-200 ${activeTab === "new"
                        ? "bg-[#342373] text-white border-b-2 border-[#7458da]"
                        : "text-[#b8b8b8] hover:bg-[#2a1b5f] hover:text-white"
                        }`}
                >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    New
                </button>
            </div>

            {(activeTab === "waitlist" || activeTab === "inactive") && (
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex-grow max-w-md relative">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7458da]"
                        />
                        <input
                            type="text"
                            placeholder="search players..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-10 py-2 bg-[#2a1a66] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7458da] text-white placeholder:text-[#a899e0]"
                        />
                    </div>
                    <div className="flex justify-between w-full">
                        <button
                            className={`px-4 py-2 rounded-md transition-opacity ${selectedPlayer ? 'bg-[#7458da] hover:bg-[#634bc1] opacity-100' : 'bg-[#7458da] opacity-50 cursor-not-allowed'}`}
                            disabled={!selectedPlayer}
                            onClick={() => addPlayer(selectedPlayer)}
                        >
                            Move Player
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md transition-opacity ${selectedPlayer ? 'bg-[#342575] hover:bg-[#3a2b7d] opacity-100' : 'bg-[#342575] opacity-50 cursor-not-allowed'}`}
                            disabled={!selectedPlayer}
                        >
                            Contact Selected
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        className="flex justify-center items-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-[#3a2b7d] border-t-[#7458da] rounded-full animate-spin"></div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "waitlist" && (
                            <div>
                                {filteredWaitlistPlayers.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg">
                                        <div className="overflow-x-auto">
                                            <table className="w-full mx-auto bg-deep rounded-lg shadow-lg">
                                                <thead className="bg-[#1b113d]">
                                                    <tr>
                                                        <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Name</th>
                                                        <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Position</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getDisplayPlayers().map((player, index) => (
                                                        <motion.tr
                                                            key={player.id}
                                                            className={`hover:bg-[#2a1b5f] bg-[#22154F] ${selectedPlayer && selectedPlayer.id == player.id ? "bg-[#342373]" : ""} transition-colors duration-50 cursor-pointer`}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            onClick={() => setSelectedPlayer(player)}
                                                        >
                                                            <td className={`p-4 text-lg border-b border-[#3a2b7d] ${player.is_anonymous ? "text-white font-medium" : "text-[#d8d8d8] font-medium"}`}>
                                                                {player.player_name}
                                                            </td>
                                                            <td className="p-4 text-lg border-b border-[#3a2b7d] text-[#b8b8b8]">
                                                                #{index + 1}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {hasMoreToLoad() && (
                                            <div className="mt-4 text-center">
                                                <button
                                                    onClick={handleLoadMore}
                                                    className="px-4 py-2 bg-[#342575] hover:bg-[#3a2b7d] text-white rounded-md transition-colors"
                                                >
                                                    Load More
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <motion.div
                                        className="text-center p-8 bg-[#22154F] rounded-lg"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                    >
                                        <FontAwesomeIcon icon={faExclamationCircle} className="text-[#7458da] text-4xl mb-4" />
                                        <h3 className="text-white text-xl font-semibold mb-2">No Players on Waitlist</h3>
                                        <p className="text-[#a8a8a8] text-lg">
                                            There are currently no players waiting to join this tournament.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {activeTab === "inactive" && (
                            <div>
                                {filteredInactivePlayers.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg">
                                        <div className="overflow-x-auto">
                                            <table className="w-full mx-auto bg-deep rounded-lg shadow-lg">
                                                <thead className="bg-[#1b113d]">
                                                    <tr>
                                                        <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Name</th>
                                                        <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Removed On</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getDisplayPlayers().map((player, index) => (
                                                        <motion.tr
                                                            key={player.id}
                                                            className={`hover:bg-[#2a1b5f] bg-[#22154F] ${selectedPlayer && selectedPlayer.id == player.id ? "bg-[#342373]" : ""} transition-colors duration-50 cursor-pointer`}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <td className={`p-4 text-lg border-b border-[#3a2b7d] ${player.is_anonymous ? "text-white font-medium" : "text-[#d8d8d8] font-medium"}`}>
                                                                {player.player_name}
                                                            </td>
                                                            <td className="p-4 text-lg border-b border-[#3a2b7d] text-[#b8b8b8]">
                                                                {new Date(player.last_update).toLocaleDateString()}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {hasMoreToLoad() && (
                                            <div className="mt-4 text-center">
                                                <button
                                                    onClick={handleLoadMore}
                                                    className="px-4 py-2 bg-[#342575] hover:bg-[#3a2b7d] text-white rounded-md transition-colors"
                                                >
                                                    Load More
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <motion.div
                                        className="text-center p-8 bg-[#22154F] rounded-lg shadow-lg"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                    >
                                        <FontAwesomeIcon icon={faExclamationCircle} className="text-[#7458da] text-4xl mb-4" />
                                        <h3 className="text-white text-xl font-semibold mb-2">No Inactive Players</h3>
                                        <p className="text-[#a8a8a8] text-lg">
                                            There are currently no inactive players for this tournament.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {activeTab === "new" && (
                            <motion.div
                                className="rounded-lg shadow-xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <h3 className="text-white text-xl font-semibold mb-6">Add New Player</h3>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="text"
                                        placeholder="enter player name..."
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        className="flex-grow py-3 px-4 bg-[#342575] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7458da] text-white placeholder:text-[#a899e0]"
                                    />

                                    <motion.button
                                        onClick={handleAddNewPlayer}
                                        className="px-6 py-3 bg-[#7458da] hover:bg-[#634bc1] text-white rounded-lg transition-colors font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={!newPlayerName.trim() || isLoading}
                                    >
                                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                        Add
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="h-10"></div>
        </motion.div>
    );
};