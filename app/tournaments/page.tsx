"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle,
    faSearch,
    faSort,
    faSyncAlt,
    faTrash,
    faTrophy,
    faGamepad,
    faEnvelope,
    faCalendarAlt,
    faUsers,
    faSortUp,
    faSortDown,
    faChevronDown,
    faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
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
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0F0823] to-[#1C0C4C] flex items-center justify-center">
            <SpinningLoader />
        </div>}>
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
        { id: "organizing", label: "Organizing", count: organizingTournaments.length, icon: faTrophy },
        { id: "playing", label: "Playing", count: playingTournaments.length, icon: faGamepad },
        { id: "invitations", label: "Invitations", count: invitations.length, icon: faEnvelope },
    ];

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
            triggerMessage("Unexpected error loading tournaments", "red")
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        if (!client || !client.session || !client.session.user) return;

        setAnonymous(client.session.user.is_anonymous || client.session.user.is_anonymous === undefined)
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
        const [deleteSelection, setDeleteSelection] = useState<string | null>(null);
        const [deleteView, setDeleteView] = useState<boolean>(false);
        const [deleteManyModal, setDeleteManyModal] = useState<boolean>(false);
        const [deleteIndexes, setDeleteIndexes] = useState<string[]>([]);
        const [sortField, setSortField] = useState<'name' | 'created_at' | 'tournament_type'>('name');
        const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
        const [localSearchTerm, setLocalSearchTerm] = useState<string>(searchTerm);
        const [showSortMenu, setShowSortMenu] = useState<boolean>(false);

        // Load sorting preferences from localStorage on initial render
        useEffect(() => {
            const savedSortField = localStorage.getItem('tournamentSortField');
            const savedSortOrder = localStorage.getItem('tournamentSortOrder');

            if (savedSortField) {
                setSortField(savedSortField as 'name' | 'created_at' | 'tournament_type');
            }

            if (savedSortOrder) {
                setSortOrder(savedSortOrder as 'asc' | 'desc');
            }

            setLocalSearchTerm(searchTerm);
        }, []);

        // Save sorting preferences when they change
        useEffect(() => {
            localStorage.setItem('tournamentSortField', sortField);
            localStorage.setItem('tournamentSortOrder', sortOrder);
        }, [sortField, sortOrder]);

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

        const sortedTournaments = useMemo(() => {
            return [...filteredTournaments].sort((a, b) => {
                let comparison = 0;

                switch (sortField) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'created_at':
                        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        break;
                    case 'tournament_type':
                        comparison = a.tournament_type.localeCompare(b.tournament_type);
                        break;
                }

                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }, [filteredTournaments, sortField, sortOrder]);

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

        const handleSortChange = (field: 'name' | 'created_at' | 'tournament_type') => {
            if (sortField === field) {
                // Toggle order if clicking the current sort field
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
                // Set new field with default ascending order
                setSortField(field);
                setSortOrder('asc');
            }
            setShowSortMenu(false);
        };

        const getSortIcon = (field: 'name' | 'created_at' | 'tournament_type') => {
            if (sortField !== field) return null;
            return sortOrder === 'asc' ? <FontAwesomeIcon className="ml-2" icon={faSortUp} /> : <FontAwesomeIcon className="ml-2" icon={faSortDown} />;
        };

        const getSortLabel = () => {
            const fieldLabels = {
                name: 'Name',
                created_at: 'Date',
                tournament_type: 'Type'
            };

            return `${fieldLabels[sortField]} ${sortOrder === 'asc' ? '(A-Z)' : '(Z-A)'}`;
        };

        const getEmptyMessage = () => {
            if (searchTerm) {
                return "No tournaments match your search criteria.";
            }
            return emptyMessage;
        };

        return (
            <div className="space-y-6 pb-8">
                <DeleteModal word="tournament" id={deleteSelection} setId={setDeleteSelection} handleDelete={HandleDelete} />
                <DeleteManyModal word="Tournament" ids={deleteIndexes} isOpen={deleteManyModal} setOpen={setDeleteManyModal} handleDelete={HandleDeleteMany} />

                <div className="flex flex-col sm:flex-row justify-between w-full gap-4 items-start sm:items-center mb-6">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-300">{title}</h1>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 max-w-md">
                            <input
                                type="text"
                                placeholder="Search tournaments..."
                                value={localSearchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                className="pl-10 pr-4 py-2 w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                            />
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <button
                                onClick={applySearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-300 transition-colors"
                            >
                                <span className="text-xs font-medium">Search</span>
                            </button>
                        </div>

                        {title === "Organizing Tournaments" && (
                            <div className="flex gap-2">
                                {deleteView ? (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => { setDeleteView(false); setDeleteIndexes([]) }}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300 ease-in-out border border-white/10 transform flex-grow sm:flex-grow-0"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => { if (deleteIndexes.length > 0) setDeleteManyModal(true) }}
                                            className={`px-4 py-2 transition-all duration-300 ease-in-out rounded-lg text-white transform flex-grow sm:flex-grow-0 ${deleteIndexes.length > 0
                                                ? "bg-red-600/80 hover:bg-red-700 border border-red-500/30"
                                                : "bg-red-600/20 border border-red-500/10 cursor-not-allowed"
                                                }`}
                                        >
                                            Delete ({deleteIndexes.length})
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {/* Sort Dropdown Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSortMenu(!showSortMenu)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all flex items-center justify-center border border-white/10 gap-2"
                                            >
                                                <FontAwesomeIcon icon={faSort} />
                                                <span>{getSortLabel()}</span>
                                                <FontAwesomeIcon icon={faChevronDown} className={`ml-1 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showSortMenu && (
                                                <div className="absolute z-10 mt-2 w-48 rounded-md bg-gray-800 border border-white/10 shadow-lg">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => handleSortChange('name')}
                                                            className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10"
                                                        >
                                                            <span>Name</span>
                                                            {getSortIcon('name')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSortChange('created_at')}
                                                            className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10"
                                                        >
                                                            <span>Date Created</span>
                                                            {getSortIcon('created_at')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSortChange('tournament_type')}
                                                            className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10"
                                                        >
                                                            <span>Tournament Type</span>
                                                            {getSortIcon('tournament_type')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => { setDeleteView(true) }}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300 ease-in-out border border-white/10 transform"
                                        >
                                            Select
                                        </button>
                                        <button
                                            onClick={() => { setDeleteIndexes(sortedTournaments.map(tournament => tournament.id)); setDeleteView(true) }}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300 ease-in-out border border-white/10 transform"
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
                    <div className="space-y-3">
                        {/* Optional Column Headers */}
                        {sortedTournaments.length > 3 && !deleteView && (
                            <div className="hidden md:flex items-center px-4 py-2 text-sm text-purple-200/70 border-b border-white/5">
                                <div className="flex-grow">
                                    <button
                                        onClick={() => handleSortChange('name')}
                                        className="flex items-center hover:text-white transition-colors"
                                    >
                                        Tournament Name {getSortIcon('name')}
                                    </button>
                                </div>
                                <div className="w-32 text-center">
                                    <button
                                        onClick={() => handleSortChange('tournament_type')}
                                        className="flex items-center hover:text-white transition-colors"
                                    >
                                        Type {getSortIcon('tournament_type')}
                                    </button>
                                </div>
                                <div className="w-32 text-center">
                                    <button
                                        onClick={() => handleSortChange('created_at')}
                                        className="flex items-center hover:text-white transition-colors"
                                    >
                                        Created {getSortIcon('created_at')}
                                    </button>
                                </div>
                                <div className="w-32"></div>
                            </div>
                        )}

                        {sortedTournaments.map((tournament) => (
                            <div
                                key={tournament.id}
                                className={`flex items-center justify-between p-4 py-6 bg-white/5 hover:bg-white/10 rounded-xl transition duration-200 cursor-pointer border ${deleteIndexes.includes(tournament.id)
                                    ? 'border-red-500/50 bg-red-900/20'
                                    : 'border-white/5'
                                    }`}
                            >
                                <div className="flex items-center flex-grow">
                                    {deleteView && title === "Organizing Tournaments" && (
                                        <div className="mr-4">
                                            <Checkbox
                                                checked={deleteIndexes.includes(tournament.id)}
                                                onChange={() => handleCheckboxClick(tournament.id)}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center">
                                            <h4 className="font-semibold text-lg">{tournament.name}</h4>
                                        </div>
                                        <p className="text-sm text-purple-200/70 line-clamp-1 mt-1 max-w-lg">
                                            {tournament.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center text-xs text-purple-200/70 mt-2 gap-4">
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                                                <span>Created {new Date(tournament.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                                <span>{{ "single": "Single Elimination", "robin": "Round Robin", "swiss": "Swiss Style" }[tournament.tournament_type]}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                                                <span>{{ "initialization": "Initialization", "started": "Active", "completed": "Ended" }[tournament.status]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-4">
                                    {!deleteView && (
                                        <Link
                                            href={`/tournament/${tournament.id}`}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition duration-200"
                                        >
                                            View Details
                                        </Link>
                                    )}

                                    {onAction && !deleteView && (
                                        <button
                                            onClick={() => onAction(tournament.id)}
                                            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-white font-medium rounded-lg transition duration-200"
                                        >
                                            {actionLabel}
                                        </button>
                                    )}

                                    {title === "Organizing Tournaments" && !deleteView && (
                                        <button
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-600/20 flex items-center justify-center transition duration-200"
                                            onClick={() => setDeleteSelection(tournament.id)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="text-white hover:text-red-400" />
                                        </button>
                                    )}

                                    {title === "Playing Tournaments" && !deleteView && (
                                        <button
                                            onClick={() => handleLeaveTournament(tournament.id)}
                                            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-white font-medium rounded-lg transition duration-200"
                                        >
                                            Leave
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 text-center border border-white/10">
                        <p className="text-purple-200/80 mb-4">{getEmptyMessage()}</p>
                        {title === "Organizing Tournaments" && !searchTerm && (
                            <div>
                                {!anonymous ? (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition duration-200"
                                    >
                                        Create your first Tournament
                                    </button>
                                ) : (
                                    <Link href="/login">
                                        <button
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition duration-200"
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
        <div className="relative min-h-screen bg-gradient-to-b from-[#160A3A] to-[#2A1A5E] text-white">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <SpinningLoader />
                </div>
            ) : (
                <div className="container mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-center sm:text-left mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300">Tournament Dashboard</h1>
                                <p className="text-purple-300 text-center sm:text-left">Manage, participate, and track all your tournament activities</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 text-sm bg-[#6617A8] mt-4 sm:mt-0 p-3 rounded-lg hover:bg-[#7E2FC8] transition-all"
                                onClick={loadTournamentData}
                            >
                                <FontAwesomeIcon
                                    icon={faSyncAlt}
                                    className="text-sm"
                                />
                                <span>Refresh</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Stats overview */}
                    <div className="mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tabs.map((tab) => (
                                <motion.div
                                    key={tab.id}
                                    whileHover={{ y: -5 }}
                                    className={`p-6 rounded-xl cursor-pointer shadow-md border hover:bg-white/5 transition-all duration-300 ${activeTab === tab.id
                                        ? "bg-gradient-to-br from-[#9475f1a2] bg-[#5439a7] border-[#9C56D4]"
                                        : "bg-gradient-to-br from-[#23145662] to-[#320d6669] border-[#3f3175] hover:border-[#6617A8]"
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-xl font-semibold">{tab.label}</h2>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === tab.id ? "bg-white bg-opacity-10" : "bg-[#6617A8]"
                                            }`}>
                                            <FontAwesomeIcon icon={tab.icon} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-bold">{tab.count}</span>
                                        <span className="text-sm text-purple-300">
                                            {tab.id === "organizing" && "Tournaments you manage"}
                                            {tab.id === "playing" && "Tournaments you're playing in"}
                                            {tab.id === "invitations" && "Pending invitations"}
                                        </span>
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

            {/* <div className="m-6 bg-[#2a1a66] rounded-lg p-6 shadow-md">
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
            </div> */}
            <Footer />
        </div>
    );
}
