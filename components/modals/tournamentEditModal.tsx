import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessage } from '@/context/messageContext';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { ModalList, SkillField } from './modalList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faMapPin, faCalendar, faUsers, faTimes, faPlus, faTrashAlt, faCheck, faChessBoard, faStar } from '@fortawesome/free-solid-svg-icons';

// Updated interfaces to match createTournament.tsx
interface SwissSettings {
    type: 'rounds' | 'points';
    type_value: number;
    sorting_algo: 'random' | "seeded" | "ranked";
    sorting_value: number;
}

interface SingleSettings { 
    sorting_algo: 'random' | "seeded" | "ranked";
    sorting_value: number;
}

interface RobinSettings { }

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
    const [skillFields, setSkillFields] = useState<SkillField[]>(tournament.skill_fields || []);
    const [rules, setRules] = useState<string[]>(tournament.rules || []);
    const [activeTab, setActiveTab] = useState<'info' | 'organizers'>('info');
    const [organizers, setOrganizers] = useState<{ email: string; permission: 'Admin' | 'Scorekeeper' | 'Viewer' }[]>([]);
    const [newOrganizerEmail, setNewOrganizerEmail] = useState<string>('');
    const [newOrganizerPermission, setNewOrganizerPermission] = useState<'Admin' | 'Scorekeeper' | 'Viewer'>('Viewer');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Updated state to use the same structure as createTournament.tsx
    const [swissSettings, setSwissSettings] = useState<SwissSettings>({ 
        type: 'rounds', 
        type_value: 3,
        sorting_algo: 'random',
        sorting_value: 4
    });
    
    const [singleSettings, setSingleSettings] = useState<SingleSettings>({ 
        sorting_algo: 'random',
        sorting_value: 4
    });
    
    const [robinSettings, setRobinSettings] = useState<RobinSettings>({});

    useEffect(() => {
        const fetchOrganizers = async (tournamentId: string) => {
            try {
                const response = await fetch(`/api/tournament/organizers?tournamentID=${tournamentId}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error fetching organizers:', errorData.error);
                    return [];
                }

                const data = await response.json();
                return data.organizers;
            } catch (error) {
                console.error('Error fetching organizers:', error);
                return [];
            }
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
            
            // Extract style_specific_settings based on tournament type
            if (tournament.tournament_type === 'swiss' && tournament.style_specific_settings) {
                setSwissSettings((tournament.style_specific_settings as any) as SwissSettings);
            } else if (tournament.tournament_type === 'swiss') {
                // Default values if swiss format but no settings yet
                setSwissSettings({ 
                    type: 'rounds', 
                    type_value: 3,
                    sorting_algo: 'random',
                    sorting_value: 4  
                });
            }

            if (tournament.tournament_type === 'single' && tournament.style_specific_settings) {
                setSingleSettings((tournament.style_specific_settings as any) as SingleSettings);
            } else if (tournament.tournament_type === 'single') {
                setSingleSettings({ 
                    sorting_algo: 'random',
                    sorting_value: 4
                });
            }

            if (tournament.tournament_type === 'robin' && tournament.style_specific_settings) {
                setRobinSettings(tournament.style_specific_settings as RobinSettings);
            } else if (tournament.tournament_type === 'robin') {
                setRobinSettings({});
            }

            fetchOrganizers(tournament.id).then((organizers) => {
                setOrganizers(organizers);
            });
        }
    }, [tournament]);

    const handleSave = async () => {
        if (!tournament) return;
        setIsLoading(true);

        try {
            // Update tournament details
            const update: any = {
                name,
                description,
                location,
                skill_fields: skillFields,
                rules,
            };

            // Include style-specific settings based on tournament type
            if (tournament.tournament_type === 'swiss') {
                update.style_specific_settings = swissSettings;
            } else if (tournament.tournament_type === 'single') {
                update.style_specific_settings = singleSettings;
            } else if (tournament.tournament_type === 'robin') {
                update.style_specific_settings = robinSettings;
            }

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

            try {
                const response = await fetch('/api/tournament/organizers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tournamentID: tournament.id,
                        organizers: organizers
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update organizers');
                }

                const data = await response.json();
                successCount = data.successCount;
                failCount = data.failCount;
            } catch (error) {
                console.error('Error updating organizers:', error);
                failCount = organizers.length;
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

                                {/* Single Elimination Tournament Settings */}
                                {tournament?.tournament_type === 'single' && (
                                    <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
                                        <div className="flex items-center mb-3">
                                            <FontAwesomeIcon icon={faStar} className="mr-2 text-[#7458da]" />
                                            <h3 className="text-white font-medium">Single Tournament Settings</h3>
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-gray-300 block text-sm mb-2 font-medium">Matchmaking</label>
                                            <div className="flex space-x-2">
                                                <button
                                                    className={`flex-1 p-2 rounded ${singleSettings.sorting_algo === 'random'
                                                        ? 'bg-[#7458da] text-white'
                                                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                    onClick={() => setSingleSettings({ ...singleSettings, sorting_algo: 'random' })}
                                                    disabled={tournament?.status === "started"}
                                                >
                                                    Random
                                                </button>
                                                <button
                                                    className={`flex-1 p-2 rounded ${singleSettings.sorting_algo === 'seeded'
                                                        ? 'bg-[#7458da] text-white'
                                                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                    onClick={() => setSingleSettings({ ...singleSettings, sorting_algo: 'seeded' })}
                                                    disabled={tournament?.status === "started"}
                                                >
                                                    Seeded
                                                </button>
                                                <button
                                                    className={`flex-1 p-2 rounded ${singleSettings.sorting_algo === 'ranked'
                                                        ? 'bg-[#7458da] text-white'
                                                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                    onClick={() => setSingleSettings({ ...singleSettings, sorting_algo: 'ranked' })}
                                                    disabled={tournament?.status === "started"}
                                                >
                                                    Ranked
                                                </button>
                                            </div>
                                        </div>

                                        {singleSettings.sorting_algo === "seeded" && (
                                            <div>
                                                <label className="text-gray-300 block text-sm mb-2 font-medium">
                                                    How many players per group
                                                </label>
                                                <input
                                                    type="number"
                                                    value={singleSettings.sorting_value}
                                                    onChange={(e) => setSingleSettings({
                                                        ...singleSettings,
                                                        sorting_value: parseInt(e.target.value) || 0
                                                    })}
                                                    min="1"
                                                    className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                    disabled={tournament?.status === "started"}
                                                />
                                            </div>
                                        )}
                                        
                                        {tournament?.status === "started" && (
                                            <p className="text-sm text-red-400 mt-2">
                                                Tournament has already started. Cannot change tournament settings.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Swiss Tournament Settings */}
                                {tournament?.tournament_type === 'swiss' && (
                                    <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
                                        <div className="flex items-center mb-3">
                                            <FontAwesomeIcon icon={faChessBoard} className="mr-2 text-[#7458da]" />
                                            <h3 className="text-white font-medium">Swiss Tournament Settings</h3>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex space-x-4 mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSwissSettings({ ...swissSettings, type: 'rounds' })}
                                                    className={`px-4 py-2 rounded-lg text-white transition-colors flex-1 ${
                                                        swissSettings.type === 'rounds' 
                                                            ? 'bg-[#7458da]' 
                                                            : 'bg-[#3A3A3A] hover:bg-[#4A4A4A]'
                                                    }`}
                                                    disabled={tournament?.status === "started"}
                                                >
                                                    Fixed Rounds
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSwissSettings({ ...swissSettings, type: 'points' })}
                                                    className={`px-4 py-2 rounded-lg text-white transition-colors flex-1 ${
                                                        swissSettings.type === 'points' 
                                                            ? 'bg-[#7458da]' 
                                                            : 'bg-[#3A3A3A] hover:bg-[#4A4A4A]'
                                                    }`}
                                                    disabled={tournament?.status === "started"}
                                                >
                                                    Points to Win
                                                </button>
                                            </div>
                                            <div className="mb-2">
                                                <label className="text-white text-sm mb-2 font-medium">
                                                    {swissSettings.type === 'rounds' ? 'Number of Rounds' : 'Points to Win'}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={swissSettings.type_value}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                                                        setSwissSettings({
                                                            ...swissSettings,
                                                            type_value: parseInt(e.target.value) || 1
                                                        })
                                                    }
                                                    className="w-full p-3 bg-[#2D2D2D] rounded-lg border-2 border-[#3A3A3A] text-white focus:outline-none focus:border-[#7458da] transition-colors"
                                                    disabled={tournament?.status === "started"}
                                                />
                                            </div>
                                            <p className="text-gray-400 text-sm">
                                                {swissSettings.type === 'rounds' 
                                                    ? 'Tournament will end after this many rounds, regardless of standings.' 
                                                    : 'Tournament will continue until a player reaches this many points.'}
                                            </p>
                                            
                                            <div className="mb-3 mt-12">
                                                <label className="text-gray-300 block text-sm mb-2 font-medium">Matchmaking</label>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className={`flex-1 p-2 rounded ${swissSettings.sorting_algo === 'random'
                                                            ? 'bg-[#7458da] text-white'
                                                            : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                        onClick={() => setSwissSettings({ ...swissSettings, sorting_algo: 'random' })}
                                                        disabled={tournament?.status === "started"}
                                                    >
                                                        Random
                                                    </button>
                                                    <button
                                                        className={`flex-1 p-2 rounded ${swissSettings.sorting_algo === 'seeded'
                                                            ? 'bg-[#7458da] text-white'
                                                            : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                        onClick={() => setSwissSettings({ ...swissSettings, sorting_algo: 'seeded' })}
                                                        disabled={tournament?.status === "started"}
                                                    >
                                                        Seeded
                                                    </button>
                                                    <button
                                                        className={`flex-1 p-2 rounded ${swissSettings.sorting_algo === 'ranked'
                                                            ? 'bg-[#7458da] text-white'
                                                            : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'}`}
                                                        onClick={() => setSwissSettings({ ...swissSettings, sorting_algo: 'ranked' })}
                                                        disabled={tournament?.status === "started"}
                                                    >
                                                        Ranked
                                                    </button>
                                                </div>
                                            </div>

                                            {swissSettings.sorting_algo === "seeded" && (
                                                <div>
                                                    <label className="text-gray-300 block text-sm mb-2 font-medium">
                                                        How many players per group
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={swissSettings.sorting_value}
                                                        onChange={(e) => setSwissSettings({
                                                            ...swissSettings,
                                                            sorting_value: parseInt(e.target.value) || 0
                                                        })}
                                                        min="1"
                                                        className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                        disabled={tournament?.status === "started"}
                                                    />
                                                </div>
                                            )}
                                            
                                            {tournament?.status === "started" && (
                                                <p className="text-sm text-red-400 mt-2">
                                                    Tournament has already started. Cannot change Swiss tournament settings.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <ModalList name="Skill Fields" list={skillFields} setList={setSkillFields} />
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