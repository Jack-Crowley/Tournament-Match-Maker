import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessage } from '@/context/messageContext';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { ModalList } from './modalList';

export const TournamentModal = ({
    isOpen,
    onClose,
    tournament,
    setTournament,
}: {
    isOpen: boolean;
    onClose: () => void;
    tournament: Tournament;
    setTournament: (state: Tournament) => void;
}) => {
    const supabase = createClient();
    const { triggerMessage } = useMessage();

    const [name, setName] = useState<string>(tournament.name || '');
    const [description, setDescription] = useState<string>(tournament.description || '');
    const [location, setLocation] = useState<string>(tournament.location || '');
    const [startTime, setStartTime] = useState<string>(tournament.start_time || '');
    const [endTime, setEndTime] = useState<string>(tournament.end_time || '');
    const [maxPlayers, setMaxPlayers] = useState<number>(tournament.max_players || 0);
    const [skillFields, setSkillFields] = useState<string[]>(tournament.skill_fields || []);
    const [rules, setRules] = useState<string[]>(tournament.rules || []);
    const [activeTab, setActiveTab] = useState<'info' | 'organizers'>('info');
    const [organizers, setOrganizers] = useState<{ email: string; permission: 'Admin' | 'Scorekeeper' | 'Viewer' }[]>([]);
    const [newOrganizerEmail, setNewOrganizerEmail] = useState<string>('');
    const [newOrganizerPermission, setNewOrganizerPermission] = useState<'Admin' | 'Scorekeeper' | 'Viewer'>('Viewer');

    useEffect(() => {
        const fetchOrganizers = async (tournamentId: string) => {
            const { data: organizersData, error: organizersError } = await supabase
                .from('tournament_organizers')
                .select('member_uuid, permission_level')
                .eq('tournament_id', tournamentId);

            if (organizersError) {
                console.error('Error fetching organizers:', organizersError.message);
                return [];
            }

            const organizersWithEmails = await Promise.all(
                organizersData.map(async (organizer) => {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('email')
                        .eq('uuid', organizer.member_uuid)
                        .single();

                    if (userError || !userData) {
                        console.error('Error fetching user email:', userError?.message);
                        return null;
                    }

                    return {
                        email: userData.email,
                        permission: organizer.permission_level,
                    };
                })
            );

            return organizersWithEmails.filter((organizer) => organizer !== null);
        };

        if (tournament) {
            setName(tournament.name || '');
            setDescription(tournament.description || '');
            setLocation(tournament.location || '');
            setStartTime(tournament.start_time || '');
            setEndTime(tournament.end_time || '');
            setMaxPlayers(tournament.max_players || 0);
            setSkillFields(tournament.skill_fields || []);
            setRules(tournament.rules || []);

            fetchOrganizers(tournament.id).then((organizers) => {
                setOrganizers(organizers);
            });
        }
    }, [tournament, supabase]);

    const handleSave = async () => {
        if (!tournament) return;

        // Update tournament details
        const update: Partial<Tournament> = {
            name,
            description,
            location,
            skill_fields: skillFields,
            rules,
        };

        if (startTime) {
            update.start_time = startTime;
        }
        if (endTime) {
            update.end_time = endTime;
        }
        if (maxPlayers) {
            update.max_players = maxPlayers;
        }

        const { data: tournamentData, error: tournamentError } = await supabase
            .from('tournaments')
            .update(update)
            .eq('id', tournament.id)
            .select();

        if (tournamentError) {
            triggerMessage('Error updating tournament: ' + tournamentError.message, 'red');
            return;
        }

        for (const organizer of organizers) {
            const { email, permission } = organizer;

            // Lookup user by email
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('uuid')
                .eq('email', email)
                .single();

            if (userError || !userData) {
                triggerMessage(`No member found with email: ${email}`, 'red');
                continue;
            }

            const userUuid = userData.uuid;

            // Check if the user is already an organizer for the tournament
            const { data: organizerData, error: organizerError } = await supabase
                .from('tournament_organizers')
                .select('accepted, permission_level')
                .eq('tournament_id', tournament.id)
                .eq('member_uuid', userUuid)
                .single();

            if (organizerError || !organizerData) {
                // User is not an organizer, add them
                const { error: addOrganizerError } = await supabase
                    .from('tournament_organizers')
                    .insert([
                        {
                            tournament_id: tournament.id,
                            member_uuid: userUuid,
                            permission_level: permission,
                            accepted: false, // Assuming new organizers are not accepted by default
                        },
                    ]);

                if (addOrganizerError) {
                    triggerMessage(`Error adding organizer with email: ${email}`, 'red');
                } else {
                    triggerMessage(`Successfully added organizer with email: ${email}`, 'green');
                }
            } else {
                // Check if the permission level is actually changing
                if (organizerData.permission_level === permission) {
                    // Permission level is the same, no need to update or send a message
                    continue;
                }

                // User is already an organizer, update their permission level
                const { error: updateError } = await supabase
                    .from('tournament_organizers')
                    .update({ permission_level: permission })
                    .eq('tournament_id', tournament.id)
                    .eq('member_uuid', userUuid);

                if (updateError) {
                    triggerMessage(`Error updating permission for organizer with email: ${email}`, 'red');
                } else {
                    const statusMessage = `updated to ${permission}`;
                    triggerMessage(`Organizer with email: ${email} is ${statusMessage}`, 'blue');
                }
            }
        }

        onClose();
        setTournament(tournamentData[0]);
        triggerMessage('Tournament updated successfully!', 'green');
    };

    const handleAddOrganizer = () => {
        if (newOrganizerEmail.trim() === '') return;
        setOrganizers([...organizers, { email: newOrganizerEmail, permission: newOrganizerPermission }]);
        setNewOrganizerEmail('');
        setNewOrganizerPermission('Viewer');
    };

    const handleEditOrganizer = (index: number, newEmail: string, newPermission: 'Admin' | 'Scorekeeper' | 'Viewer') => {
        const updatedOrganizers = [...organizers];
        updatedOrganizers[index] = { email: newEmail, permission: newPermission };
        setOrganizers(updatedOrganizers);
    };

    const handleDeleteOrganizer = (index: number) => {
        const updatedOrganizers = organizers.filter((_, i) => i !== index);
        setOrganizers(updatedOrganizers);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-[#1E1E1E] p-8 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">Edit Tournament</h2>
                        <div className="flex space-x-6 mb-6 border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`pb-2 relative text-lg font-medium ${activeTab === 'info' ? 'text-white' : 'text-gray-400'
                                    }`}
                            >
                                Tournament Information
                                {activeTab === 'info' && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#604BAC]"
                                        layoutId="underline"
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('organizers')}
                                className={`pb-2 relative text-lg font-medium ${activeTab === 'organizers' ? 'text-white' : 'text-gray-400'
                                    }`}
                            >
                                Tournament Organizers
                                {activeTab === 'organizers' && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#604BAC]"
                                        layoutId="underline"
                                    />
                                )}
                            </button>
                        </div>
                        {activeTab === 'info' && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div>
                                    <label className="text-white block text-sm mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        placeholder="Enter Tournament Name"
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white block text-sm mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                        placeholder="Enter Description"
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white block text-sm mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                        placeholder="Enter Location"
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white block text-sm mb-2">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white block text-sm mb-2">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white block text-sm mb-2">Maximum Players</label>
                                    <input
                                        type="number"
                                        value={maxPlayers}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPlayers(Number(e.target.value))}
                                        placeholder="Enter Maximum Players"
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                </div>
                                <ModalList name="Skill Fields" list={skillFields} setList={setSkillFields} />
                                <ModalList name="Rules" list={rules} setList={setRules} />
                            </motion.div>
                        )}
                        {activeTab === 'organizers' && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {organizers.map((organizer, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <input
                                            type="email"
                                            value={organizer.email}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleEditOrganizer(index, e.target.value, organizer.permission)
                                            }
                                            className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                        />
                                        <select
                                            value={organizer.permission}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                                handleEditOrganizer(index, organizer.email, e.target.value as 'Admin' | 'Scorekeeper' | 'Viewer')
                                            }
                                            className="p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Scorekeeper">Scorekeeper</option>
                                            <option value="Viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={() => handleDeleteOrganizer(index)}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="email"
                                        value={newOrganizerEmail}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewOrganizerEmail(e.target.value)}
                                        placeholder="Enter organizer email"
                                        className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    />
                                    <select
                                        value={newOrganizerPermission}
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                            setNewOrganizerPermission(e.target.value as 'Admin' | 'Scorekeeper' | 'Viewer')
                                        }
                                        className="p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Scorekeeper">Scorekeeper</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                    <button
                                        onClick={handleAddOrganizer}
                                        className="bg-green-500 text-white px-2 py-1 rounded"
                                    >
                                        Add
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        <div className="mt-8 space-x-4">
                            <button onClick={handleSave} className="bg-[#604BAC] text-white px-6 py-2 rounded-lg">
                                Save
                            </button>
                            <button onClick={onClose} className="bg-gray-500 text-white px-6 py-2 rounded-lg">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};