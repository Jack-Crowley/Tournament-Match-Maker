import { useClient } from '@/context/clientContext';
import { useMessage } from '@/context/messageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faUserShield, faInfoCircle, faMapPin, faCalendar, faUsers, faAward, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

interface Button {
    id: string;
    label: string;
    icon?: any;
    description: string;
}

interface Rules {
    [key: string]: boolean;
}

const generalRules: { fullName: string, id: string, description: string }[] = [
    { fullName: "Require Accounts", id: "accounts", description: "Participants must have an account to join" },
]

const buttons: Button[] = [
    { id: "single", label: "Single Elimination", description: "Knockout format with one chance per participant" },
    { id: "double", label: "Double Elimination", description: "Two chances before elimination" },
    { id: "robin", label: "Round Robin", description: "Everyone plays against everyone" },
    { id: "swiss", label: "Swiss System", description: "Players with similar scores face each other" },
];

const implemented = ["robin", "single"]

export const CreateTournament = ({ isModalOpen, setIsModalOpen, ref }: { isModalOpen: boolean, ref: any, setIsModalOpen: (state: boolean) => void }) => {
    const [rules, setRules] = useState<Rules>({});
    const [selectedButton, setSelectedButton] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState<string>('');
    const [tournamentDescription, setTournamentDescription] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [skillFields, setSkillFields] = useState<string[]>([]);
    const [newSkillField, setNewSkillField] = useState<string>('');
    const [step, setStep] = useState<number>(1);
    const { triggerMessage } = useMessage()
    const client = useClient()
    const supabase = createClient()
    const router = useRouter()

    const handleCreateTournament = async () => {
        if (!tournamentName || !selectedButton) {
            triggerMessage('Please select a tournament type and provide a name.', 'red');
            return;
        }

        if (!implemented.includes(selectedButton)) {
            triggerMessage('Only Single Elimination tournaments are currently implemented.', 'red');
            return;
        }

        const tournamentData = {
            name: tournamentName,
            description: tournamentDescription,
            owner: client.session?.user.id,
            custom_rules: Object.keys(rules).reduce((acc: any, key) => {
                if (key.startsWith('custom-rule')) {
                    acc[key] = rules[key];
                }
                return acc;
            }, {}),
            status: 'initialization',
            tournament_type: selectedButton,
            location: location,
            start_time: startTime || null,
            end_time: endTime || null,
            max_players: maxPlayers || null,
            skill_fields: skillFields,
            require_account: rules['accounts'] || false
        };

        const { data, error } = await supabase
            .from('tournaments')
            .insert(tournamentData)
            .select();

        if (error) {
            triggerMessage("Error creating tournament: " + error.message, "red");
        } else {
            resetForm();
            setIsModalOpen(false);
            triggerMessage("Tournament created successfully! Redirecting...", "green");

            setTimeout(() => {
                router.push(`/tournament/${(data![0] as any).id}`);
            }, 1200)
        }
    };

    const resetForm = () => {
        setTournamentName('');
        setTournamentDescription('');
        setSelectedButton(null);
        setLocation('');
        setStartTime('');
        setEndTime('');
        setMaxPlayers(0);
        setSkillFields([]);
        setNewSkillField('');
        setStep(1);
        
        const startRules = {}
        generalRules.forEach((rule) => {
            (startRules as any)[rule.id] = false;
        })
        setRules(startRules)
    }

    const Switch = ({ label, description, ruleKey }: { label: string, description?: string, ruleKey: string }) => {
        const [isOn, setIsOn] = useState<boolean>(rules[ruleKey] || false);
    
        const handleSwitchChange = () => {
            setIsOn(!isOn);
            setRules(prev => ({
                ...prev,
                [ruleKey]: !isOn
            }));
        };
    
        return (
            <div className="flex items-center justify-between py-2 px-1 hover:bg-[#2C2C2C] rounded-md transition-colors">
                <div className="flex flex-col">
                    <span className="text-white font-medium">{label}</span>
                    {description && <span className="text-gray-400 text-xs mt-1">{description}</span>}
                </div>
                <motion.div
                    className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer ${isOn ? "justify-end" : "justify-start"}`}
                    onClick={handleSwitchChange}
                    initial={false}
                    animate={{
                        background: isOn
                            ? "linear-gradient(45deg, #7458da, #9c8aeb)"
                            : "linear-gradient(45deg, #3A3A3A, #5C5C5C)",
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="w-4 h-4 bg-white rounded-full shadow-md"
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                </motion.div>
            </div>
        );
    };

    const handleButtonSelect = (id: string) => {
        setSelectedButton(id);
        setStep(2);
    };

    const addSkillField = () => {
        if (newSkillField.trim() && !skillFields.includes(newSkillField.trim())) {
            setSkillFields([...skillFields, newSkillField.trim()]);
            setNewSkillField('');
        }
    };

    const removeSkillField = (index: number) => {
        const updatedFields = [...skillFields];
        updatedFields.splice(index, 1);
        setSkillFields(updatedFields);
    };

    const isImplemented = (buttonId: string) => {
        return implemented.includes(buttonId);
    };

    useEffect(() => {
        const startRules = {}
        generalRules.forEach((rule) => {
            (startRules as any)[rule.id] = false;
        })
        setRules(startRules)
    }, [])

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            resetForm();
        }
    }, [isModalOpen]);

    return (
        <div>
            {isModalOpen && (
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                        >
                            <motion.div
                                ref={ref}
                                className="bg-gradient-to-b from-[#252525] to-[#1E1E1E] p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {step === 1 && (
                                    <>
                                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                                            <FontAwesomeIcon icon={faTrophy} className="text-[#7458da] mr-3" />
                                            Create New Tournament
                                        </h2>

                                        <div className="mb-6">
                                            <h3 className="text-md font-medium mb-3 text-gray-300">Tournament Type</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {buttons.map((button) => (
                                                    <div key={button.id} className="relative">
                                                        <motion.button
                                                            className={`p-4 rounded-lg text-white text-center flex flex-col items-center justify-center ${
                                                                selectedButton === button.id
                                                                    ? "bg-gradient-to-br from-[#7458da] to-[#604BAC] shadow-lg shadow-[#7458da]/20"
                                                                    : isImplemented(button.id)
                                                                        ? "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                                                                        : "bg-[#2C2C2C] opacity-60 cursor-not-allowed"
                                                            } w-full`}
                                                            whileHover={isImplemented(button.id) ? { scale: 1.03, y: -2 } : { scale: 1 }}
                                                            whileTap={isImplemented(button.id) ? { scale: 0.97 } : { scale: 1 }}
                                                            onClick={() => isImplemented(button.id) && handleButtonSelect(button.id)}
                                                        >
                                                            <span className="font-medium mb-1">{button.label}</span>
                                                            <span className="text-xs text-gray-300 mt-1 overflow-hidden text-ellipsis">
                                                                {button.description}
                                                            </span>
                                                        </motion.button>
                                                        
                                                        {!isImplemented(button.id) && (
                                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none">
                                                                <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded text-xs font-medium flex items-center">
                                                                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-[#7458da]" />
                                                                    Coming Soon!
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-8 grid grid-cols-1 gap-4">
                                            <motion.button
                                                className="bg-[#2C2C2C] text-white px-4 py-3 rounded-lg hover:bg-[#3C3C3C] transition-colors font-medium"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <div className="flex items-center mb-6">
                                            <button 
                                                onClick={() => setStep(1)}
                                                className="mr-3 text-[#7458da] hover:text-[#8a6ceb] transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} size="lg" />
                                            </button>
                                            <h2 className="text-2xl font-bold text-white flex items-center">
                                                <FontAwesomeIcon icon={faTrophy} className="text-[#7458da] mr-3" />
                                                Tournament Details
                                            </h2>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-gray-300 block text-sm mb-2 font-medium">Tournament Name</label>
                                                <input
                                                    type="text"
                                                    value={tournamentName}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTournamentName(e.target.value)}
                                                    placeholder="Enter tournament name"
                                                    className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-gray-300 block text-sm mb-2 font-medium">Tournament Description</label>
                                                <textarea
                                                    value={tournamentDescription}
                                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTournamentDescription(e.target.value)}
                                                    placeholder="Enter tournament description"
                                                    className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                    rows={3}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">
                                                    <FontAwesomeIcon icon={faMapPin} className="mr-1 text-[#7458da]" /> Location
                                                </label>
                                                <input
                                                    type="text"
                                                    value={location}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                                    placeholder="Enter Location"
                                                    className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">
                                                        <FontAwesomeIcon icon={faCalendar} className="mr-1 text-[#7458da]" /> Start Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={startTime}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                                                        className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">
                                                        <FontAwesomeIcon icon={faCalendar} className="mr-1 text-[#7458da]" /> End Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={endTime}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                                                        className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">
                                                    <FontAwesomeIcon icon={faUsers} className="mr-1 text-[#7458da]" /> Maximum Players
                                                </label>
                                                <input
                                                    type="number"
                                                    value={maxPlayers}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPlayers(Number(e.target.value))}
                                                    placeholder="Enter Maximum Players"
                                                    className="w-full p-3 bg-[#2a2a2a] border-l-4 border-[#7458da] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7458da] focus:ring-opacity-50 transition-all"
                                                />
                                            </div>

                                            {/* <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
                                                <div className="flex items-center mb-3">
                                                    <FontAwesomeIcon icon={faAward} className="mr-2 text-[#7458da]" />
                                                    <h3 className="text-white font-medium">Skill Fields</h3>
                                                </div>
                                                <div className="flex mb-2">
                                                    <input
                                                        type="text"
                                                        value={newSkillField}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkillField(e.target.value)}
                                                        placeholder="ELO..."
                                                        className="flex-grow p-2 bg-[#2a2a2a] rounded-l-md text-white focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={addSkillField}
                                                        className="bg-[#7458da] hover:bg-[#604BAC] text-white px-3 rounded-r-md transition-colors"
                                                        disabled={!newSkillField.trim()}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                {skillFields.length > 0 && (
                                                    <ul className="space-y-1">
                                                        {skillFields.map((field, index) => (
                                                            <li key={index} className="flex justify-between items-center bg-[#2a2a2a] p-2 rounded">
                                                                <span className="text-white">{field}</span>
                                                                <button
                                                                    onClick={() => removeSkillField(index)}
                                                                    className="text-red-400 hover:text-red-300"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div> */}
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-md font-medium mb-3 text-gray-300 flex items-center">
                                                <FontAwesomeIcon icon={faUserShield} className="text-[#7458da] mr-2" />
                                                General Settings
                                            </h3>
                                            <div className="space-y-1 bg-[#2a2a2a] p-3 rounded-lg">
                                                {generalRules.map(({ fullName, id, description }) => (
                                                    <Switch key={id} label={fullName} description={description} ruleKey={id} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <motion.button
                                                className="bg-[#2C2C2C] text-white px-4 py-3 rounded-lg hover:bg-[#3C3C3C] transition-colors font-medium"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setStep(1)}
                                            >
                                                Back
                                            </motion.button>
                                            <motion.button
                                                className="bg-gradient-to-r from-[#7458da] to-[#604BAC] text-white px-4 py-3 rounded-lg font-medium shadow-md shadow-[#7458da]/20"
                                                whileHover={{ scale: 1.02, shadow: "0px 8px 15px rgba(116, 88, 218, 0.4)" }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleCreateTournament}
                                                disabled={!tournamentName}
                                            >
                                                Create Tournament
                                            </motion.button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}