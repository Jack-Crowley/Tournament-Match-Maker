"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { useMessage } from '@/context/messageContext';
import { useClient } from "@/context/clientContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "@/components/loading";
import { CreateTournament } from "@/components/modals/createTournament";
import { DeleteModal } from "@/components/modals/delete";

export default function Home() {
    const client = useClient();
    const supabase = createClient();
    const [loading, setLoading] = useState<boolean>(true);
    const [organizingTournaments, setOrganizingTournaments] = useState<Tournament[]>([]);
    const [playingTournaments, setPlayingTournaments] = useState<Tournament[]>([]);
    const [invitations, setInvitations] = useState<Tournament[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("organizing");
    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();

    const tabs = [
        { id: "organizing", label: "Organizing" },
        { id: "playing", label: "Playing" },
        { id: "invitations", label: "Invitations" },
    ];

    useEffect(() => {
        async function loadTournamentData() {
            const id = client.session?.user.id;

            if (id == undefined) {
                setLoading(false);
                return;
            }

            const { data: organizingTournamentsOwner, error: organizingErrorOwner } = await supabase
                .from('tournaments')
                .select('*')
                .eq('owner', id);

            let owningIds: string[] = [];
            if (organizingTournamentsOwner) {
                owningIds = organizingTournamentsOwner.map((record) => record.id);
                setOrganizingTournaments(organizingTournamentsOwner);
            }

            const { data: playingData, error: playingError } = await supabase
                .from('tournament_players')
                .select('tournament_id')
                .eq('member_uuid', id);

            if (playingError || organizingErrorOwner) {
                triggerMessage("Error fetching player data", "red");
            } else {
                const { data: organizingTournaments } = await supabase
                    .from('tournament_organizers')
                    .select('*')
                    .eq('member_uuid', id);

                const nonOwnerTournamentIds = organizingTournaments
                    ?.map((record) => record.tournament_id)
                    .filter((tournament_id) => !owningIds.includes(tournament_id));

                if (nonOwnerTournamentIds?.length) {
                    const { data: nonOwnerTournaments, error: nonOwnerError } = await supabase
                        .from('tournaments')
                        .select('*')
                        .in('id', nonOwnerTournamentIds);

                    if (nonOwnerError) {
                        triggerMessage('Error fetching non-owner tournaments:', 'red');
                    } else if (nonOwnerTournaments) {
                        setOrganizingTournaments((prev) => {
                            const uniqueTournaments = new Map();
                            [...prev, ...nonOwnerTournaments].forEach(tournament => {
                                uniqueTournaments.set(tournament.id, tournament);
                            });
                            return Array.from(uniqueTournaments.values());
                        });
                    }
                }

                const tournamentIds = [...new Set(playingData.map((record) => record.tournament_id))];

                const tournamentDetails: Tournament[] = [];
                for (const tournamentId of tournamentIds) {
                    if (owningIds.includes(tournamentId)) continue;

                    const { data: tournament, error: fetchError } = await supabase
                        .from('tournaments')
                        .select('*')
                        .eq('id', tournamentId)
                        .single();

                    if (fetchError) {
                        console.error("Error fetching tournament with id:", tournamentId, fetchError);
                    } else if (tournament) {
                        tournamentDetails.push(tournament);
                    }
                }

                setPlayingTournaments(tournamentDetails);
            }

            // Fetch invitations
            const { data: invitationsData, error: invitationsError } = await supabase
                .from('tournament_organizers')
                .select('tournament_id, permission_level, accepted')
                .eq('member_uuid', id)
                .eq('accepted', false);

            if (invitationsError) {
                triggerMessage("Error fetching invitations", "red");
            } else {
                const tournamentDetails = await Promise.all(
                    invitationsData.map(async (invitation) => {
                        const { data: tournament, error: tournamentError } = await supabase
                            .from('tournaments')
                            .select('*')
                            .eq('id', invitation.tournament_id)
                            .single();

                        if (tournamentError) {
                            console.error("Error fetching tournament:", tournamentError);
                            return null;
                        }

                        return {
                            ...tournament,
                            permission_level: invitation.permission_level,
                        };
                    })
                );

                setInvitations(tournamentDetails.filter((tournament) => tournament !== null) as Tournament[]);
            }

            setLoading(false);
        }

        loadTournamentData();
    }, [client, supabase, triggerMessage]);

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            setIsModalOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAcceptInvitation = async (tournamentId: string) => {
        const id = client.session?.user.id;

        if (!id) return;

        const { error: updateError } = await supabase
            .from('tournament_organizers')
            .update({ accepted: true })
            .eq('tournament_id', tournamentId)
            .eq('member_uuid', id);

        if (updateError) {
            triggerMessage("Error accepting invitation", "red");
            return;
        }

        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (tournamentError) {
            triggerMessage("Error fetching tournament details", "red");
            return;
        }

        setOrganizingTournaments((prev) => [...prev, tournament]);
        setInvitations((prev) => prev.filter((invitation) => invitation.id !== tournamentId));
        triggerMessage("Invitation accepted successfully!", "green");
    };

    interface TournamentListProps {
        tournaments: Tournament[];
        emptyMessage: string;
        onAction?: (tournamentId: string) => void;
        actionLabel: string;
        setTournaments : (tournaments : Tournament[]) => void;
    }

    const TournamentList = ({ tournaments, emptyMessage, setTournaments, onAction, actionLabel }: TournamentListProps) => {
        const [deleteSelection, setDeleteSelection] = useState<string | null>(null)

        const HandleDelete = async (id: string) => {
            if (!id) return;

            await supabase
                .from("tournament_matches")
                .delete()
                .eq("tournament_id", id);

            await supabase
                .from("tournament_organizers")
                .delete()
                .eq("tournament_id", id);

            await supabase
                .from("tournament_players")
                .delete()
                .eq("tournament_id", id);

            const {error} = await supabase
                .from("tournaments")
                .delete()
                .eq("id", id);

            if (error) {
                triggerMessage("Unable to delete tournament", "red");
            } else {
                triggerMessage("Announcement deleted successfully", "green");
                setTournaments(tournaments.filter(a => a.id !== id))
                setDeleteSelection(null);
            }
        }

        return (
            <div className="space-y-6 pb-8">
                <DeleteModal word="tournament" id={deleteSelection} setId={setDeleteSelection} handleDelete={HandleDelete} />

                {tournaments.length > 0 ? (
                    tournaments.map((tournament) => (
                        <motion.div
                            key={tournament.id}
                            whileHover={{ scale: 1.01 }}
                            className="p-6 shadow-[#382c3e] hover:cursor-pointer rounded-lg shadow-lg hover:shadow-3xl transition-all bg-gradient-to-r from-highlight to-accent"
                        >
                            <div className="flex justify-between items-center">
                                <Link href={`/tournament/${tournament.id}`} className="flex-1">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
                                        <p className="text-gray-200">{tournament.description}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center space-x-4">
                                    {onAction && (
                                        <button
                                            onClick={() => onAction(tournament.id)}
                                            className="px-4 py-2 bg-deep text-white rounded-lg hover:bg-highlight transition-colors transform"
                                        >
                                            {actionLabel}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteSelection(tournament.id)}
                                        className="p-2 bg-[rgba(0,0,0,0)] transition-duration-200 text-white rounded-full hover:bg-[#e24d4d] transition-colors transform"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">{emptyMessage}</p>
                )}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-background">
            {loading ? (
                <SpinningLoader></SpinningLoader>
            ) : (
                <div>
                    {/* Tabs */}
                    <div className="flex justify-center mt-10">
                        <div className="tabs flex space-x-4 bg-gradient-to-r from-secondary to-accent p-2 rounded-lg shadow-lg">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`px-6 py-3 text-lg font-semibold rounded-lg transition-all transform ${activeTab === tab.id
                                        ? "bg-highlight text-white shadow-md"
                                        : "bg-background text-gray-400 hover:bg-highlight hover:text-white"
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-8 px-4 sm:px-8 lg:px-16"
                        >
                            {activeTab === "organizing" && (
                                <div>
                                    <h1 className="text-highlight font-bold text-2xl mb-6">Organizing Tournaments</h1>
                                    <TournamentList
                                        tournaments={organizingTournaments}
                                        emptyMessage="You are not organizing any tournaments."
                                        actionLabel="Manage"
                                        setTournaments={setOrganizingTournaments}
                                    />
                                </div>
                            )}

                            {activeTab === "playing" && (
                                <div>
                                    <h1 className="text-highlight font-bold text-2xl mb-6">Playing Tournaments</h1>
                                    <TournamentList
                                        tournaments={playingTournaments}
                                        emptyMessage="You are not playing in any tournaments."
                                        actionLabel="View"
                                        setTournaments={setPlayingTournaments}
                                    />
                                </div>
                            )}

                            {activeTab === "invitations" && (
                                <div>
                                    <h1 className="text-highlight font-bold text-2xl mb-6">Invitations</h1>
                                    <TournamentList
                                        tournaments={invitations}
                                        emptyMessage="You currently have no invitations."
                                        onAction={handleAcceptInvitation}
                                        actionLabel="Accept"
                                        setTournaments={setInvitations}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <motion.div
                        className="fixed bottom-8 right-8 flex items-center gap-3 group" // Increased bottom, right, and gap
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="bg-[#43386e] text-white flex items-center px-4 py-3 rounded-full text-lg font-medium shadow-md cursor-pointer overflow-hidden"
                            initial={{ width: "3.9rem" }}
                            whileHover={{ width: "12rem" }}
                            transition={{ type: "spring", stiffness: 150 }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FontAwesomeIcon
                                icon={faPlusCircle}
                                className="text-white text-3xl mr-4"
                            />
                            <span className="whitespace-nowrap">Create New</span>
                        </motion.div>
                    </motion.div>
                </div>
            )}

            <CreateTournament isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} ref={modalRef} />
        </div>
    );
}