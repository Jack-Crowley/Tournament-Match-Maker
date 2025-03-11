import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessage } from '@/context/messageContext';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { ModalList } from './modalList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faMapPin, faCalendar, faUsers, faAward, faBook, faTimes, faPlus, faTrashAlt, faCheck } from '@fortawesome/free-solid-svg-icons';

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
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
        setIsLoading(true);

        try {
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

            // Update organizers
            let successCount = 0;
            let failCount = 0;

            for (const organizer of organizers) {
                const { email, permission } = organizer;

                // Lookup user by email
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('uuid')
                    .eq('email', email)
                    .single();

                if (userError || !userData) {
                    failCount++;
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
                                accepted: false,
                            },
                        ]);

                    if (addOrganizerError) {
                        failCount++;
                    } else {
                        successCount++;
                    }
                } else {
                    // Check if the permission level is actually changing
                    if (organizerData.permission_level === permission) {
                        successCount++;
                        continue;
                    }

                    // User is already an organizer, update their permission level
                    const { error: updateError } = await supabase
                        .from('tournament_organizers')
                        .update({ permission_level: permission })
                        .eq('tournament_id', tournament.id)
                        .eq('member_uuid', userUuid);

                    if (updateError) {
                        failCount++;
                    } else {
                        successCount++;
                    }
                }
            }

            onClose();
            setTournament(tournamentData[0]);

            if (failCount > 0) {
                triggerMessage(`Tournament updated with ${successCount} organizers. ${failCount} organizers failed.`, 'blue');
            } else {
                triggerMessage('Tournament updated successfully!', 'green');
            }
        } catch {
            triggerMessage('An unexpected error occurred', 'red');
        } finally {
            setIsLoading(false);
        }
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

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case 'Admin':
                return 'bg-purple-600';
            case 'Scorekeeper':
                return 'bg-blue-600';
            case 'Viewer':
                return 'bg-gray-600';
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gradient-to-b from-[#252525] to-[#1A1A1A] p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh] border border-[#7458da]/30"
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <FontAwesomeIcon icon={faEdit} className="mr-2 text-[#7458da]" />
                                Edit Tournament
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-[#303030]"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="flex space-x-6 mb-6 border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`pb-2 relative text-lg font-medium transition-colors ${activeTab === 'info' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                Tournament Information
                                {activeTab === 'info' && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7458da]"
                                        layoutId="underline"
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('organizers')}
                                className={`pb-2 relative text-lg font-medium transition-colors ${activeTab === 'organizers' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                Tournament Organizers
                                {activeTab === 'organizers' && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7458da]"
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
                                transition={{ staggerChildren: 0.05 }}
                            >
                                <div className="group">
                                    <label className="text-white block text-sm mb-2 font-medium">Tournament Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                            placeholder="Enter Tournament Name"
                                            className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-white block text-sm mb-2 font-medium">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                        placeholder="Enter Description"
                                        className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors min-h-24 resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="text-white text-sm mb-2 font-medium flex items-center">
                                        <FontAwesomeIcon icon={faMapPin} className="mr-1 text-[#7458da]" /> Location
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                        placeholder="Enter Location"
                                        className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-white text-sm mb-2 font-medium flex items-center">
                                            <FontAwesomeIcon icon={faCalendar} className="mr-1 text-[#7458da]" /> Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={startTime}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                                            className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white text-sm mb-2 font-medium flex items-center">
                                            <FontAwesomeIcon icon={faCalendar} className="mr-1 text-[#7458da]" /> End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={endTime}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                                            className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-white text-sm mb-2 font-medium flex items-center">
                                        <FontAwesomeIcon icon={faUsers} className="mr-1 text-[#7458da]" /> Maximum Players
                                    </label>
                                    <input
                                        type="number"
                                        value={maxPlayers}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPlayers(Number(e.target.value))}
                                        placeholder="Enter Maximum Players"
                                        className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        disabled={tournament?.status === "started"} // Disable input if tournament status is "started"
                                    />
                                    {tournament?.status === "started" && ( // Display text if tournament status is "started"
                                        <p className="text-sm text-red-400 mt-1">Tournament has already started. Cannot change max players.</p>
                                    )}
                                </div>

                                <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
                                    <div className="flex items-center mb-3">
                                        <FontAwesomeIcon icon={faAward} className="mr-2 text-[#7458da]" />
                                        <h3 className="text-white font-medium">Skill Fields</h3>
                                    </div>
                                    <ModalList name="Skill Fields" list={skillFields} setList={setSkillFields} />
                                </div>

                                {/* <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
                                    <div className="flex items-center mb-3">
                                        <FontAwesomeIcon icon={faBook} className="mr-2 text-[#7458da]" />
                                        <h3 className="text-white font-medium">Tournament Rules</h3>
                                    </div>
                                    <ModalList name="Rules" list={rules} setList={setRules} />
                                </div> */}
                            </motion.div>
                        )}

                        {activeTab === 'organizers' && (
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="bg-[#252525] p-4 rounded-lg mb-6 border border-[#3A3A3A]">
                                    <h3 className="text-lg font-medium text-white mb-2">Add New Organizer</h3>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="email"
                                            value={newOrganizerEmail}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewOrganizerEmail(e.target.value)}
                                            placeholder="Enter organizer email"
                                            className="flex-grow p-2 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        />
                                        <select
                                            value={newOrganizerPermission}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                                setNewOrganizerPermission(e.target.value as 'Admin' | 'Scorekeeper' | 'Viewer')
                                            }
                                            className="p-2 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Scorekeeper">Scorekeeper</option>
                                            <option value="Viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={handleAddOrganizer}
                                            className="bg-[#7458da] hover:bg-[#604BAC] text-white p-2 rounded-lg transition-colors flex items-center"
                                            disabled={!newOrganizerEmail}
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                </div>

                                {organizers.length > 0 ? (
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {organizers.map((organizer, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center space-x-3 bg-[#2a2a2a] p-3 rounded-lg"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <input
                                                    type="email"
                                                    value={organizer.email}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleEditOrganizer(index, e.target.value, organizer.permission)
                                                    }
                                                    className="flex-grow p-2 bg-[#252525] rounded-lg border border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                                />
                                                <select
                                                    value={organizer.permission}
                                                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                                        handleEditOrganizer(index, organizer.email, e.target.value as 'Admin' | 'Scorekeeper' | 'Viewer')
                                                    }
                                                    className={`p-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] transition-colors ${getPermissionColor(organizer.permission)}`}
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="Scorekeeper">Scorekeeper</option>
                                                    <option value="Viewer">Viewer</option>
                                                </select>
                                                <button
                                                    onClick={() => handleDeleteOrganizer(index)}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No organizers added yet. Add someone above.
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                onClick={onClose}
                                className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white px-5 py-2 rounded-lg transition-colors flex items-center"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-1" /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className={`bg-[#7458da] hover:bg-[#604BAC] text-white px-6 py-2 rounded-lg transition-colors flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <FontAwesomeIcon icon={faCheck} className="mr-1" /> Save Changes
                                    </span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};