"use client"

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useMessage } from '@/context/messageContext';
import { SpinningLoader } from './loading';
import { useClient } from '@/context/clientContext';

interface Announcement {
    id?: string;
    title: string;
    content: string;
    isRead: boolean;
    created_at: string;
}

export const AnnouncementSystem = ({ tournamentID }: { tournamentID: number }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null); 

    const supabase = createClient()
    const client = useClient()
    const { triggerMessage } = useMessage()

    useEffect(() => {
        async function loadAnnouncements() {
            setLoading(true);
            const userID = client.session?.user.id;

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

            mergedAnnouncements.sort((a, b) => {
                if (a.isRead === b.isRead) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.isRead ? 1 : -1;
            });

            setAnnouncements(mergedAnnouncements);
            setLoading(false);
        }

        loadAnnouncements();

        const announcementsSubscription = supabase
            .channel('announcements')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
                loadAnnouncements();
            })
            .subscribe();

        const seenSubscription = supabase
            .channel('announcements_seen')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements_seen' }, (payload) => {
                loadAnnouncements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(announcementsSubscription);
            supabase.removeChannel(seenSubscription);
        };
    }, [tournamentID]);

    const addAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;

        const announcement = {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            tournament_id: tournamentID
        };

        const { error } = await supabase.from("announcements").insert(announcement);

        if (error) {
            triggerMessage("Failed to create announcement", "red");
        } else {
            triggerMessage("Announcement created successfully", "green");
            setNewAnnouncement({ title: '', content: '' });
        }
    };

    const toggleReadStatus = async (announcement_id?: string) => {
        const userID = client.session?.user.id;
        if (!userID) return;

        const announcement = announcements.find(a => a.id === announcement_id);
        if (!announcement) return;

        const newReadStatus = announcement.isRead == null || !announcement.isRead;

        const { error } = await supabase
            .from("announcements_seen")
            .upsert([{ member_uuid: userID, announcement_id, seen: newReadStatus }]);

        if (error) {
            console.error("Error updating read status:", error);
        }
    };

    const handleDeleteAnnouncement = async (announcement_id?: string) => {
        if (!announcement_id) return;

        const { error } = await supabase
            .from("announcements_seen")
            .delete()
            .eq("announcement_id", announcement_id);

        const { error:error2 } = await supabase
            .from("announcements")
            .delete()
            .eq("id", announcement_id);

        if (error || error2) {
            triggerMessage("Unable to delete announcement", "red");
        } else {
            triggerMessage("Announcement deleted successfully", "green");
            setAnnouncements((prev) => prev.filter((a) => a.id !== announcement_id));
            setDeleteConfirmation(null);
        }
    };

    if (loading) {
        return <SpinningLoader />;
    }

    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: '#160A3A' }}>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl text-center font-bold mb-8 text-primary">Announcements</h1>

                <div className="mb-8 p-6 rounded-lg bg-[#1E1E1E] border border-solid border-primary shadow-lg shadow-primary/50">
                    <h2 className="text-xl font-semibold mb-6 text-white">Add New Announcement</h2>
                    <input
                        type="text"
                        placeholder="Title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="w-full border-b-primary border-b-2 p-3 mb-6 rounded-lg bg-[#2a2a2a] text-white focus:outline-none focus:border-[#7458da]"
                    />
                    <textarea
                        placeholder="Content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        className="w-full border-b-primary border-b-2 p-3 mb-6 rounded-lg bg-[#2a2a2a] text-white focus:outline-none focus:border-[#7458da]"
                        rows={4}
                    />
                    <button
                        onClick={addAnnouncement}
                        className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                    >
                        Add Announcement
                    </button>
                </div>

                <div className="space-y-6">
                    <AnimatePresence>
                        {announcements.map((announcement) => (
                            <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`p-6 rounded-lg cursor-pointer ${!announcement.isRead ? 'bg-accent' : 'bg-deep'}`}
                                onClick={() => toggleReadStatus(announcement.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-white">{announcement.title}</h3>
                                        <p className="text-white">{announcement.content}</p>
                                        <div className="mt-4 text-sm text-primary font-bold">
                                            {announcement.isRead ? 'Read' : 'Unread'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmation(announcement.id || null);
                                        }}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {deleteConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirmation(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="bg-[#1E1E1E] p-6 rounded-lg border border-primary shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-semibold mb-4 text-white">Delete Announcement</h2>
                            <p className="text-white mb-6">Are you sure you want to delete this announcement?</p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteAnnouncement(deleteConfirmation)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};