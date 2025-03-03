import { useClient } from '@/context/clientContext';
import { useMessage } from '@/context/messageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faTrophy, faUserShield } from '@fortawesome/free-solid-svg-icons';

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
    { fullName: "Team Tournament", id: "team", description: "Allow teams instead of individual players" },
]

const buttons: Button[] = [
    { id: "single", label: "Single Elimination", description: "Knockout format with one chance per participant" },
    { id: "double", label: "Double Elimination", description: "Two chances before elimination" },
    { id: "round", label: "Round Robin", description: "Everyone plays against everyone" },
    { id: "swiss", label: "Swiss System", description: "Players with similar scores face each other" },
];

const tournamentRules: { [key: string]: { label: string, key: string, description: string }[] } = {
    "single": [
        { label: "Third Place Match", key: "custom-rule-1", description: "Add a match to determine third place" },
        { label: "Seeded Brackets", key: "custom-rule-2", description: "Arrange brackets based on player rankings" },
    ],
    "double": [
        { label: "Modified Brackets", key: "custom-rule-3", description: "Use modified double elimination brackets" },
        { label: "Grand Finals Reset", key: "custom-rule-4", description: "Winner's bracket finalist must be beaten twice" },
    ],
    "round": [
        { label: "Points System", key: "custom-rule-5", description: "Customize points for wins, draws, and losses" },
        { label: "Tiebreakers", key: "custom-rule-6", description: "Set rules for breaking ties in standings" },
    ],
    "swiss": [
        { label: "Buchholz System", key: "custom-rule-7", description: "Use sum of opponents' scores for tiebreaks" },
        { label: "Fixed Rounds", key: "custom-rule-8", description: "Set a specific number of rounds regardless of participants" },
    ]
};

export const CreateTournament = ({ isModalOpen, setIsModalOpen, ref }: { isModalOpen: boolean, ref: any, setIsModalOpen: (state: boolean) => void }) => {
    const [rules, setRules] = useState<Rules>({});
    const [selectedButton, setSelectedButton] = useState<string | null>(null);
    const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState<string>('');
    const [tournamentDescription, setTournamentDescription] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const { triggerMessage } = useMessage()
    const client = useClient()
    const supabase = createClient()
    const router = useRouter()

    const handleCreateTournament = async () => {
        if (!tournamentName || !selectedButton) {
            triggerMessage('Please select a tournament type and provide a name.', 'red');
            return;
        }

        const tournamentData = {
            "tournament-type": selectedType || selectedButton,
            "tournament-name": tournamentName,
            "tournament-description": tournamentDescription,
            "custom-rules": Object.keys(rules).reduce((acc: any, key) => {
                if (key.startsWith('custom-rule')) {
                    acc[key] = rules[key];
                }
                return acc;
            }, {}),
        };

        generalRules.forEach((elm) => {
            (tournamentData as any)[elm.id] = rules[elm.id]
        })

        const InsertData = {
            name: tournamentData["tournament-name"],
            description: tournamentData["tournament-description"],
            owner: client.session?.user.id,
            custom_rules: tournamentData["custom-rules"],
            status: 'initialization',
            tournament_type: tournamentData["tournament-type"],
            ...((tournamentData as any).team !== null && { team_tournament: (tournamentData as any).team }),
            ...((tournamentData as any).accounts !== null && { require_account: (tournamentData as any).accounts })
        }

        const { data, error } = await supabase
            .from('tournaments')
            .insert(InsertData)
            .select();

        if (error) {
            triggerMessage("Error creating tournament: " + error.message, "red");
        } else {
            setTournamentName('');
            setTournamentDescription('');
            setSelectedButton(null);
            setSelectedType(null);
            
            const startRules = {}
            generalRules.forEach((rule) => {
                (startRules as any)[rule.id] = false;
            })
            setRules(startRules)
            
            setIsModalOpen(false);
            triggerMessage("Tournament created successfully! Redirecting...", "green");

            setTimeout(() => {
                router.push(`/tournament/${(data![0] as any).id}`);
            }, 1200)
        }
    };

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
        setSelectedType(id);
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
                                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                                    <FontAwesomeIcon icon={faTrophy} className="text-[#7458da] mr-3" />
                                    Create New Tournament
                                </h2>

                                <div className="mb-6">
                                    <h3 className="text-md font-medium mb-3 text-gray-300">Tournament Type</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {buttons.map((button) => (
                                            <motion.button
                                                key={button.id}
                                                className={`p-4 rounded-lg text-white text-center flex flex-col items-center justify-center ${
                                                    selectedButton === button.id
                                                        ? "bg-gradient-to-br from-[#7458da] to-[#604BAC] shadow-lg shadow-[#7458da]/20"
                                                        : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                                                }`}
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleButtonSelect(button.id)}
                                            >
                                                <span className="font-medium mb-1">{button.label}</span>
                                                <span className="text-xs text-gray-300 mt-1 overflow-hidden text-ellipsis">
                                                    {button.description}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
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

                                {selectedButton && (
                                    <div className="mt-6">
                                        <h3 className="text-md font-medium mb-3 text-gray-300">Format-Specific Options</h3>
                                        <div
                                            className={`p-4 rounded-lg text-white cursor-pointer hover:bg-[#3C3C3C] bg-[#2a2a2a] transition-colors ${
                                                selectedDropdown === "customRules" ? "border-l-4 border-[#7458da]" : ""
                                            }`}
                                            onClick={() => setSelectedDropdown(selectedDropdown === "customRules" ? null : "customRules")}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Custom Rules</span>
                                                <FontAwesomeIcon
                                                    icon={selectedDropdown === "customRules" ? faChevronUp : faChevronDown}
                                                    className="text-[#7458da]"
                                                />
                                            </div>
                                        </div>
                                        {selectedDropdown === "customRules" && (
                                            <motion.div
                                                className="space-y-1 mt-2 bg-[#2a2a2a] p-3 rounded-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            >
                                                {tournamentRules[selectedButton].map(({ label, key, description }) => (
                                                    <Switch key={key} label={label} description={description} ruleKey={key} />
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <motion.button
                                        className="bg-[#2C2C2C] text-white px-4 py-3 rounded-lg hover:bg-[#3C3C3C] transition-colors font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        className="bg-gradient-to-r from-[#7458da] to-[#604BAC] text-white px-4 py-3 rounded-lg font-medium shadow-md shadow-[#7458da]/20"
                                        whileHover={{ scale: 1.02, shadow: "0px 8px 15px rgba(116, 88, 218, 0.4)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCreateTournament}
                                    >
                                        Create Tournament
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}