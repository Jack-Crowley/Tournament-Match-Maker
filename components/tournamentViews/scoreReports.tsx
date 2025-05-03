"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tournament } from "@/types/tournamentTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faExclamationTriangle, faPlus, faUser, faUserShield, faHistory } from "@fortawesome/free-solid-svg-icons";
import { createClient } from "@/utils/supabase/client";
import { ScoreReport } from "@/types/scoreReport";
import { Bracket, Matchup } from "@/types/bracketTypes";
import { User } from "@/types/userType";

export function ScoreReports({ tournamentID, bracket, user, tournament }: { tournamentID: number, bracket: Bracket, user: User, tournament: Tournament }) {
    if(tournament.id) {}
    const [userRole, setUserRole] = useState<"player" | "admin">("player");
    const [scoreReports, setScoreReports] = useState<ScoreReport[]>([]);
    const [matches, setMatches] = useState<Matchup[]>([]);
    const [showNewReportForm, setShowNewReportForm] = useState(false);

    const [reportFormData, setReportFormData] = useState({
        match_id: "",
        reporter_score: 0,
        opponent_score: 0,
        winner_id: "",
    });

    const [autoAcceptSetting, setAutoAcceptSetting] = useState({
        enabled: false,
        requireBothReports: true
    });

    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const userMatches = bracket.rounds
                .flatMap(round => round.matches)
                .filter(match => match.players.some(player => player.uuid === user.uuid));

            setMatches(userMatches);

            const {data, error} = await supabase.from("score_reports").select("*").eq("reporter_id", user.uuid).eq("tournament_id", tournamentID)

            if (error) {
                console.log(error.message)
                return;
            }

            setScoreReports(data)
        }

        loadData()
    }, [bracket.rounds, supabase, tournamentID, user.uuid]);

    const toggleRole = () => {
        setUserRole(userRole === "player" ? "admin" : "player");
    };

    const getMatchDetails = (matchId: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return "Unknown Match";

        return `Round ${match.round}: ${match.players[0].name} vs ${match.players[1].name}`;
    };

    const getPlayerName = (report : ScoreReport, opponent : boolean) => {
        const ma = matches.find(match => match.id == report.match_id)

        if (!ma) return ""

        const pla = ma.players.find(player => (player.uuid == user.uuid) == !opponent)

        if (!pla) return ""

        return pla.name
    }


    const getWinnerName = (report : ScoreReport) => {
        const ma = matches.find(match => match.id == report.match_id)

        if (!ma) return ""

        const pla = ma.players.find(player => player.uuid == report.winner)

        if (!pla) return ""

        return pla.name
    }

    const submitScoreReport = async () => {};

    const acceptScoreReport = (reportId: string) => {if (reportId) {}};

    
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
    
        const scoresMatch = report1.scores.every(score1 => {
            const score2 = report2.scores.find(s => s.player_uuid === score1.player_uuid);
            return score2 && score2.score === score1.score;
        });
    
        const winnerMatch = report1.winner === report2.winner;
    
        return scoresMatch && winnerMatch;
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

    return (
        <div className="min-h-screen text-white p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-[#7458da]">Score Reports</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleRole}
                            className="flex items-center px-4 py-2 bg-[#22154F] text-white rounded-lg hover:bg-[#2a1b5f] transition-colors"
                        >
                            <FontAwesomeIcon
                                icon={userRole === "admin" ? faUser : faUserShield}
                                className="mr-2"
                            />
                            {userRole === "admin" ? "Switch to Player View" : "Switch to Admin View"}
                        </button>
                    </div>
                </div>

                {/* Admin Settings Section */}
                {userRole === "admin" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8 p-6 bg-[#22154F] rounded-lg shadow-lg"
                    >
                        <h2 className="text-xl font-bold mb-4 text-[#7458da]">Admin Settings</h2>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">Auto-Accept Settings</h3>
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="autoAccept"
                                    checked={autoAcceptSetting.enabled}
                                    onChange={(e) => setAutoAcceptSetting({ ...autoAcceptSetting, enabled: e.target.checked })}
                                    className="mr-2 h-5 w-5"
                                />
                                <label htmlFor="autoAccept">Enable Auto-Accept</label>
                            </div>

                            {autoAcceptSetting.enabled && (
                                <div className="ml-7">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="bothReports"
                                            name="acceptType"
                                            checked={autoAcceptSetting.requireBothReports}
                                            onChange={() => setAutoAcceptSetting({ ...autoAcceptSetting, requireBothReports: true })}
                                            className="mr-2"
                                        />
                                        <label htmlFor="bothReports" className="mr-4">Accept when both reports match</label>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="radio"
                                            id="singleReport"
                                            name="acceptType"
                                            checked={!autoAcceptSetting.requireBothReports}
                                            onChange={() => setAutoAcceptSetting({ ...autoAcceptSetting, requireBothReports: false })}
                                            className="mr-2"
                                        />
                                        <label htmlFor="singleReport">Accept with single report (automatic)</label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Player Report Form */}
                {userRole === "player" && (
                    <div className="mb-8">
                        {!showNewReportForm ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setShowNewReportForm(true)}
                                className="flex items-center px-6 py-3 bg-[#7458da] text-white rounded-lg hover:bg-[#5a41ad] transition-colors shadow-md"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Submit New Score Report
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="p-6 bg-[#22154F] rounded-lg shadow-lg"
                            >
                                <h2 className="text-xl font-bold mb-4 text-[#7458da]">New Score Report</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block mb-2">Select Match</label>
                                        <select
                                            value={reportFormData.match_id}
                                            onChange={(e) => setReportFormData({ ...reportFormData, match_id: e.target.value })}
                                            className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80]"
                                        >
                                            <option value="">Select a match...</option>
                                            {matches.map(match => (
                                                <option key={match.id} value={match.id}>
                                                    Round {match.round}: vs {match.players.find(player => player.uuid != user.uuid)?.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <label className="block mb-2">Your Score</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={reportFormData.reporter_score}
                                                onChange={(e) => setReportFormData({ ...reportFormData, reporter_score: parseInt(e.target.value) || 0 })}
                                                className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80]"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label className="block mb-2">Opponent&apos;s Score</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={reportFormData.opponent_score}
                                                onChange={(e) => setReportFormData({ ...reportFormData, opponent_score: parseInt(e.target.value) || 0 })}
                                                className="w-full p-3 bg-[#2a1b5f] rounded-md border border-[#3d2a80]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        onClick={() => setShowNewReportForm(false)}
                                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitScoreReport}
                                        className="px-4 py-2 bg-[#7458da] rounded-lg hover:bg-[#5a41ad] transition-colors"
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
                    <h2 className="text-2xl font-bold mb-4 text-[#7458da] flex items-center">
                        <FontAwesomeIcon icon={faHistory} className="mr-2" />
                        {userRole === "player" ? "Your Score Reports" : "All Score Reports"}
                    </h2>

                    {Object.entries(getGroupedReports()).map(([matchId, reports]) => {
                        if (userRole === "player" && !reports.some(r =>
                            r.reporter_id === user?.uuid
                        )) {
                            return null;
                        }

                        const matchReportsMatch = doReportsMatch(reports);
                        const matchStatus = reports[0]?.status;

                        return (
                            <motion.div
                                key={matchId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-5 bg-[#22154F] rounded-lg shadow-lg"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold">{getMatchDetails(Number(matchId))}</h3>
                                    <div className={`flex items-center ${getStatusColor(matchStatus)}`}>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reports.map(report => (
                                        <div
                                            key={report.id}
                                            className="p-4 bg-[#2a1b5f] rounded-lg"
                                        >
                                            <div className="flex justify-between mb-3">
                                                <span className="font-semibold">Reporter: {getPlayerName(report, false)}</span>
                                                <span className="text-sm text-gray-300">
                                                    {new Date(report.created_at).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <div className="flex items-center">
                                                        <span className="font-bold mr-2">{getPlayerName(report, false)}:</span>
                                                        <span className="text-xl">{report.scores.find(score => score.player_uuid == user.uuid)?.score}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-bold mr-2">{getPlayerName(report, true)}:</span>
                                                        <span className="text-xl">{report.scores.find(score => score.player_uuid != user.uuid)?.score}</span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="mb-1">Winner:</div>
                                                    <div className="font-bold">{getWinnerName(report)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Admin Actions */}
                                {userRole === "admin" && matchStatus !== "accepted" && matchStatus !== "auto-accepted" && (
                                    <div className="mt-4 flex justify-end space-x-4">
                                        {reports.length === 2 && !matchReportsMatch && (
                                            <div className="flex-1 bg-red-900/30 p-2 rounded-lg text-sm">
                                                Reports don&apos;t match. Manual review required.
                                            </div>
                                        )}

                                        {reports.map(report => (
                                            <button
                                                key={`accept-${report.id}`}
                                                onClick={() => acceptScoreReport(report.id)}
                                                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                            >
                                                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                                Accept {getPlayerName(report, false)}&apos;s Report
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* No reports message */}
                    {Object.keys(getGroupedReports()).length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No score reports found.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}