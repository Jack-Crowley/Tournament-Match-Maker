"use client"

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useMessage } from '@/context/messageContext';
import { button } from "framer-motion/client";
import { useClient } from "@/context/clientContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { SpinningLoader } from "@/components/loading";


interface Button {
    id: string;
    label: string;
}

interface Rules {
    [key: string]: boolean;
}

const generalRules: { fullName: string, id: string }[] = [
    { fullName: "Require Accounts", id: "accounts" },
    { fullName: "Team Tournament", id: "team" },
]

const buttons: Button[] = [
    { id: "single", label: "Single Elimination" },
    { id: "double", label: "Double Elimination" },
    { id: "round", label: "Round Robin" },
    { id: "swiss", label: "Swiss System" },
];

const tournamentRules: { [key: string]: { label: string, key: string }[] } = {
    "single": [
        { label: "Custom Rule A", key: "custom-rule-1" },
        { label: "Custom Rule B", key: "custom-rule-2" },
    ],
    "double": [
        { label: "Custom Rule C", key: "custom-rule-3" },
        { label: "Custom Rule D", key: "custom-rule-4" },
    ],
    "round": [
        { label: "Custom Rule E", key: "custom-rule-5" },
        { label: "Custom Rule F", key: "custom-rule-6" },
    ],
    "swiss": [
        { label: "Custom Rule G", key: "custom-rule-7" },
        { label: "Custom Rule H", key: "custom-rule-8" },
    ]
};

export default function Home() {
    const client = useClient()
    const supabase = createClient()
    const [loading, setLoading] = useState<boolean>(true);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedButton, setSelectedButton] = useState<string | null>(null);
    const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState<string>('');
    const [tournamentDescription, setTournamentDescription] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [rules, setRules] = useState<Rules>({});
    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();
    const router = useRouter();

    useEffect(() => {
        const startRules = {}

        generalRules.forEach(async (rule) => {
            (startRules as any)[rule.id] = false;
        })

        setRules(startRules)

        async function loadTournamentData() {
            const id = client.session?.user.id;

            if (id == undefined) {
                setLoading(false)
                return;
            };

            console.log(id)

            const { data, error } = await supabase
                .from('tournament_players')
                .select('tournament_id')
                .eq('member_uuid', id);

            console.log(data)

            if (error) {
                triggerMessage("Error fetching player data: " + error.message, "red");
            } else {
                const tournamentIds = data.map(record => record.tournament_id);

                const tournamentDetails = [];

                for (const tournamentId of tournamentIds) {
                    const { data: tournament, error: fetchError } = await supabase
                        .from('tournaments')
                        .select('*')
                        .eq('id', tournamentId)
                        .single();

                    console.log(tournament)

                    if (fetchError) {
                        console.error("Error fetching tournament with id:", tournamentId, fetchError);
                    } else if (tournament) {
                        tournamentDetails.push(tournament);
                    }
                }

                console.log(tournamentDetails)

                setTournaments(tournamentDetails)
            }

            setLoading(false)

        }
        loadTournamentData()
    }, [client, supabase, triggerMessage])


    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isModalOpen]);

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

    const Switch = ({ label, ruleKey }: { label: string, ruleKey: string }) => {
        const [isOn, setIsOn] = useState<boolean>(rules[ruleKey] || false);

        const handleSwitchChange = () => {
            setIsOn(!isOn);
            const newRules = rules;
            (newRules as any)[ruleKey] = !isOn;

            setTimeout(() => {
                setRules(newRules);
            }, 500)
        };

        return (
            <div className="flex items-center justify-between cursor-pointer">
                <span className="text-white">{label}</span>
                <motion.div
                    className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer ${isOn ? "justify-end" : "justify-start"}`}
                    onClick={() => { handleSwitchChange() }}
                    initial={false}
                    animate={{
                        background: isOn
                            ? "linear-gradient(45deg, #7458da, #cec5eb)"
                            : "linear-gradient(45deg, #3A3A3A, #5C5C5C)",
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="w-4 h-4 bg-white rounded-full"
                        layout
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    />
                </motion.div>
            </div>
        );
    };




    const handleCreateTournament = async () => {
        if (!tournamentName || !button) {
            triggerMessage('Please select a tournament type and provide a name.', 'red');
            return;
        }

        const tournamentData = {
            "tournament-type": selectedType,
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
            ...((tournamentData as any).team !== null && { team_tournament: (tournamentData as any).team }),
            ...((tournamentData as any).account !== null && { require_account: (tournamentData as any).account })
        }

        const { data, error } = await supabase
            .from('tournaments')
            .insert(InsertData)
            .select();

        if (error) {
            triggerMessage("Error inserting tournament data: " + error.message, "red");
        } else {
            setTournamentName('');
            setTournamentDescription('');
            setSelectedType(null);
            const startRules = {}

            generalRules.forEach(async (rule) => {
                (startRules as any)[rule.id] = false;
            })

            setRules(startRules)
            setIsModalOpen(false);
            triggerMessage("Tournament successfully inserted, starting redirect!", "green");


            setTimeout(() => {
                router.push(`/tournament/${(data![0] as any).id}`);
            }, 1200)
        }


    };

    return (
        <div className="relative min-h-screen">
            {loading ? (
                <SpinningLoader />
            ) : (
                <div>
                    {tournaments.length == 0 ? (
                        <div>
                            <h1 className="2xl text-center text-white">No Registered Tournaments</h1>

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


                    ) : (
                        <div>
                            <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-20">Ongoing Tournaments</h1>
                            {tournaments.map((tournament) => (
                                <div key={tournament.id} className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                                    <div className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
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
                                </div>
                            ))}


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

                    {isModalOpen && (
                        <AnimatePresence>
                            {isModalOpen && (
                                <motion.div
                                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        ref={modalRef}
                                        className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                    >
                                        <h2 className="text-xl font-bold mb-4 text-white">Create New Tournament</h2>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {buttons.map((button) => (
                                                <motion.button
                                                    key={button.id}
                                                    className={`p-4 rounded-lg text-white text-center ${selectedButton === button.id
                                                        ? "border-2 border-[#7458da]"
                                                        : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedButton(button.id)}
                                                >
                                                    {button.label}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="mt-10">
                                            <label className="text-white block text-sm mb-2">Tournament Name</label>
                                            <input
                                                type="text"
                                                value={tournamentName}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setTournamentName(e.target.value)}
                                                placeholder="Enter tournament name"
                                                className="w-full mt-0 p-3 bg-[#2a2a2a] m-0 border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                            />
                                        </div>

                                        <div className="space-y-4 mt-10">
                                            {generalRules.map(({ fullName, id }) => (
                                                <Switch key={id} label={fullName} ruleKey={id} />
                                            ))}
                                        </div>

                                        {selectedButton && (
                                            <div className="mt-10">
                                                <div
                                                    className={`p-4 rounded-lg text-white cursor-pointer hover:bg-[#3C3C3C] border-b-2 border-[#7458da] ${selectedDropdown === "Dropdown 1" ? "bg-[#2E2E2E]" : "bg-[#3A3A3A]"}`}
                                                    onClick={() => setSelectedDropdown(selectedDropdown === "Dropdown 1" ? null : "Dropdown 1")}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>Custom Rules</span>
                                                        <FontAwesomeIcon
                                                            icon={selectedDropdown === "Dropdown 1" ? faChevronUp : faChevronDown}
                                                            className="text-white"
                                                        />
                                                    </div>
                                                </div>
                                                {selectedDropdown === "Dropdown 1" && (
                                                    <motion.div
                                                        className="space-y-2 mt-2"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    >
                                                        {tournamentRules[selectedButton].map(({ label, key }) => (
                                                            <Switch key={key} label={label} ruleKey={key} />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">

                                            <div className="mt-10">
                                                <label className="text-white block text-sm mb-2">Tournament Description</label>
                                                <textarea
                                                    value={tournamentDescription}
                                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTournamentDescription(e.target.value)}
                                                    placeholder="Enter tournament description"
                                                    className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <button
                                                className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                                                onClick={handleCreateTournament}
                                            >
                                                Create Tournament
                                            </button>
                                            <button
                                                className="w-full bg-[#2C2C2C] text-white px-4 py-2 rounded-lg hover:bg-[#3C3C3C] transition-colors"
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                </div>
            )}


        </div>
    );
}
