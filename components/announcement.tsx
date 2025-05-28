"use client"

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useMessage } from '@/context/messageContext';
import { SpinningLoader } from './loading';
import { useClient } from '@/context/clientContext';
import { DeleteModal } from './modals/delete';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faCheck, faCircle, faTrash, faPlus, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { User } from '@/types/userType';

interface Announcement {
    id?: string;
    title: string;
    content: string;
    isRead: boolean;
    created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'unread';

export const AnnouncementSystem = ({ tournamentID, user }: { tournamentID: number, user: User }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [displayedAnnouncements, setDisplayedAnnouncements] = useState<Announcement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [isUpdating, setIsUpdating] = useState(false);

    const supabase = createClient()
    const client = useClient()
    const { triggerMessage } = useMessage()

    const formatDateTime = (utcDateString: string) => {
        const date = new Date(utcDateString);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSortedAnnouncements = (announcementsToSort: Announcement[], option: SortOption) => {
        const sorted = [...announcementsToSort];

        switch (option) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case 'unread':
                return sorted.sort((a, b) => {
                    if (a.isRead === b.isRead) {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                    return a.isRead ? 1 : -1;
                });
            default:
                return sorted;
        }
    };

    const loadAnnouncements = async () => {
        const userID = client.session?.user.id;
        if (!userID) return;

        setIsUpdating(true);

        try {
            const { data: announcements, error: announcementsError } = await supabase
                .from("announcements")
                .select("*")
                .eq("tournament_id", tournamentID);

            if (announcementsError) {
                triggerMessage("Unable to load announcements", "red");
                return;
            }

            const { data: seenData, error: seenError } = await supabase
                .from("announcements_seen")
                .select("announcement_id, seen")
                .eq("member_uuid", userID);

            if (seenError) {
                triggerMessage("Unable to load seen statuses", "red");
            }

            const seenMap = new Map(seenData?.map(({ announcement_id, seen }) => [announcement_id, seen]));

            const mergedAnnouncements = announcements.map((announcement) => ({
                ...announcement,
                isRead: seenMap.get(announcement.id) ?? false,
            }));

            setAnnouncements(mergedAnnouncements);
            const sorted = getSortedAnnouncements(mergedAnnouncements, sortOption);
            setDisplayedAnnouncements(sorted);
        } catch (error) {
            console.error("Error loading announcements:", error);
        } finally {
            setIsUpdating(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();

        const announcementsSubscription = supabase
            .channel('announcements')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    loadAnnouncements();
                } else if (payload.eventType === 'DELETE') {
                    setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
                    setDisplayedAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    loadAnnouncements();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(announcementsSubscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentID, client.session?.user.id, supabase]);

    useEffect(() => {
        if (!loading) {
            const sorted = getSortedAnnouncements(announcements, sortOption);
            setDisplayedAnnouncements(sorted);
        }
    }, [sortOption, announcements, loading]);

    const handleSortChange = (option: SortOption) => {
        if (option === sortOption) return;
        setSortOption(option);
    };

    const addAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;
        const userID = client.session?.user.id;
        if (!userID) return;

        setIsUpdating(true);

        // Creating with current UTC time
        const announcement = {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            tournament_id: tournamentID,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase.from("announcements").insert(announcement).select();

            if (error) {
                triggerMessage("Failed to create announcement", "red");
            } else {
                await supabase.from("announcements_seen").insert({ member_uuid: userID, seen: true, announcement_id: data[0].id });

                const newAnnouncementWithStatus = {
                    ...data[0],
                    isRead: true
                };

                setAnnouncements(prev => [newAnnouncementWithStatus, ...prev]);
                setDisplayedAnnouncements(prev =>
                    getSortedAnnouncements([newAnnouncementWithStatus, ...prev.filter(a => a.id !== data[0].id)], sortOption)
                );

                triggerMessage("Announcement created successfully", "green");
                setNewAnnouncement({ title: '', content: '' });
            }
        } catch (error) {
            console.error("Error adding announcement:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleReadStatus = async (announcement_id?: string) => {
        const userID = client.session?.user.id;
        if (!userID || !announcement_id) return;

        const announcement = announcements.find(a => a.id === announcement_id);
        if (!announcement) return;

        const newReadStatus = !announcement.isRead;

        const updatedAnnouncements = announcements.map(a =>
            a.id === announcement_id ? { ...a, isRead: newReadStatus } : a
        );

        setAnnouncements(updatedAnnouncements);
        setDisplayedAnnouncements(getSortedAnnouncements(updatedAnnouncements, sortOption));

        try {
            const { data: existingRecord, error: fetchError } = await supabase
                .from("announcements_seen")
                .select("*")
                .eq("member_uuid", userID)
                .eq("announcement_id", announcement_id)
                .single();

            if (fetchError && !fetchError.details.includes("0 rows")) {
                console.error("Error fetching existing record:", fetchError);
                return;
            }

            if (existingRecord) {
                await supabase
                    .from("announcements_seen")
                    .update({ seen: newReadStatus })
                    .eq("member_uuid", userID)
                    .eq("announcement_id", announcement_id);
            } else {
                await supabase
                    .from("announcements_seen")
                    .insert([{ member_uuid: userID, announcement_id, seen: newReadStatus }]);
            }
        } catch (error) {
            console.error("Error updating read status:", error);
            setAnnouncements(prev =>
                prev.map(a => a.id === announcement_id ? { ...a, isRead: !newReadStatus } : a)
            );
            setDisplayedAnnouncements(prev =>
                getSortedAnnouncements(prev.map(a => a.id === announcement_id ? { ...a, isRead: !newReadStatus } : a), sortOption)
            );
        }
    };

    const handleDeleteAnnouncement = async (announcement_id?: string) => {
        if (!announcement_id) return;

        setAnnouncements(prev => prev.filter(a => a.id !== announcement_id));
        setDisplayedAnnouncements(prev => prev.filter(a => a.id !== announcement_id));
        setDeleteConfirmation(null);

        try {
            await supabase
                .from("announcements_seen")
                .delete()
                .eq("announcement_id", announcement_id);

            await supabase
                .from("announcements")
                .delete()
                .eq("id", announcement_id);

            triggerMessage("Announcement deleted successfully", "green");
        } catch (error) {
            console.error("Error deleting announcement:", error);
            triggerMessage("Unable to delete announcement", "red");
            loadAnnouncements();
        }
    };

    if (loading) {
        return <SpinningLoader />;
    }

    return (
        <div className="relative min-h-screen py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto bg-[#201644] rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative px-6 pt-8 md:px-10">
                    <div className="flex items-center justify-center mb-6">
                        <h1 className="bg-gradient-to-r from-purple-200 to-indigo-300 bg-clip-text text-transparent font-bold text-3xl md:text-4xl text-center">
                            <FontAwesomeIcon icon={faBullhorn} className="mr-3 text-purple-200" />
                            Announcements
                        </h1>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {["owner", "admin"].includes(user.permission_level.toLowerCase()) && (
                        <div className="bg-[#2a1a66] rounded-xl p-6 shadow-md mb-8">
                            <h2 className="text-white font-bold text-2xl mb-4">Create New Announcement</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-[#201644] text-white border border-[#7458da]/30 focus:outline-none focus:ring-2 focus:ring-[#7458da]"
                                />
                                <textarea
                                    placeholder="Content"
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-[#201644] text-white border border-[#7458da]/30 focus:outline-none focus:ring-2 focus:ring-[#7458da]"
                                    rows={4}
                                />
                                <button
                                    onClick={addAnnouncement}
                                    disabled={isUpdating}
                                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px] flex items-center justify-center ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isUpdating ? (
                                        <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                    )}
                                    Send Announcement
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <h2 className="text-white font-bold text-xl mb-3 md:mb-0">Sort Announcements</h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleSortChange('newest')}
                                    className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${sortOption === 'newest'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-700/30'
                                            : 'bg-[#2a1a66] text-white hover:bg-[#3b2682]'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faSortDown} className="mr-2" />
                                    Newest
                                </button>
                                <button
                                    onClick={() => handleSortChange('oldest')}
                                    className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${sortOption === 'oldest'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-700/30'
                                            : 'bg-[#2a1a66] text-white hover:bg-[#3b2682]'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faSortUp} className="mr-2" />
                                    Oldest
                                </button>
                                <button
                                    onClick={() => handleSortChange('unread')}
                                    className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${sortOption === 'unread'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-700/30'
                                            : 'bg-[#2a1a66] text-white hover:bg-[#3b2682]'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faCircle} className="mr-2" size="xs" />
                                    Unread First
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {displayedAnnouncements.map((announcement) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    layoutId={announcement.id}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                        layoutDependency: announcement.isRead
                                    }}
                                    className={`p-6 rounded-xl cursor-pointer shadow-md ${announcement.isRead ? 'bg-[#2a1a66]' : 'bg-[#3b2682]'} hover:shadow-lg hover:shadow-indigo-700/30 transition-all duration-200`}
                                    onClick={() => toggleReadStatus(announcement.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                                                {!announcement.isRead && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="ml-3"
                                                    >
                                                        <FontAwesomeIcon icon={faCircle} className="text-[#7458da] text-sm" />
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="text-gray-300 mt-2">{announcement.content}</p>
                                            <div className="mt-3 text-sm flex items-center justify-between">
                                                <span className={`${announcement.isRead ? 'text-gray-400' : 'text-[#7458da]'} font-medium flex items-center`}>
                                                    {announcement.isRead ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                                            Read
                                                        </>
                                                    ) : (
                                                        'Unread'
                                                    )}
                                                </span>
                                                <span className="text-gray-400">
                                                    {formatDateTime(announcement.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmation(announcement.id ?? null);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-[#2a1a66] rounded-full"
                                            title="Delete Announcement"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {displayedAnnouncements.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>No announcements yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteModal word="Announcement" id={deleteConfirmation} setId={setDeleteConfirmation} handleDelete={handleDeleteAnnouncement} />
        </div>
    );
};