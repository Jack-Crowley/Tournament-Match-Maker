"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useMessage } from '@/context/messageContext';
import { useClient } from "@/context/clientContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { SpinningLoader } from "@/components/loading";
import { CreateTournament } from "@/components/modals/createTournament";

export default function Home() {
    const client = useClient();
    const supabase = createClient();
    const [loading, setLoading] = useState<boolean>(true);
    const [organizingTournaments, setOrganizingTournaments] = useState<any[]>([]);
    const [playingTournaments, setPlayingTournaments] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("organizing");
    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();
    const router = useRouter();

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

            // Fetch organizing tournaments
            const { data: organizingTournaments, error: organizingError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('owner', id);

            let owningIds = [];
            if (organizingTournaments) {
                owningIds = organizingTournaments.map(record => record.id);
                setOrganizingTournaments(organizingTournaments);
            }

            // Fetch playing tournaments
            const { data: playingData, error: playingError } = await supabase
                .from('tournament_players')
                .select('tournament_id')
                .eq('member_uuid', id);

            if (playingError || organizingError) {
                triggerMessage("Error fetching player data", "red");
            } else {
                const tournamentIds = [...new Set(playingData.map(record => record.tournament_id))];

                const tournamentDetails = [];
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

                setInvitations(tournamentDetails.filter((tournament) => tournament !== null));
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

        // Update the invitation to mark it as accepted
        const { error: updateError } = await supabase
            .from('tournament_organizers')
            .update({ accepted: true })
            .eq('tournament_id', tournamentId)
            .eq('member_uuid', id);

        if (updateError) {
            triggerMessage("Error accepting invitation", "red");
            return;
        }

        // Fetch the tournament details
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (tournamentError) {
            triggerMessage("Error fetching tournament details", "red");
            return;
        }

        // Add the tournament to the organizing tournaments list
        setOrganizingTournaments((prev) => [...prev, tournament]);

        // Remove the invitation from the invitations list
        setInvitations((prev) => prev.filter((invitation) => invitation.id !== tournamentId));

        triggerMessage("Invitation accepted successfully!", "green");
    };

    return (
        <div className="relative min-h-screen">
            {loading ? (
                <SpinningLoader />
            ) : (
                <div>
                    <div className="flex justify-center mt-20">
                        <div className="tabs flex justify-center space-x-8 border-b-2 border-[#604BAC] pb-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`relative px-4 py-2 text-lg font-semibold ${activeTab === tab.id
                                        ? "text-[#7458da]"
                                        : "text-gray-400 hover:text-[#7458da]"
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-[#7458da]"
                                            layoutId="underline"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
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
                        >
                            {activeTab === "organizing" && (
                                <div>
                                    <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-10">Organizing Tournaments</h1>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                                        {organizingTournaments.length > 0 ? (
                                            organizingTournaments.map((tournament) => (
                                                <div key={tournament.id} className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                                                    <div className="px-6 py-4 text-center">
                                                        <div className="font-bold text-xl mb-2">{tournament.name}</div>
                                                        <p className="text-gray-100 text-semibold">
                                                            {tournament.description}
                                                        </p>
                                                    </div>
                                                    <Link href={`/tournament/${tournament.id}`} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843]">
                                                        Read more
                                                    </Link>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white text-center">You are not organizing any tournaments.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "playing" && (
                                <div>
                                    <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-10">Playing Tournaments</h1>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                                        {playingTournaments.length > 0 ? (
                                            playingTournaments.map((tournament) => (
                                                <div key={tournament.id} className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                                                    <div className="px-6 py-4 text-center">
                                                        <div className="font-bold text-xl mb-2">{tournament.name}</div>
                                                        <p className="text-gray-100 text-semibold">
                                                            {tournament.description}
                                                        </p>
                                                    </div>
                                                    <Link href={`/tournament/${tournament.id}`} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843]">
                                                        Read more
                                                    </Link>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white text-center">You are not playing in any tournaments.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "invitations" && (
                                <div>
                                    <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-10">Invitations</h1>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                                        {invitations.length > 0 ? (
                                            invitations.map((invitation) => (
                                                <div key={invitation.id} className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                                                    <div className="px-6 py-4 text-center">
                                                        <div className="font-bold text-xl mb-2">{invitation.name}</div>
                                                        <p className="text-gray-100 text-semibold">
                                                            {invitation.description}
                                                        </p>
                                                        <p className="text-gray-100 text-semibold mt-2">
                                                            Permission: {invitation.permission_level}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAcceptInvitation(invitation.id)}
                                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843]"
                                                    >
                                                        Accept Invitation
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white text-center">You currently have no invitations.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <motion.div
                        className="fixed bottom-5 right-5 flex items-center gap-2 group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="bg-[#604BAC] text-white flex items-center px-3 py-2 rounded-full text-sm font-medium shadow-md cursor-pointer overflow-hidden"
                            initial={{ width: "3rem" }}
                            whileHover={{ width: "10rem" }}
                            transition={{ type: "spring", stiffness: 150 }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FontAwesomeIcon
                                icon={faPlusCircle}
                                className="text-white text-2xl mr-4"
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