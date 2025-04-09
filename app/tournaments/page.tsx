"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faPlusCircle, faSearch, faSort, faSyncAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useMessage } from '@/context/messageContext';
import { useClient } from "@/context/clientContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "@/components/loading";
import { CreateTournament } from "@/components/modals/createTournament";
import { DeleteManyModal, DeleteModal } from "@/components/modals/delete";
import { Checkbox } from "@/components/checkbox";
import { Footer } from "@/components/footer";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
    return (
        <Suspense fallback={<div>Loading tabs...</div>}>
            <TournamentsPage />
        </Suspense>
    );
}

function TournamentsPage() {
    const client = useClient();
    const supabase = createClient();
    const [loading, setLoading] = useState<boolean>(true);
    const [organizingTournaments, setOrganizingTournaments] = useState<Tournament[]>([]);
    const [playingTournaments, setPlayingTournaments] = useState<Tournament[]>([]);
    const [invitations, setInvitations] = useState<Tournament[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [anonymous, setAnonymous] = useState<boolean>(false)

    useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") || "organizing";
    const [activeTab, setActiveTabState] = useState(initialTab);

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("tab", tab);
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.pushState({}, "", newUrl);
    };

    const [searchTerm, setSearchTerm] = useState<string>("");
    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();

    const tabs = [
        { id: "organizing", label: "Organizing", count: organizingTournaments.length },
        { id: "playing", label: "Playing", count: playingTournaments.length },
        { id: "invitations", label: "Invitations", count: invitations.length },
    ];

    const [unreadMessages] = useState([
        {
            tournamentName: "Fortnite Finals",
            sender: "Alex Rodriguez",
            content: "Are we still on for practice before the tournament?",
            timeSent: "10 min ago"
        },
        {
            tournamentName: "Call of Duty Championship",
            sender: "Sarah Johnson",
            content: "I've updated the rules for the upcoming match, please review",
            timeSent: "1 hour ago"
        },
        {
            tournamentName: "League of Legends Summit",
            sender: "Michael Chang",
            content: "Your team has advanced to the semifinals! Details inside.",
            timeSent: "3 hours ago"
        },
        {
            tournamentName: "Rocket League Tournament",
            sender: "Tournament System",
            content: "Match schedule has been updated due to server maintenance",
            timeSent: "Yesterday"
        },
        {
            tournamentName: "Apex Legends Championship",
            sender: "James Wilson",
            content: "New prize pool announcement for all participants",
            timeSent: "2 days ago"
        }
    ]);

    async function loadTournamentData() {
        setLoading(true)
        try {
            const res = await fetch('/api/tournaments/get-users-tournament')
            const json = await res.json()

            if (!res.ok) {
                triggerMessage(json.error || "Failed to fetch data", "red")
                setLoading(false)
                return
            }

            const { organizing, playing, invitations } = json

            setOrganizingTournaments(organizing)
            setPlayingTournaments(playing)
            setInvitations(invitations)
        } catch {
            triggerMessage("Unexpected error loading tournaments: ", "red")
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        if (!client || !client.session || !client.session.user) return;

        setAnonymous(client.session.user.is_anonymous || client.session.user.is_anonymous == undefined)
    }, [client, client.session?.user])

    useEffect(() => {
        loadTournamentData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, supabase]);

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

    const filterTournaments = (tournaments: Tournament[]) => {
        if (!searchTerm) return tournaments;
        return tournaments.filter(
            t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const deleteTournamentForeignKeys = async (id: string) => {
        await supabase
            .from("tournament_matches")
            .delete()
            .eq("tournament_id", id);

        await supabase
            .from("private_messages")
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

        const { data: announcements, error: announcementsError } = await supabase
            .from("announcements")
            .select("id")
            .eq("tournament_id", id);

        if (announcementsError) {
            console.error("Error fetching announcements:", announcementsError);
        } else {
            const announcementIds = announcements.map(a => a.id);

            if (announcementIds.length > 0) {
                const { error: seenError } = await supabase
                    .from("announcements_seen")
                    .delete()
                    .in("announcement_id", announcementIds);

                if (seenError) {
                    console.error("Error deleting announcements_seen:", seenError);
                }

                const { error: announcementsDeleteError } = await supabase
                    .from("announcements")
                    .delete()
                    .in("id", announcementIds);

                if (announcementsDeleteError) {
                    console.error("Error deleting announcements:", announcementsDeleteError);
                }
            }
        }
    }

    interface TournamentListProps {
        tournaments: Tournament[];
        title: string,
        emptyMessage: string;
        onAction?: (tournamentId: string) => void;
        actionLabel: string;
        setTournaments: (tournaments: Tournament[]) => void;
    }

    const TournamentList = ({ title, tournaments, emptyMessage, setTournaments, onAction, actionLabel }: TournamentListProps) => {
        const [deleteSelection, setDeleteSelection] = useState<string | null>(null)
        const [deleteView, setDeleteView] = useState<boolean>(false)
        const [deleteManyModal, setDeleteManyModal] = useState<boolean>(false)
        const [deleteIndexes, setDeleteIndexes] = useState<string[]>([])
        const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
        const [localSearchTerm, setLocalSearchTerm] = useState<string>(searchTerm);

        useEffect(() => {
            setLocalSearchTerm(searchTerm);
        }, []);

        const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalSearchTerm(e.target.value);
        };

        const applySearch = () => {
            setSearchTerm(localSearchTerm);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                applySearch();
            }
        };

        const filteredTournaments = filterTournaments(tournaments);

        const sortedTournaments = [...filteredTournaments].sort((a, b) => {
            return sortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });

        const handleLeaveTournament = async (tournamentId: string) => {
            const id = client.session?.user.id;

            if (!id) return;

            const { error: updateError } = await supabase
                .from('tournament_players')
                .update({ left_match: true })
                .eq('tournament_id', tournamentId)
                .eq('member_uuid', id);

            if (updateError) {
                triggerMessage("Error leaving tournament", "red");
                return;
            }

            setPlayingTournaments((prev) => prev.filter((tournament) => tournament.id !== tournamentId));
            triggerMessage("You have left the tournament successfully!", "green");
        };

        const HandleDelete = async (id: string) => {
            if (!id) return;

            await deleteTournamentForeignKeys(id)

            const { error } = await supabase
                .from("tournaments")
                .delete()
                .eq("id", id);

            if (error) {
                triggerMessage("Unable to delete tournament", "red");
            } else {
                triggerMessage("Tournament deleted successfully", "green");
                setTournaments(tournaments.filter(a => a.id !== id))
                setDeleteSelection(null);
            }
        }

        const HandleDeleteMany = async (ids: string[]) => {
            let counter = 0

            for (let i = 0; i < ids.length; i++) {
                const id = ids[i]

                await deleteTournamentForeignKeys(id)

                const { error } = await supabase
                    .from("tournaments")
                    .delete()
                    .eq("id", id);

                if (error) {
                    triggerMessage("Unable to delete tournament with id " + id, "red");
                } else {
                    counter++;
                }
            }

            setTournaments(tournaments.filter(a => !deleteIndexes.includes(a.id)))

            if (counter > 0) {
                triggerMessage(`${counter} Tournament${counter > 1 ? "s" : ""} deleted successfully`, "green");
            }

            setDeleteIndexes([])
            setDeleteView(false)
            setDeleteManyModal(false)
        }

        function handleCheckboxClick(id: string) {
            if (deleteIndexes.includes(id)) {
                setDeleteIndexes(deleteIndexes.filter(tournamentId => tournamentId != id))
            }
            else {
                setDeleteIndexes([...deleteIndexes, id])
            }
        }

        const toggleSortOrder = () => {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        };

        const getEmptyMessage = () => {
            if (searchTerm) {
                return "No tournaments match your search criteria.";
            }
            return emptyMessage;
        };

        const renderStatusChip = (status: any) => {
            const statusText = status || "initialization";
            const isStarted = statusText === "started";

            return (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${isStarted
                    ? "bg-[#3c0e51] text-white"
                    : "bg-[#672287] text-white"
                    }`}>
                    {isStarted ? "Started" : "Initialization"}
                </div>
            );
        };

        return (
            <div className="space-y-6 pb-8">
                <DeleteModal word="tournament" id={deleteSelection} setId={setDeleteSelection} handleDelete={HandleDelete} />
                <DeleteManyModal word="Tournament" ids={deleteIndexes} isOpen={deleteManyModal} setOpen={setDeleteManyModal} handleDelete={HandleDeleteMany} />

                <div className="flex flex-col sm:flex-row justify-between w-full gap-4 items-start sm:items-center mb-4">
                    <h1 className="text-highlight font-bold text-2xl">{title}</h1>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 max-w-md">
                            <input
                                type="text"
                                placeholder="Search tournaments..."
                                value={localSearchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                className="pl-10 pr-4 py-2 w-full rounded-lg bg-[#2a1a66] border border-[#3f3175] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-highlight"
                            />
                            <button
                                onClick={applySearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>

                        {title === "Organizing Tournaments" && (
                            <div className="flex gap-2">
                                {deleteView ? (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => { setDeleteView(false); setDeleteIndexes([]) }}
                                            className="px-4 py-2 border border-[#767676] bg-transparent text-white rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5a5a5a] transform flex-grow sm:flex-grow-0"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => { if (deleteIndexes.length > 0) setDeleteManyModal(true) }}
                                            className={`px-4 py-2 border transition-all duration-300 ease-in-out rounded-lg text-white transform flex-grow sm:flex-grow-0 ${deleteIndexes.length > 0
                                                ? "bg-[#c02a2a] border-[#c02a2a] hover:bg-[#a32424] hover:border-[#a32424]"
                                                : "border-[#c02a2a8b] bg-[#4512127b] cursor-not-allowed"
                                                }`}
                                        >
                                            Delete ({deleteIndexes.length})
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={toggleSortOrder}
                                            className="px-4 py-2 bg-[#2a1a66] hover:bg-[#3f2c84] text-white rounded-lg transition-all flex items-center justify-center"
                                            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                        >
                                            <FontAwesomeIcon icon={faSort} className="mr-2" />
                                            Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                                        </button>
                                        <button
                                            onClick={() => { setDeleteView(true) }}
                                            className="px-4 py-2 bg-[#2a1a66] border border-[#3f3175] text-white rounded-lg transition-all duration-300 ease-in-out hover:bg-[#3f2c84] transform"
                                        >
                                            Select
                                        </button>
                                        <button
                                            onClick={() => { setDeleteIndexes(sortedTournaments.map(tournament => tournament.id)); setDeleteView(true) }}
                                            className="px-4 py-2 bg-[#2a1a66] border border-[#3f3175] text-white rounded-lg transition-all duration-300 ease-in-out hover:bg-[#3f2c84] transform"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {sortedTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTournaments.map((tournament) => (
                            <motion.div
                                key={tournament.id}
                                whileHover={{ scale: 1.02 }}
                                className={`rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all relative
                              ${deleteIndexes.includes(tournament.id)
                                        ? 'bg-gradient-to-r from-red-800 to-red-700'
                                        : 'bg-gradient-to-r from-[#2a1a66] to-[#3f2c84]'}`}
                            >
                                {/* Status chip */}
                                {renderStatusChip(tournament.status)}

                                <div className={`h-28 flex items-center justify-center
                              ${deleteIndexes.includes(tournament.id)
                                        ? 'bg-gradient-to-r from-red-600 to-red-500'
                                        : 'bg-gradient-to-r from-highlight to-accent'}`}>
                                    <h2 className="text-2xl font-bold text-white px-4 text-center">{tournament.name}</h2>
                                </div>

                                <div className="p-5">
                                    <p className="text-gray-200 mb-4 h-12 overflow-hidden text-ellipsis">
                                        {tournament.description || "No description provided."}
                                    </p>

                                    <div className="flex justify-between items-center mt-4">
                                        {!deleteView && (
                                            <Link
                                                href={`/tournament/${tournament.id}`}
                                                className="px-4 py-2 bg-highlight hover:bg-[#8569ea] text-white rounded-lg transition-colors transform font-medium"
                                            >
                                                View Details
                                            </Link>
                                        )}

                                        <div className="flex items-center">
                                            {onAction && (
                                                <button
                                                    onClick={() => onAction(tournament.id)}
                                                    className={`px-4 py-2 text-white rounded-lg transition-colors transform
                                                  ${deleteIndexes.includes(tournament.id)
                                                            ? 'bg-red-700 border border-red-500 hover:bg-red-600'
                                                            : 'bg-[#2a1a66] border border-highlight hover:bg-highlight'}`}
                                                >
                                                    {actionLabel}
                                                </button>
                                            )}

                                            {title === "Organizing Tournaments" && (
                                                deleteView ? (
                                                    <Checkbox
                                                        checked={deleteIndexes.includes(tournament.id)}
                                                        onChange={() => handleCheckboxClick(tournament.id)}
                                                    />
                                                ) : (
                                                    <div className="relative ml-3">
                                                        <button
                                                            className="p-2 text-white hover:text-red-400 rounded-full hover:bg-[#3f2c84] transition-colors"
                                                            onClick={() => setDeleteSelection(tournament.id)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                            {title === "Playing Tournaments" && (
                                                <button
                                                    onClick={() => handleLeaveTournament(tournament.id)}
                                                    className={`px-4 py-2 text-white rounded-lg transition-colors transform
                                                  ${deleteIndexes.includes(tournament.id)
                                                            ? 'bg-red-700 border border-red-500 hover:bg-red-600'
                                                            : 'bg-[#2a1a66] border border-highlight hover:bg-highlight'}`}
                                                >
                                                    Leave
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#2a1a66] rounded-lg p-10 text-center">
                        <p className="text-gray-300 text-lg mb-4">{getEmptyMessage()}</p>
                        {title === "Organizing Tournaments" && !searchTerm && (
                            <div>
                                {!anonymous ? (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-6 py-3 bg-highlight hover:bg-[#8569ea] text-white rounded-lg transition-colors font-medium"
                                    >
                                        Create your first Tournament

                                    </button>
                                ) : (
                                    <Link href="/login">
                                        <button
                                            className="px-6 py-3 bg-highlight hover:bg-[#8569ea] text-white rounded-lg transition-colors font-medium"
                                        >
                                            Login to create your first Tournament

                                        </button>
                                    </Link>
                                )}
                            </div>

                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-[#160A3A] text-white">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <SpinningLoader></SpinningLoader>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-center sm:text-left mb-2">Tournament Dashboard</h1>
                        <p className="text-gray-300 text-center sm:text-left">Manage, participate, and track all your tournament activities</p>
                    </div>

                    {/* Stats overview */}
                    <div className="flex flex-col mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Overview</h2>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 text-sm bg-highlight p-4 rounded-lg hover:bg-accent"
                                onClick={loadTournamentData}
                            >
                                <FontAwesomeIcon
                                    icon={faSyncAlt}
                                    className="text-sm"
                                />
                                <span>Refresh</span>
                            </motion.button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tabs.map((tab) => (
                                <motion.div
                                    key={tab.id}
                                    whileHover={{ y: -5 }}
                                    className={`p-6 rounded-lg cursor-pointer shadow-md ${activeTab === tab.id
                                        ? "bg-gradient-to-r from-highlight to-accent"
                                        : "bg-[#2a1a66] hover:bg-[#3f2c84]"
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <h2 className="text-xl font-semibold mb-2">{tab.label}</h2>
                                    <div className="flex justify-between items-center">
                                        <span className="text-3xl font-bold">{tab.count}</span>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === tab.id ? "bg-white bg-opacity-20" : "bg-highlight"
                                            }`}>
                                            {tab.id === "organizing" && "🏆"}
                                            {tab.id === "playing" && "🎮"}
                                            {tab.id === "invitations" && "✉️"}
                                        </div>
                                    </div>
                                </motion.div>
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
                            className="mt-12"
                        >
                            {activeTab === "organizing" && (
                                <TournamentList
                                    title="Organizing Tournaments"
                                    tournaments={organizingTournaments}
                                    emptyMessage="You are not organizing any tournaments yet."
                                    actionLabel="Manage"
                                    setTournaments={setOrganizingTournaments}
                                />
                            )}

                            {activeTab === "playing" && (
                                <TournamentList
                                    title="Playing Tournaments"
                                    tournaments={playingTournaments}
                                    emptyMessage="You are not playing in any tournaments yet."
                                    actionLabel="View"
                                    setTournaments={setPlayingTournaments}
                                />
                            )}

                            {activeTab === "invitations" && (
                                <TournamentList
                                    title="Tournament Invitations"
                                    tournaments={invitations}
                                    emptyMessage="You currently have no tournament invitations."
                                    onAction={handleAcceptInvitation}
                                    actionLabel="Accept"
                                    setTournaments={setInvitations}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {!anonymous && (
                        <motion.button
                            className="fixed bottom-8 right-8 flex items-center gap-2 bg-highlight hover:bg-[#8569ea] text-white px-6 py-4 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FontAwesomeIcon
                                icon={faPlusCircle}
                                className="text-white text-xl"
                            />
                            <span className="font-medium">New Tournament</span>
                        </motion.button>
                    )}

                </div>
            )}

            <CreateTournament isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} ref={modalRef} />

            <div className="m-6 bg-[#2a1a66] rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <h2 className="text-xl font-semibold">Unread Messages</h2>
                        {unreadMessages && unreadMessages.length > 0 && (
                            <span className="ml-3 bg-highlight text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {unreadMessages.length}
                            </span>
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-sm text-highlight hover:text-accent"
                    >
                        View All
                    </motion.button>
                </div>

                {unreadMessages && unreadMessages.length > 0 ? (
                    <div className="space-y-3">
                        {unreadMessages.slice(0, 5).map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-[#3f2c84] rounded-lg hover:bg-[#4a3795] cursor-pointer group"
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-highlight">{message.tournamentName}</span>
                                    <span className="text-xs text-gray-300">{message.timeSent}</span>
                                </div>
                                <p className="text-sm text-gray-200 truncate">{message.content}</p>
                                <div className="mt-2 text-xs text-gray-400">
                                    From: {message.sender}
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-xs text-highlight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        Mark as read →
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FontAwesomeIcon
                            icon={faInbox}
                            className="text-4xl mb-3"
                        />
                        <p>No unread messages</p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
