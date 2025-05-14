import React, { useState, useEffect } from 'react';
import { BracketViewType, MovingPlayer, OnMovePlayer } from '../single/bracketView';
import { Bracket, BracketPlayer, Matchup, Round } from '@/types/bracketTypes';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { User } from '@/types/userType';
import { ConfirmModal, ConfirmModalInformation } from "../../modals/confirmationModal";


import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faCircle,
    faListUl,
    faSitemap,
    faSearch,
    faFilter,
    faChevronDown,
    faTimes,
    faTrophy,
    faGamepad,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { MatchupElement } from '../single/matchupElement';
import { MatchupModal } from '@/components/modals/displayMatchup';
import { Player } from '@/types/playerTypes';

enum DisplayMode {
    Bracket = "bracket",
    List = "list"
}

const calculatePlayerRecords = (bracket: Bracket): Map<string, { wins: number, losses: number, ties: number }> => {
    const records = new Map<string, { wins: number, losses: number, ties: number }>();
    console.log(bracket)
    bracket.rounds.forEach(round => {
        round.matches.forEach(match => {
            if (match.winner) {
                // Update winner's record
                const winnerRecord = records.get(match.winner) || { wins: 0, losses: 0, ties: 0 };
                records.set(match.winner, { ...winnerRecord, wins: winnerRecord.wins + 1 });

                // Update loser's record
                const loser = match.players.find(p => p.uuid !== match.winner);
                if (loser) {
                    const loserRecord = records.get(loser.uuid) || { wins: 0, losses: 0, ties: 0 };
                    records.set(loser.uuid, { ...loserRecord, losses: loserRecord.losses + 1 });
                }
            } else {
                // Update both players' records for ties
                match.players.forEach(player => {
                    if (player.uuid) {
                        const tieRecord = records.get(player.uuid) || { wins: 0, losses: 0, ties: 0 };
                        records.set(player.uuid, { ...tieRecord, ties: tieRecord.ties + 1 });
                    }
                });
            }
        });
    });

    return records;
};

const calculatePlayerRankings = (records: Map<string, { wins: number, losses: number, ties: number }>): string[] => {
    return Array.from(records.entries())
        .sort((a, b) => {
            // Sort by wins descending, then losses ascending, then ties descending
            if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
            if (a[1].losses !== b[1].losses) return a[1].losses - b[1].losses;
            return b[1].ties - a[1].ties;
        })
        .map(([uuid]) => uuid);
};

const havePlayersPlayedBefore = (player1: string, player2: string, bracket: Bracket): boolean => {
    for (const round of bracket.rounds) {
        for (const match of round.matches) {
            const playerUUIDs = match.players.map(p => p.uuid);
            if (playerUUIDs.includes(player1) && playerUUIDs.includes(player2)) {
                return true;
            }
        }
    }
    return false;
};

const calculatePlayerMap = (bracket: Bracket): Map<string, Player> => {
    const playerMap = new Map()

    bracket.rounds.forEach((round) => {
        round.matches.forEach((match) => {
            const player1 = match.players[0]
            const player2 = match.players[1]

            if (!playerMap.has(player1.uuid)) playerMap.set(player1.uuid, player1)
            if (!playerMap.has(player2.uuid)) playerMap.set(player2.uuid, player2)
        })
    })

    return playerMap;
}

const generateNextRoundPairings = (bracket: Bracket, tournamentID: number): any[] => {
    const records = calculatePlayerRecords(bracket);
    const rankings = calculatePlayerRankings(records);
    const playerMap = calculatePlayerMap(bracket)
    const pairings: any[] = [];
    const pairedPlayers = new Set<string>();

    const availablePlayers = [...rankings];

    while (availablePlayers.length > 1) {
        const player1 = availablePlayers.shift()!;

        if (pairedPlayers.has(player1)) continue;

        const opponentIndex = availablePlayers.findIndex(
            player2 => !havePlayersPlayedBefore(player1, player2, bracket)
        );

        const opponent = opponentIndex !== -1
            ? availablePlayers.splice(opponentIndex, 1)[0]
            : availablePlayers.shift();

        if (opponent) {
            pairedPlayers.add(player1);
            pairedPlayers.add(opponent);

            pairings.push({
                tournament_id: tournamentID,
                round: bracket.rounds.length + 1,
                match_number: pairings.length + 1,
                players: [
                    playerMap.get(player1),
                    playerMap.get(opponent),
                ],
                is_tie: false
            });
        }
    }

    if (availablePlayers.length === 1) {
        const byePlayer = availablePlayers[0];
        pairings.push({
            round: bracket.rounds.length + 1,
            match_number: pairings.length + 1,
            players: [
                playerMap.get(byePlayer),
                { uuid: "BYE", name: "BYE", score: 0 }
            ],
            winner: byePlayer,
            is_tie: false
        });
    }

    return pairings;
};


const MatchupTable = ({
    bracket,
    tournament,
    user,
    onMatchClick
}: {
    bracket: Bracket;
    tournament: Tournament | null;
    user: User;
    onMatchClick: (match: Matchup) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [roundFilter, setRoundFilter] = useState<number | null>(null);
    const [completedFilter, setCompletedFilter] = useState<boolean | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const allMatchups: Matchup[] = bracket.rounds.flatMap(round => round.matches);

    const filteredMatchups = allMatchups.filter(match => {
        // Apply round filter
        if (roundFilter !== null && match.round !== roundFilter) {
            return false;
        }

        // Apply completed filter
        if (completedFilter !== null) {
            const isCompleted = !!match.winner;
            if (completedFilter !== isCompleted) {
                return false;
            }
        }

        // Apply search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return match.players.some(player =>
                player.name && player.name.toLowerCase().includes(lowerSearch)
            );
        }

        return true;
    });

    // Get all round numbers for filter dropdown
    const rounds = [...new Set(allMatchups.map(match => match.round))].sort((a, b) => a - b);

    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

    const resetFilters = () => {
        setSearchTerm("");
        setRoundFilter(null);
        setCompletedFilter(null);
    };

    const isUserAllowedToEdit = (tournament?.status !== "completed") &&
        ["owner", "admin", "scorekeeper"].includes(user.permission_level.toLowerCase());

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search players..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e153e] border border-[#947ed7]/40 focus:border-[#947ed7] focus:ring-2 focus:ring-[#947ed7]/30 focus:outline-none text-white shadow-md transition-all duration-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#947ed7]"
                            />
                        </div>
                    </div>

                    <div className="flex">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleFilters}
                            className="py-3 px-5 rounded-lg bg-[#1e153e] border border-[#947ed7]/40 hover:border-[#947ed7] text-white font-medium flex items-center gap-2 shadow-md transition-all duration-200"
                        >
                            <FontAwesomeIcon icon={faFilter} />
                            Filters
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`transition-transform duration-300 ${isFiltersOpen ? "rotate-180" : ""}`}
                            />
                        </motion.button>
                    </div>
                </div>

                {/* Filters Section */}
                <AnimatePresence>
                    {isFiltersOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 p-6 bg-[#1e153e] border border-[#947ed7]/40 rounded-lg shadow-lg"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="w-full md:w-auto">
                                    <label className="block text-sm font-medium text-[#947ed7] mb-2">Round</label>
                                    <select
                                        className="w-full md:w-48 px-4 py-2 rounded-lg bg-[#160a3a] border border-[#947ed7]/40 focus:border-[#947ed7] focus:ring-2 focus:ring-[#947ed7]/30 focus:outline-none text-white transition-all duration-200"
                                        value={roundFilter === null ? "" : roundFilter}
                                        onChange={(e) => setRoundFilter(e.target.value === "" ? null : Number(e.target.value))}
                                    >
                                        <option value="">All Rounds</option>
                                        {rounds.map(round => (
                                            <option key={round} value={round}>Round {round}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full md:w-auto">
                                    <label className="block text-sm font-medium text-[#947ed7] mb-2">Status</label>
                                    <select
                                        className="w-full md:w-48 px-4 py-2 rounded-lg bg-[#160a3a] border border-[#947ed7]/40 focus:border-[#947ed7] focus:ring-2 focus:ring-[#947ed7]/30 focus:outline-none text-white transition-all duration-200"
                                        value={completedFilter === null ? "" : completedFilter ? "completed" : "ongoing"}
                                        onChange={(e) => {
                                            if (e.target.value === "") setCompletedFilter(null);
                                            else setCompletedFilter(e.target.value === "completed");
                                        }}
                                    >
                                        <option value="">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="ongoing">Ongoing</option>
                                    </select>
                                </div>

                                <div className="w-full md:w-auto md:self-end">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full px-6 py-2 rounded-lg bg-[#947ed7] hover:bg-[#af9ce7] text-white font-medium transition-colors shadow-md"
                                        onClick={resetFilters}
                                    >
                                        Reset Filters
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-gradient-to-br from-[#1e153e] to-[#160a3a] rounded-xl shadow-2xl overflow-hidden border border-[#947ed7]/30">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#160a3a] text-white">
                                <th className="px-6 py-5 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/30">Match #</th>
                                <th className="px-6 py-5 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/30">Round</th>
                                <th className="px-6 py-5 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/30">Players</th>
                                <th className="px-6 py-5 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/30">Score</th>
                                <th className="px-6 py-5 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/30">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#947ed7]/20">
                            {filteredMatchups.map((match) => {
                                const isClickable = isUserAllowedToEdit;

                                return (
                                    <motion.tr
                                        key={`${match.round}-${match.match_number}`}
                                        whileHover={isClickable ? { backgroundColor: "rgba(148, 126, 215, 0.1)" } : {}}
                                        className={`${isClickable ? 'cursor-pointer' : ''} transition-all duration-200`}
                                        onClick={() => isClickable && onMatchClick(match)}
                                    >
                                        <td className="px-6 py-5 text-lg font-medium text-white">{match.match_number}</td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#2a1c58] text-white">
                                                Round {match.round}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-4">
                                                {match.players.map((player, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center ${player.uuid === match.winner ? 'text-[#af9ce7] font-bold' : player.name ? 'text-white' : 'text-gray-400 italic'}`}
                                                    >
                                                        {player.uuid === match.winner && (
                                                            <FontAwesomeIcon icon={faTrophy} className="mr-2 text-yellow-400" />
                                                        )}
                                                        {player.name || 'Empty slot'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-4">
                                                {match.players.map((player, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`${player.uuid === match.winner ? 'text-[#af9ce7] font-bold' : 'text-white'}`}
                                                    >
                                                        {player.score ?? '0'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {match.winner ? (
                                                <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium bg-green-900/30 text-green-300 border border-green-500/30">
                                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-500/30">
                                                    <FontAwesomeIcon icon={faGamepad} className="text-yellow-400" />
                                                    Ongoing
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredMatchups.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-xl mb-2">No matches found matching your filters</p>
                            <p className="text-gray-500 mb-6">Try adjusting your search criteria</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={resetFilters}
                                className="px-6 py-2 rounded-lg bg-[#947ed7]/20 hover:bg-[#947ed7]/30 text-white font-medium transition-colors border border-[#947ed7]/30"
                            >
                                Clear All Filters
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const SwissTournament = ({
    bracket,
    newPlayer = null,
    tournamentID = null,
    onClose = null,
    user,
    bracketViewType = BracketViewType.Normal,
}: {
    bracket: Bracket;
    newPlayer?: BracketPlayer | null;
    tournamentID?: number | null;
    onClose?: (() => void) | null;
    user: User;
    bracketViewType: BracketViewType;
}) => {
    const [viewType, setViewType] = useState<BracketViewType>(bracketViewType);
    const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.Bracket);
    const [movingPlayer, setMovingPlayer] = useState<MovingPlayer | null>(null);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<Matchup | null>(null);
    const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);
    const [selectedRound, setSelectedRound] = useState<number>(bracket.rounds.length);
    const [confirmModalInfo, setConfirmModalInfo] = useState<ConfirmModalInformation | null>(null);

    const handleMovePlayer: OnMovePlayer = (player) => {
        if (player === null) {
            setMovingPlayer(null);
            setViewType(BracketViewType.Normal);
        } else {
            setMovingPlayer(player);
            setViewType(BracketViewType.MovePlayer);
        }
    };

    const handleMatchClick = (match: Matchup) => {
        setSelectedMatch(match);
        setIsMatchupModalOpen(true);
    };

    const handleRoundSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRound(parseInt(e.target.value));
    };

    // Initialize with first round selected
    useEffect(() => {
        if (bracket && bracket.rounds && bracket.rounds.length > 0) {
            setSelectedRound(bracket.rounds.length);
        }
    }, [bracket]);

    // Floating status bar for move player mode
    const renderMovePlayerStatus = () => {
        if (viewType !== BracketViewType.MovePlayer || !movingPlayer) return null;

        return (
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#1e153e] text-white px-6 py-3 rounded-lg shadow-xl 
                  border border-[#947ed7]/40 z-20 flex items-center gap-4"
            >
                <div>
                    <span className="text-[#947ed7] font-medium">Moving Player: </span>
                    <span className="font-semibold">{movingPlayer.player.name}</span>
                </div>
                <button
                    onClick={() => handleMovePlayer(null)}
                    className="bg-[#947ed7]/20 hover:bg-[#947ed7]/40 p-2 rounded-full transition-colors"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </motion.div>
        );
    };

    // Round selection dropdown
    const renderRoundSelectionDropdown = () => {
        if (!bracket || !bracket.rounds) return null;

        return (
            <div className="bg-[#1e153e] p-4 rounded-lg shadow-md mb-6 flex items-center">
                <label className="text-[#947ed7] font-semibold mr-4">Select Round:</label>
                <select
                    value={selectedRound}
                    onChange={handleRoundSelection}
                    className="bg-[#160a3a] text-white border border-[#947ed7]/30 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#947ed7]"
                >
                    {bracket.rounds.map((_, index) => (
                        <option key={`round-option-${index}`} value={index + 1}>
                            Round {index + 1}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    useEffect(() => {
        const getTournament = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from("tournaments").select("*").eq("id", tournamentID).single();

            if (error) {
                console.error("Error fetching tournament data");
                return;
            }

            setTournament(data);
        };

        if (tournamentID) {
            getTournament();
        }
    }, [tournamentID]);

    const getUnfinishedMatches = () => {
        let counter = 0;

        bracket.rounds[selectedRound - 1].matches.forEach((match) => {
            if (!match.winner && !match.is_tie) {
                counter++
            };
        })

        return counter;
    }

    const startNextRoundIntermediate = () => {
        if (!tournamentID) return;

        let counter = getUnfinishedMatches();

        if (counter > 0) {
            const confirmModal: ConfirmModalInformation = {
                title: "Start Next Round",
                content: `Are you sure you want to move on to the next round once ${counter} matches are still in progress? This action cannot be undone and these matches will be treated as a tie.`,
                onCancel: () => setConfirmModalInfo(null),
                onSuccess: async () => {
                    for (let i = 0; i < bracket.rounds[selectedRound-1].matches.length; i++) {
                        var match = bracket.rounds[selectedRound-1].matches[i];
                        const supabase = createClient()

                        if (match.winner || match.is_tie) continue;
                        bracket.rounds[selectedRound-1].matches[i].is_tie=true;
                        supabase.from("tournament_matches")
                            .update({is_tie:true})
                            .eq("tournament_id", match.tournament_id)
                            .eq("match_number", match.match_number)
                            .eq("round", match.round)
                    }

                    startNextRound()
                },
            };
            setConfirmModalInfo(confirmModal);
        }
        else {
            startNextRound()
        }
    }


    const startNextRound = async () => {
        setConfirmModalInfo(null);
        if (!tournamentID) return;

        try {
            const supabase = createClient();

            const newPairings = generateNextRoundPairings(bracket, tournamentID);
            console.log(newPairings)
            for (let i = 0; i < newPairings.length; i++) {
                const { error } = await supabase
                    .from("tournament_matches")
                    .insert(newPairings[i])

                if (error) {
                    console.error("Error updating bracket:", error);
                    continue;
                }
            }



            console.log("Next round started successfully!");
        } catch (error) {
            console.error("Error starting next round:", error);
        }
    };

    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh] bg-[#160a3a]/50 rounded-lg p-8">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#947ed7] mb-2">No Tournament Data</h3>
                    <p className="text-white/70">The bracket information is not available.</p>
                </div>
            </div>
        );
    }

    const renderGridView = () => {
        const round = bracket.rounds[selectedRound - 1];
        if (!round) return null;

        // Calculate number of matches
        const matchCount = round.matches.length;

        // Create chunks of matches for the grid layout
        const matchChunks = [];
        for (let i = 0; i < matchCount; i += 3) {
            matchChunks.push(round.matches.slice(i, i + 3));
        }

        return (
            <div className="w-4/5 mx-auto">
                <ConfirmModal information={confirmModalInfo} />
                {renderRoundSelectionDropdown()}

                <div className="bg-[#160a3a]/60 rounded-lg p-6 border border-[#947ed7]/20 mb-6">
                    <h2 className="text-2xl font-bold text-[#947ed7] mb-6 text-center">Round {selectedRound}</h2>

                    {/* Match grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {round.matches.map((match, matchIndex) => {
                            const individualViewType =
                                (movingPlayer && movingPlayer?.fromRound === selectedRound)
                                    ? viewType
                                    : BracketViewType.Normal;

                            return (
                                <div
                                    key={`match-${match.id || matchIndex}`}
                                    className="bg-[#1e153e] p-4 rounded-lg border border-[#947ed7]/10 shadow-md hover:shadow-lg hover:border-[#947ed7]/30 transition-all"
                                >
                                    <MatchupElement
                                        match={match}
                                        viewType={individualViewType}
                                        newPlayer={newPlayer}
                                        tournament={tournament}
                                        bracket={bracket}
                                        onMovePlayer={handleMovePlayer}
                                        movingPlayer={movingPlayer}
                                        onClose={onClose}
                                        user={user}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };
    console.log(bracket)

    return (
        <div className="relative h-[89vh] bg-[#160a3a]/30">
            {renderMovePlayerStatus()}
            <header className="bg-[#160a3a] w-4/5 mx-auto p-4 rounded-b-lg border-b border-[#947ed7]/30 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[#947ed7]">
                        {tournament?.name || 'Round Robin Tournament'}
                    </h1>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setDisplayMode(DisplayMode.Bracket)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${displayMode === DisplayMode.Bracket
                                ? 'bg-[#947ed7] text-white shadow-md'
                                : 'bg-[#1e153e] text-[#947ed7] hover:bg-[#1e153e]/80'
                                }`}
                        >
                            <FontAwesomeIcon icon={faSitemap} />
                            <span className="hidden sm:inline">Grid</span>
                        </button>

                        <button
                            onClick={() => setDisplayMode(DisplayMode.List)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${displayMode === DisplayMode.List
                                ? 'bg-[#947ed7] text-white shadow-md'
                                : 'bg-[#1e153e] text-[#947ed7] hover:bg-[#1e153e]/80'
                                }`}
                        >
                            <FontAwesomeIcon icon={faListUl} />
                            <span className="hidden sm:inline">Table</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="h-[calc(89vh-60px)] overflow-auto pb-16 p-6">
                <AnimatePresence mode="wait">
                    {displayMode === DisplayMode.Bracket ? (
                        <motion.div
                            key="bracket"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="bracket-container"
                        >
                            {renderGridView()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="w-4/5 mx-auto"
                        >
                            <MatchupTable
                                bracket={bracket}
                                tournament={tournament}
                                user={user}
                                onMatchClick={handleMatchClick}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectedRound == bracket.rounds.length && (
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-6 right-6 bg-[#947ed7] hover:bg-[#7b68b8] text-white px-6 py-3 rounded-full 
            shadow-lg border border-[#b9a6ed]/40 flex items-center gap-2 transition-all duration-300
            hover:shadow-xl hover:transform hover:scale-105"
                    onClick={startNextRoundIntermediate}
                >
                    <FontAwesomeIcon icon={faArrowRight} />
                    <span className="font-semibold">Start Next Round</span>
                </motion.button>
            )}

            {selectedMatch && tournament && (
                <MatchupModal
                    matchup={selectedMatch}
                    isOpen={isMatchupModalOpen}
                    setOpen={setIsMatchupModalOpen}
                    user={user}
                    tournament_type={tournament?.tournament_type}
                />
            )}
        </div>
    );
};