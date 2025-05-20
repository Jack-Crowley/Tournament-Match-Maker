"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tournament } from "@/types/tournamentTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faTimes,
    faExclamationTriangle,
    faPlus,
    faUser,
    faHistory,
    faTrophy,
    faHandshake,
    faInfoCircle,
    faChevronDown,
    faEdit,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { createClient } from "@/utils/supabase/client";
import { ScoreReport } from "@/types/scoreReport";
import { Bracket, Matchup } from "@/types/bracketTypes";
import { User } from "@/types/userType";
import { useMessage } from "@/context/messageContext";

export function ScoreReports({ tournamentID, bracket, user, tournament }: {
    tournamentID: number,
    bracket: Bracket,
    user: User,
    tournament: Tournament
}) {
    const [userRole, setUserRole] = useState<"player" | "admin" | null>(null);
    const [scoreReports, setScoreReports] = useState<ScoreReport[]>([]);
    const [matches, setMatches] = useState<Matchup[]>([]);
    const [showNewReportForm, setShowNewReportForm] = useState(false);
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

    const [editingReportId, setEditingReportId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        reporter_score: 0,
        opponent_score: 0,
        winner_id: "",
        is_tie: false
    });

    const supabaseClient = useRef(createClient());

    const { triggerMessage } = useMessage()

    const [reportFormData, setReportFormData] = useState({
        match_id: "",
        reporter_score: 0,
        opponent_score: 0,
        winner_id: "",
        opponent_id: "",
        is_tie: false
    });

    useEffect(() => {
        setUserRole(user.permission_level == "admin" || user.permission_level == "owner" ? "admin" : "player")

        async function loadData() {
            const { data, error } = await supabaseClient.current
                .from("score_reports")
                .select("*")
                .eq("tournament_id", tournamentID);

            if (error) {
                console.log(error.message);
                return;
            }

            setScoreReports(data);

            if (user.permission_level == "admin" || user.permission_level == "owner") {
                const userMatches = bracket.rounds
                    .flatMap(round => round.matches)
                setMatches(userMatches);
            }
            else {
                const userMatches = bracket.rounds
                    .flatMap(round => round.matches)
                    .filter(match => match.players.some(player => player.uuid === user.uuid))
                setMatches(userMatches);
            }
        }

        loadData();

        // Set up real-time subscription
        const subscription = supabaseClient.current
            .channel('score_reports_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'score_reports',
                filter: `tournament_id=eq.${tournamentID}`
            }, (payload) => {
                // Handle different event types
                if (payload.eventType === 'INSERT') {
                    setScoreReports(prevReports => [...prevReports, payload.new as ScoreReport]);
                    triggerMessage("New score report submitted", "green");
                }
                else if (payload.eventType === 'UPDATE') {
                    setScoreReports(prevReports =>
                        prevReports.map(report =>
                            report.id === payload.new.id ? payload.new as ScoreReport : report
                        )
                    );
                    if (payload.new.status === 'accepted') {
                        triggerMessage("Score report was accepted", "green");
                    }
                }
                else if (payload.eventType === 'DELETE') {
                    setScoreReports(prevReports =>
                        prevReports.filter(report => report.id !== payload.old.id)
                    );
                    triggerMessage("Score report was removed", "yellow");
                }
            })
            .subscribe();

        // Clean up subscription when component unmounts
        return () => {
            subscription.unsubscribe();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bracket.rounds, tournamentID, user.permission_level, user.uuid]);

    const getOpponentForReport = (report: any) => {
        return report.scores.find((s: any) => s.player_uuid !== user.uuid)?.player_uuid;
    };

    const getMatchDetails = (matchId: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return "Unknown Match";

        return `Round ${match.round}: ${match.players[0]?.name || 'TBD'} vs ${match.players[1]?.name || 'TBD'}`;
    };

    const getPlayerName = (report: ScoreReport, opponent: boolean) => {
        const ma = matches.find(match => match.id == report.match_id);
        if (!ma) return "";

        const pla = ma.players.find(player => (player.uuid == user.uuid) == !opponent);
        if (!pla) return "";

        return pla.name;
    };

    const getPlayerNameAdmin = (report: ScoreReport, index: number) => {
        const ma = matches.find(match => match.id == report.match_id);
        if (!ma) return "";

        const pla = ma.players[index]
        if (!pla) return "";

        return pla.name;
    };

    const getWinnerName = (report: ScoreReport) => {
        if (report.is_tie) return "Tie";

        const ma = matches.find(match => match.id == report.match_id);
        if (!ma) return "";

        const pla = ma.players.find(player => player.uuid == report.winner);
        if (!pla) return "";

        return pla.name;
    };

    const submitScoreReport = async () => {
        let scoreReport: any = {
            match_id: reportFormData.match_id,
            tournament_id: tournamentID,
            is_tie: reportFormData.is_tie,
            reporter_id: user.uuid,
            scores: [
                {
                    player_uuid: user.uuid,
                    score: reportFormData.reporter_score,
                },
                {
                    player_uuid: reportFormData.opponent_id,
                    score: reportFormData.opponent_score
                }
            ],
            status: "pending",
            winner: reportFormData.is_tie ? "tie" : reportFormData.winner_id
        }

        const { error } = await supabaseClient.current.from("score_reports").insert(scoreReport)

        if (error) {
            triggerMessage("Error submitting score report: " + error.message, "red");
            return;
        }

        setShowNewReportForm(false);
        setReportFormData({
            match_id: "",
            reporter_score: 0,
            opponent_score: 0,
            winner_id: "",
            opponent_id: "",
            is_tie: false
        });
    };

    const acceptScoreReport = async (reportId: string) => {
        const report = scoreReports.find(re => re.id == reportId)

        if (!report || report == undefined) {
            triggerMessage("Could not find report", "red")
            return;
        }

        const { data: originalMatch } = await supabaseClient.current.from("tournament_matches").select("*").eq("id", report.match_id).single()

        const finalMatch: any = {}

        // Handle winner or tie
        if (report.is_tie) {
            finalMatch["is_tie"] = true;
            finalMatch["winner"] = null;
        } else if (report.winner) {
            finalMatch["winner"] = report.winner;
            finalMatch["is_tie"] = false;
        }

        const players = originalMatch.players;

        const updatedPlayers = players.map((player: any) => ({
            ...player,
            score: report ? report.scores.find((p: any) => p.player_uuid === player.uuid)?.score ?? player.score : 0
        }));

        finalMatch["players"] = updatedPlayers

        await supabaseClient.current.from("tournament_matches").update(finalMatch).eq("id", report.match_id).single()

        // Handle single elimination tournament winner propagation
        if (tournament.tournament_type === "single" && report.winner && !report.is_tie) {
            console.log("Starting single elimination propagation");
            console.log("Tournament type:", tournament.tournament_type);
            console.log("Winner:", report.winner);
            
            const winnerPlayer = updatedPlayers.find((p: { uuid: string }) => p.uuid === report.winner);
            console.log("Winner player found:", winnerPlayer);
            
            if (winnerPlayer) {
                console.log("Current match:", originalMatch);
                console.log("Looking for next match in round:", originalMatch.round + 1);
                console.log("Looking for match number:", Math.ceil(originalMatch.match_number / 2));
                
                const { data: nextMatch, error: nextMatchError } = await supabaseClient.current
                    .from("tournament_matches")
                    .select("*")
                    .eq("tournament_id", tournamentID)
                    .eq("round", originalMatch.round + 1)
                    .eq("match_number", Math.ceil(originalMatch.match_number / 2))
                    .single();

                if (nextMatchError && nextMatchError.code !== "PGRST116") {
                    console.error("Error finding next match:", nextMatchError);
                }
                
                console.log("Next match found:", nextMatch);
                
                if (nextMatch) {
                    const currentMatchupPlayers = nextMatch.players || [];
                    const playerIndex = 1 - originalMatch.match_number % 2;
                    console.log("Player index for next match:", playerIndex);
                    console.log("Current players in next match:", currentMatchupPlayers);

                    // Add placeholder players if needed
                    while (currentMatchupPlayers.length < 2) {
                        currentMatchupPlayers.push({
                            uuid: "",
                            name: "",
                            email: "",
                            account_type: "placeholder",
                        });
                    }

                    // Update the player in the next match
                    currentMatchupPlayers[playerIndex] = {
                        ...winnerPlayer,
                        score: 0  // Reset score to 0
                    };
                    console.log("Updated players array:", currentMatchupPlayers);

                    const { error: updateError } = await supabaseClient.current
                        .from("tournament_matches")
                        .update({ players: currentMatchupPlayers })
                        .eq("id", nextMatch.id);

                    if (updateError) {
                        console.error("Error updating next match:", updateError);
                    } else {
                        console.log("Successfully updated next match");
                    }
                } else {
                    console.log("No next match found - checking if last round");
                    
                    // Check if this is the last round
                    if (tournament.max_rounds && originalMatch.round >= tournament.max_rounds) {
                        console.log("This is the final match - no propagation needed");
                        return;
                    }

                    console.log("Creating new match for next round");
                    
                    // Create placeholder player
                    const placeholderPlayer = {
                        uuid: "",
                        name: "",
                        email: "",
                        account_type: "placeholder",
                    };

                    // Create propagated player with reset score
                    const propagatedPlayer = {
                        ...winnerPlayer,
                        score: 0
                    };

                    // Set up players array based on match number
                    const players = originalMatch.match_number % 2 === 0
                        ? [placeholderPlayer, propagatedPlayer]
                        : [propagatedPlayer, placeholderPlayer];

                    // Create new match
                    const newMatch = {
                        tournament_id: tournamentID,
                        match_number: Math.ceil(originalMatch.match_number / 2),
                        players,
                        round: originalMatch.round + 1,
                        is_tie: false
                    };

                    console.log("Creating new match:", newMatch);

                    const { error: insertError } = await supabaseClient.current
                        .from("tournament_matches")
                        .insert(newMatch);

                    if (insertError) {
                        console.error("Error creating new match:", insertError);
                    } else {
                        console.log("Successfully created new match");
                    }
                }
            }
        }

        const { error } = await supabaseClient.current.from("score_reports").update({ status: "accepted" }).eq("id", reportId).single()

        if (error) {
            triggerMessage(error.message, "red")
        }
    };

    // Delete score report function
    const deleteScoreReport = async (reportId: any) => {
        const report = scoreReports.find(r => r.id === reportId);

        // Only delete if it's the user's report and it's not accepted
        if (report && report.reporter_id === user.uuid && report.status === "pending") {
            const { error } = await supabaseClient.current
                .from("score_reports")
                .delete()
                .eq("id", reportId);

            if (error) {
                triggerMessage("Error deleting report: " + error.message, "red");
            } else {
                triggerMessage("Score report deleted successfully", "green");
            }
        } else {
            triggerMessage("You can only delete your own pending reports", "red");
        }
    };

    // Start editing a report
    const startEditReport = (report: any) => {
        if (report.reporter_id !== user.uuid || report.status !== "pending") {
            triggerMessage("You can only edit your own pending reports", "red");
            return;
        }

        const playerScore = report.scores.find((s: any) => s.player_uuid === user.uuid);
        const opponentScore = report.scores.find((s: any) => s.player_uuid !== user.uuid);

        setEditFormData({
            reporter_score: playerScore ? playerScore.score : 0,
            opponent_score: opponentScore ? opponentScore.score : 0,
            winner_id: report.winner || "",
            is_tie: report.is_tie
        });

        setEditingReportId(report.id);
    };

    // Cancel editing
    const cancelEditReport = () => {
        setEditingReportId(null);
        setEditFormData({
            reporter_score: 0,
            opponent_score: 0,
            winner_id: "",
            is_tie: false
        });
    };

    // Save edited report
    const saveEditedReport = async () => {
        const report = scoreReports.find(r => r.id === editingReportId);
        if (!report) return;

        const opponentId = report.scores.find(s => s.player_uuid !== user.uuid)?.player_uuid;

        const updatedReport = {
            is_tie: editFormData.is_tie,
            scores: [
                {
                    player_uuid: user.uuid,
                    score: editFormData.reporter_score,
                },
                {
                    player_uuid: opponentId,
                    score: editFormData.opponent_score
                }
            ],
            winner: editFormData.winner_id || null
        };

        const { error } = await supabaseClient.current
            .from("score_reports")
            .update(updatedReport)
            .eq("id", editingReportId);

        if (error) {
            triggerMessage("Error updating report: " + error.message, "red");
        } else {
            triggerMessage("Score report updated successfully", "green");
            setEditingReportId(null);
        }
    };

    const getGroupedReports = () => {
        const grouped: { [key: string]: ScoreReport[] } = {};

        scoreReports.forEach(report => {
            if (!grouped[report.match_id]) {
                grouped[report.match_id] = [];
            }
            grouped[report.match_id].push(report);
        });

        return grouped;
    };

    function doReportsMatch(reports: ScoreReport[]): boolean {
        if (reports.length !== 2) return false;

        const [report1, report2] = reports;

        // Check if both reports agree on tie status
        if (report1.is_tie !== report2.is_tie) return false;

        // If not a tie, check if winner matches
        if (!report1.is_tie && report1.winner !== report2.winner) return false;

        const scoresMatch = report1.scores.every(score1 => {
            const score2 = report2.scores.find(s => s.player_uuid === score1.player_uuid);
            return score2 && score2.score === score1.score;
        });

        return scoresMatch;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
            case "auto-accepted":
                return "text-green-500";
            case "disputed":
                return "text-red-500";
            default:
                return "text-yellow-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "accepted":
            case "auto-accepted":
                return faCheck;
            case "disputed":
                return faExclamationTriangle;
            default:
                return faTimes;
        }
    };

    const toggleExpandMatch = (matchId: string) => {
        setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
    };

    const setWinner = (playerId: string) => {
        setReportFormData({
            ...reportFormData,
            winner_id: playerId,
            is_tie: false
        });
    };

    const setTie = () => {
        setReportFormData({
            ...reportFormData,
            winner_id: "",
            is_tie: true
        });
    };

    const getOpponentInfo = () => {
        if (!reportFormData.match_id) return null;

        const match = matches.find(m => m.id === Number(reportFormData.match_id));
        if (!match) return null;

        return match.players.find(p => p.uuid !== user.uuid);
    };

    const changeMatch = (id: string) => {
        const opponent = matches.find((match) => match.id.toString() == id)?.players.find(player => player.uuid !== user.uuid)?.uuid

        if (!opponent) return;
        setReportFormData({ ...reportFormData, match_id: id, opponent_id: opponent })
    }

    const opponent = getOpponentInfo();

    return (
        <div className="min-h-screen text-white p-4 md:p-8 bg-gradient-to-br from-[#170f36] to-[#1e184d]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-purple-800/30 pb-4">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#a993ff] to-[#5e44c9] bg-clip-text text-transparent">
                            Score Reports
                        </h1>
                        <p className="text-purple-300 mt-1">
                            {tournament.name ? `Tournament: ${tournament.name}` : 'Manage match results'}
                        </p>
                    </div>
                </div>


                {/* Player Report Form */}
                {userRole === "player" && (
                    <div className="mb-8">
                        {!showNewReportForm ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowNewReportForm(true)}
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-[#7458da] to-[#5a41ad] text-white rounded-lg transition-all shadow-md hover:shadow-lg border border-[#4a3989]"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Submit New Score Report
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="p-6 bg-[#22154F]/80 rounded-lg shadow-lg border border-[#4a3989]/50 backdrop-blur-sm"
                            >
                                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#a993ff] to-[#7458da] bg-clip-text text-transparent">
                                    New Score Report
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block mb-2 text-purple-200">Select Match</label>
                                        <select
                                            value={reportFormData.match_id}
                                            onChange={(e) => changeMatch(e.target.value)}
                                            className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80] focus:border-[#7458da] focus:outline-none transition-colors"
                                        >
                                            <option value="">Select a match...</option>
                                            {matches.filter(ma => !scoreReports.some(report => Number(report.match_id) === ma.id && report.reporter_id === user.uuid)).map(match => (
                                                <option key={match.id} value={match.id}>
                                                    Round {match.round}: vs {match.players.find(player => player.uuid !== user.uuid)?.name || 'TBD'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2 text-purple-200">Your Score</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={reportFormData.reporter_score}
                                                onChange={(e) => setReportFormData({ ...reportFormData, reporter_score: parseInt(e.target.value) || 0 })}
                                                className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80] focus:border-[#7458da] focus:outline-none transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-purple-200">Opponent&apos;s Score</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={reportFormData.opponent_score}
                                                onChange={(e) => setReportFormData({ ...reportFormData, opponent_score: parseInt(e.target.value) || 0 })}
                                                className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80] focus:border-[#7458da] focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Winner Selection */}
                                <div className="mb-6">
                                    <label className="block mb-3 text-purple-200">Select Winner</label>
                                    <div className={`grid ${tournament.tournament_type === "single" ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
                                        <button
                                            onClick={() => setWinner(user.uuid)}
                                            className={`p-4 rounded-lg border ${reportFormData.winner_id === user.uuid && !reportFormData.is_tie
                                                ? 'bg-green-800/30 border-green-600'
                                                : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                } flex items-center justify-center transition-colors`}
                                        >
                                            <FontAwesomeIcon icon={faTrophy} className="mr-2 text-yellow-400" />
                                            <span className="font-medium">You Won</span>
                                        </button>

                                        {tournament.tournament_type !== "single" && (
                                            <button
                                                onClick={setTie}
                                                className={`p-4 rounded-lg border ${reportFormData.is_tie
                                                    ? 'bg-blue-800/30 border-blue-600'
                                                    : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                    } flex items-center justify-center transition-colors`}
                                            >
                                                <FontAwesomeIcon icon={faHandshake} className="mr-2 text-blue-400" />
                                                <span className="font-medium">Tie Game</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => opponent && setWinner(opponent.uuid)}
                                            disabled={!opponent}
                                            className={`p-4 rounded-lg border ${opponent && reportFormData.winner_id === opponent.uuid && !reportFormData.is_tie
                                                ? 'bg-red-800/30 border-red-600'
                                                : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                } flex items-center justify-center transition-colors ${!opponent ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FontAwesomeIcon icon={faTrophy} className="mr-2 text-purple-400" />
                                            <span className="font-medium">{opponent ? opponent.name : 'Opponent'} Won</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => setShowNewReportForm(false)}
                                        className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitScoreReport}
                                        disabled={!reportFormData.match_id || (!reportFormData.is_tie && !reportFormData.winner_id)}
                                        className={`px-5 py-2 bg-gradient-to-r from-[#7458da] to-[#5a41ad] rounded-lg hover:from-[#6448c0] hover:to-[#4a3195] transition-colors border border-[#4a3989] ${!reportFormData.match_id || (!reportFormData.is_tie && !reportFormData.winner_id)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                            }`}
                                    >
                                        Submit Report
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Score Reports Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#a993ff] to-[#7458da] bg-clip-text text-transparent flex items-center">
                        <FontAwesomeIcon icon={faHistory} className="mr-2 text-[#7458da]" />
                        {userRole === "player" ? "Your Match History" : "All Score Reports"}
                    </h2>

                    <AnimatePresence>
                        {Object.entries(getGroupedReports()).map(([matchId, reports]) => {
                            if (userRole === "player" && !reports.some(r => r.reporter_id === user?.uuid)) {
                                return null;
                            }

                            const matchReportsMatch = doReportsMatch(reports);
                            const matchStatus = reports[0]?.status;
                            const isExpanded = expandedMatchId === matchId;

                            return (
                                <motion.div
                                    key={matchId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-6 bg-[#22154F]/80 rounded-lg shadow-lg border border-[#4a3989]/50 backdrop-blur-sm overflow-hidden"
                                >
                                    <div
                                        className="p-5 cursor-pointer hover:bg-[#2a1b5f]/30 transition-colors"
                                        onClick={() => toggleExpandMatch(matchId)}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between md:items-center">
                                            <div className="flex items-center mb-2 md:mb-0">
                                                <h3 className="text-lg font-semibold text-purple-100">{getMatchDetails(Number(matchId))}</h3>
                                                <FontAwesomeIcon
                                                    icon={faChevronDown}
                                                    className={`ml-2 text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                            <div className={`flex items-center ${getStatusColor(matchStatus)} px-3 py-1 rounded-full bg-[#2a1b5f]/50 border border-[#3d2a80]/50`}>
                                                <FontAwesomeIcon icon={getStatusIcon(matchStatus)} className="mr-2" />
                                                <span>
                                                    {matchStatus === "accepted" || matchStatus === "auto-accepted"
                                                        ? "Accepted"
                                                        : matchStatus === "disputed"
                                                            ? "Disputed"
                                                            : "Pending"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="px-5 pb-5"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {reports.map(report => (
                                                        <motion.div
                                                            key={report.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="p-4 bg-[#2a1b5f]/70 rounded-lg border border-[#3d2a80]/70"
                                                        >
                                                            {userRole != "admin" && (
                                                                <div className="flex justify-between mb-3">
                                                                    <span className="font-semibold text-purple-200">
                                                                        <FontAwesomeIcon icon={faUser} className="mr-2 text-purple-400" />
                                                                        {getPlayerName(report, false)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-300">
                                                                        {new Date(report.created_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {userRole == "admin" && (
                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    {report.scores.map((scoreObj, idx) => {
                                                                        const playerName = getPlayerNameAdmin(report, idx)
                                                                        return (
                                                                            <div
                                                                                key={scoreObj.player_uuid}
                                                                                className="p-3 rounded-lg bg-[#3d2a80]/40 border border-[#4a3989]/40"
                                                                            >
                                                                                <div className="text-xs text-purple-300 mb-1">{playerName}</div>
                                                                                <div className="text-2xl font-bold text-center text-white">{scoreObj.score}</div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {userRole == "player" && (
                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    <div className="p-3 rounded-lg bg-[#3d2a80]/40 border border-[#4a3989]/40">
                                                                        <div className="text-xs text-purple-300 mb-1">
                                                                            {getPlayerName(report, false)}
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-center text-white">
                                                                            {report.scores.find(score => score.player_uuid === user.uuid)?.score || 0}
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-3 rounded-lg bg-[#3d2a80]/40 border border-[#4a3989]/40">
                                                                        <div className="text-xs text-purple-300 mb-1">
                                                                            {getPlayerName(report, true)}
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-center text-white">
                                                                            {report.scores.find(score => score.player_uuid !== user.uuid)?.score || 0}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}


                                                            {(() => {
                                                                const isViewerWinner = user?.uuid && report.winner === user.uuid;
                                                                const resultClass = report.is_tie
                                                                    ? 'bg-blue-900/20 border border-blue-700/40'
                                                                    : isViewerWinner
                                                                        ? 'bg-green-900/20 border border-green-700/40'
                                                                        : 'bg-red-900/20 border border-red-700/40';
                                                                const iconClass = report.is_tie ? 'text-blue-400' : 'text-yellow-400';

                                                                return (
                                                                    <div className={`p-3 rounded-lg ${resultClass} flex items-center justify-center`}>
                                                                        <FontAwesomeIcon
                                                                            icon={report.is_tie ? faHandshake : faTrophy}
                                                                            className={`mr-2 ${iconClass}`}
                                                                        />
                                                                        <span className="font-medium">
                                                                            {report.is_tie
                                                                                ? "Tie Game"
                                                                                : `Winner: ${getWinnerName(report)}`}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {userRole === "player" && report.reporter_id === user.uuid && report.status === "pending" && editingReportId !== report.id && (
                                                                <div className="mt-3 flex justify-end space-x-2">
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            startEditReport(report);
                                                                        }}
                                                                        className="px-3 py-1 bg-blue-700/60 hover:bg-blue-600/80 rounded text-sm flex items-center border border-blue-500/50 shadow-sm"
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                                                                        Edit
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm("Are you sure you want to delete this report?")) {
                                                                                deleteScoreReport(report.id);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-1 bg-red-700/60 hover:bg-red-600/80 rounded text-sm flex items-center border border-red-500/50 shadow-sm"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                                                                        Delete
                                                                    </motion.button>
                                                                </div>
                                                            )}

                                                            {editingReportId === report.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-4 p-4 bg-[#3d2a80]/40 rounded-lg border border-[#4a3989]/70"
                                                                >
                                                                    <h4 className="text-purple-200 font-semibold mb-3">Edit Score Report</h4>

                                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                                        <div>
                                                                            <label className="block mb-1 text-xs text-purple-300">Your Score</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={editFormData.reporter_score}
                                                                                onChange={(e) => setEditFormData({ ...editFormData, reporter_score: parseInt(e.target.value) || 0 })}
                                                                                className="w-full p-2 bg-[#2a1b5f] rounded border border-[#3d2a80] focus:border-[#7458da] focus:outline-none transition-colors text-white"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block mb-1 text-xs text-purple-300">Opponent&apos;s Score</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={editFormData.opponent_score}
                                                                                onChange={(e) => setEditFormData({ ...editFormData, opponent_score: parseInt(e.target.value) || 0 })}
                                                                                className="w-full p-2 bg-[#2a1b5f] rounded border border-[#3d2a80] focus:border-[#7458da] focus:outline-none transition-colors text-white"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-4">
                                                                        <label className="block mb-2 text-xs text-purple-300">Select Winner</label>
                                                                        <div className={`grid ${tournament.tournament_type === "single" ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                                                                            <button
                                                                                onClick={() => setEditFormData({ ...editFormData, winner_id: user.uuid, is_tie: false })}
                                                                                className={`p-2 rounded border ${editFormData.winner_id === user.uuid && !editFormData.is_tie
                                                                                    ? 'bg-green-800/30 border-green-600'
                                                                                    : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                                                    } flex items-center justify-center transition-colors text-sm`}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrophy} className="mr-1 text-yellow-400" />
                                                                                <span>You Won</span>
                                                                            </button>

                                                                            {tournament.tournament_type !== "single" && (
                                                                                <button
                                                                                    onClick={() => setEditFormData({ ...editFormData, is_tie: true, winner_id: "" })}
                                                                                    className={`p-2 rounded border ${editFormData.is_tie
                                                                                        ? 'bg-blue-800/30 border-blue-600'
                                                                                        : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                                                        } flex items-center justify-center transition-colors text-sm`}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faHandshake} className="mr-1 text-blue-400" />
                                                                                    <span>Tie Game</span>
                                                                                </button>
                                                                            )}

                                                                            <button
                                                                                onClick={() => {
                                                                                    const opponent = getOpponentForReport(report);
                                                                                    if (opponent) setEditFormData({ ...editFormData, winner_id: opponent, is_tie: false });
                                                                                }}
                                                                                className={`p-2 rounded border ${editFormData.winner_id && editFormData.winner_id !== user.uuid && !editFormData.is_tie
                                                                                    ? 'bg-red-800/30 border-red-600'
                                                                                    : 'bg-[#2a1b5f]/50 border-[#3d2a80] hover:bg-[#3d2a80]/50'
                                                                                    } flex items-center justify-center transition-colors text-sm`}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrophy} className="mr-1 text-purple-400" />
                                                                                <span>Opponent Won</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-end space-x-3">
                                                                        <button
                                                                            onClick={cancelEditReport}
                                                                            className="px-4 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors border border-gray-600 text-sm"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={saveEditedReport}
                                                                            disabled={!editFormData.is_tie && !editFormData.winner_id}
                                                                            className={`px-4 py-1 bg-gradient-to-r from-[#7458da] to-[#5a41ad] rounded hover:from-[#6448c0] hover:to-[#4a3195] transition-colors border border-[#4a3989] text-sm ${!editFormData.is_tie && !editFormData.winner_id ? 'opacity-50 cursor-not-allowed' : ''
                                                                                }`}
                                                                        >
                                                                            Save Changes
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {/* Admin Actions */}
                                                {userRole === "admin" && matchStatus !== "accepted" && matchStatus !== "auto-accepted" && (
                                                    <div className="mt-5 flex flex-col md:flex-row items-center gap-4">
                                                        {reports.length === 2 && !matchReportsMatch && (
                                                            <div className="flex-1 bg-red-900/30 p-3 rounded-lg text-sm border border-red-700/40 flex items-center">
                                                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-red-400" />
                                                                Reports don&apos;t match. Manual review required.
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                                                            {reports.map(report => (
                                                                <button
                                                                    key={`accept-${report.id}`}
                                                                    onClick={() => acceptScoreReport(report.id)}
                                                                    className="px-4 py-2 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-500 transition-colors border border-green-600 flex items-center shadow-md"
                                                                >
                                                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                                                    Accept {getPlayerName(report, false)}&apos;s Report
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* No reports message */}
                    {Object.keys(getGroupedReports()).length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-10 rounded-lg bg-[#22154F]/50 border border-[#4a3989]/30"
                        >
                            <FontAwesomeIcon icon={faInfoCircle} className="text-4xl text-purple-400 mb-3" />
                            <p className="text-purple-200">No score reports found.</p>
                            {userRole === "player" && (
                                <p className="text-purple-400 text-sm mt-2">
                                    Submit your first score report to get started.
                                </p>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}