"use client"

import Image from "next/legacy/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faChevronDown, faChevronUp, faCopy, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useMessage } from '@/context/messageContext';
import { useClient } from "@/context/clientContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import QRCode from "react-qr-code";
import { use } from 'react';
import { useParams } from 'next/navigation';
import { div, span } from "framer-motion/client";

interface Player {
    id: string;
    name: string;
    skills: { [key: string]: string };
}

interface Tournament {
    start_time: string;
    end_time: string;
    id: string;
    name: string;
    description: string;
    allow_join: boolean;
    location: string;
    max_players: number | null;
    time: string;
    skill_fields: string[];
}

export default function Initialization() {
    const client = useClient()
    const supabase = createClient()
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [joinLink, setJoinLink] = useState<null | string>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isTournamentNameModelOpen, setIsTournamentNameModelOpen] = useState<boolean>(false);
    const [isDescriptionModelOpen, setIsDescriptionModelOpen] = useState<boolean>(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState<boolean>(false);
    const [isMaxPlayersModalOpen, setIsMaxPlayersModalOpen] = useState<boolean>(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
    const [allowPlayers, setAllowPlayers] = useState<boolean>();

    const modalRef = useRef<HTMLDivElement>(null);
    const { triggerMessage } = useMessage();
    const router = useRouter();

    const paramsPromise = useParams();
    const id = paramsPromise.id

    useEffect(() => {
        const fetchTournament = async () => {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                triggerMessage("Error fetching tournament data: " + error.message, "red");
            } else {
                setTournament(data);
                setJoinLink(window.location.href + "?join=" + data.join_code)
                setAllowPlayers(data.allow_join)
            }
        };

        const fetchPlayers = async () => {
            const { data, error } = await supabase
                .from('tournament_players')
                .select('*')
                .eq('tournament_id', id);

            if (error) {
                triggerMessage("Error fetching players data: " + error.message, "red");
            } else {
                setPlayers(data);
            }
        };

        fetchTournament();
        fetchPlayers();
    }, [id]);

    const handleAllowJoinToggle = async () => {
        if (!tournament) return;

        const { error } = await supabase
            .from('tournaments')
            .update({ allow_join: !tournament.allow_join })
            .eq('id', id);

        if (error) {
            triggerMessage("Error updating tournament: " + error.message, "red");
        } else {
            setTournament({ ...tournament, allow_join: !tournament.allow_join });
            setTimeout(() => {
                setAllowPlayers(tournament.allow_join)
            }, 500)
        }
    };

    const handleCopyUrl = () => {
        if (joinLink == null) return;

        navigator.clipboard.writeText(joinLink);
        triggerMessage("URL copied to clipboard!", "green");
    };

    const Modal = ({ isOpen, onClose, columnName, type, displayName, textareas = false }: { displayName: string; isOpen: boolean; onClose: () => void; columnName: string; type: string; textareas?: boolean; }) => {
        const [columnNameChange, setColumnNameChange] = useState<string>();
        const [startTimeNameChange, setStartTimeChange] = useState<string>();
        const [endTimeChange, setEndTimeChange] = useState<string>();
        const [arrayItems, setArrayItems] = useState<string[]>([]);
        const [newItem, setNewItem] = useState<string>('');

        useEffect(() => {
            if (type === "time" && tournament) {
                const startTime = new Date(tournament["start_time"]);
                const endTime = new Date(tournament["end_time"]);

                setStartTimeChange(startTime.toISOString().slice(0, 16));
                setEndTimeChange(endTime.toISOString().slice(0, 16));
            } else if (tournament && type === "array") {
                setArrayItems((tournament as any)[columnName] || []);
            } else if (tournament) {
                setColumnNameChange((tournament as any)[columnName]);
            }
        }, [tournament, type, columnName]);

        const handleSave = async () => {
            if (!tournament) return;

            let update: any = {};

            if (type === 'string' || type === 'number') {
                update[columnName] = columnNameChange;
            } else if (type === 'time') {
                const startDate = new Date(startTimeNameChange!);
                const endDate = new Date(endTimeChange!);

                const utcStartTime = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
                const utcEndTime = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();

                update["start_time"] = utcStartTime;
                update["end_time"] = utcEndTime;
            } else if (type === 'array') {
                update[columnName] = arrayItems;
            }

            const { data, error } = await supabase
                .from('tournaments')
                .update(update)
                .eq('id', id)
                .select();

            if (error) {
                triggerMessage('Error updating tournament: ' + error.message, 'red');
            } else {
                onClose();
                setTournament(data[0]);
                triggerMessage(`${displayName} updated successfully!`, 'green');
            }
        };

        const handleAddItem = () => {
            if (newItem.trim() === '') return;
            setArrayItems([...arrayItems, newItem]);
            setNewItem('');
        };

        const handleEditItem = (index: number, newValue: string) => {
            const updatedItems = [...arrayItems];
            updatedItems[index] = newValue;
            setArrayItems(updatedItems);
        };

        const handleDeleteItem = (index: number) => {
            const updatedItems = arrayItems.filter((_, i) => i !== index);
            setArrayItems(updatedItems);
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
                            className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-4 text-white">
                                {(tournament as any)[columnName] == undefined ? 'Add' : 'Edit'}{' '}
                                {displayName}
                            </h2>
                            <div className="space-y-4">
                                {type === "time" && (
                                    <div>
                                        <div className="mb-4">
                                            <label className="text-white block text-sm mb-2">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={startTimeNameChange}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTimeChange(e.target.value)}
                                                placeholder={`Enter Start Time`}
                                                className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white block text-sm mb-2">End Time</label>
                                            <input
                                                type="datetime-local"
                                                value={endTimeChange}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTimeChange(e.target.value)}
                                                placeholder={`Enter End Time`}
                                                className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(type === "string" || type === "number") && (
                                    <div>
                                        <label className="text-white block text-sm mb-2">{displayName}</label>
                                        <input
                                            type={{ string: 'text', number: 'number' }[type]}
                                            value={columnNameChange}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setColumnNameChange(e.target.value)}
                                            placeholder={`Enter ${displayName}`}
                                            className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                        />
                                    </div>
                                )}

                                {type === "array" && (
                                    <div>
                                        <label className="text-white block text-sm mb-2">{displayName}</label>
                                        <div className="space-y-4">
                                            {arrayItems.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-4">
                                                    {textareas ? (
                                                        <textarea
                                                            rows={2}
                                                            value={item}
                                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleEditItem(index, e.target.value)}
                                                            className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleEditItem(index, e.target.value)}
                                                            className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteItem(index)}
                                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center space-x-8">
                                                {textareas ? (
                                                    <textarea
                                                        rows={2}
                                                        value={newItem}
                                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewItem(e.target.value)}
                                                        placeholder={`Add new ${displayName}`}
                                                        className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newItem}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem(e.target.value)}
                                                        placeholder={`Add new ${displayName}`}
                                                        className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                                    />
                                                )}
                                                <button
                                                    onClick={handleAddItem}
                                                    className="bg-green-500 text-white px-2 py-1 rounded"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 space-x-4">
                                <button onClick={handleSave} className="bg-[#604BAC] text-white px-4 py-2 rounded">Save</button>
                                <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };


    const Button = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
        <button
            className="bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
            onClick={onClick}
        >
            {children}
        </button>
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                // Close the currently open modal
                if (isTournamentNameModelOpen) setIsTournamentNameModelOpen(false);
                if (isDescriptionModelOpen) setIsDescriptionModelOpen(false);
                if (isLocationModalOpen) setIsLocationModalOpen(false);
                if (isTimeModalOpen) setIsTimeModalOpen(false);
                if (isMaxPlayersModalOpen) setIsMaxPlayersModalOpen(false);
                if (isSkillModalOpen) setIsSkillModalOpen(false);
                if (isRulesModalOpen) setIsRulesModalOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isTournamentNameModelOpen, isDescriptionModelOpen, isLocationModalOpen, isTimeModalOpen, isMaxPlayersModalOpen, isSkillModalOpen, isRulesModalOpen]);

    return (
        <div className="relative min-h-screen p-6">
            {tournament && (
                <div>
                    <h1 className="text-[#7458da] mt-8 font-bold text-3xl mb-6 text-center">{tournament?.name}</h1>

                    {tournament.description && (
                        <div className="mb-1">
                            {tournament.description}
                        </div>
                    )}

                    {tournament.location && (
                        <div className="mb-1">
                            Location: {tournament.location}
                        </div>
                    )}

                    {tournament.start_time && (
                        <div className="mb-1">
                            <strong>Start Time:</strong> {new Date(tournament.start_time).toLocaleString('en-US', { timeZone: 'UTC' })}
                        </div>
                    )}

                    {tournament.end_time && (
                        <div className="mb-1">
                            <strong>End Time:</strong> {new Date(tournament.end_time).toLocaleString('en-US', { timeZone: 'UTC' })}
                        </div>
                    )}

                    <div className="flex space-x-4 mt-4">
                        <Button onClick={() => setIsTournamentNameModelOpen(true)}>{(tournament as any)["name"] == undefined ? "Add" : "Edit"} Tournament Name</Button>
                        <Button onClick={() => setIsDescriptionModelOpen(true)}>{(tournament as any)["description"] == undefined ? "Add" : "Edit"} Description</Button>
                        <Button onClick={() => setIsLocationModalOpen(true)}>{(tournament as any)["location"] == undefined ? "Add" : "Edit"} Location</Button>
                        <Button onClick={() => setIsTimeModalOpen(true)}>{(tournament as any)["start_time"] == undefined ? "Add" : "Edit"} Time</Button>
                    </div>

                    <h1 className="text-[#7458da] mt-16 font-bold text-2xl mb-2">Player Joining</h1>

                    {tournament.max_players && (
                        <div className="mb-1">
                            Maximum Players: {tournament.max_players}
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="flex items-center">
                            <span className="text-white mr-2">Allow People to Join</span>
                            <motion.div
                                className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer ${tournament?.allow_join ? "justify-end" : "justify-start"}`}
                                onClick={handleAllowJoinToggle}
                                initial={false}
                                animate={{
                                    background: tournament?.allow_join
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
                    </div>

                    {joinLink && tournament.allow_join && (
                        <div className="mb-6">
                            <label className="text-white block text-sm mb-2">Join Code/URL</label>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={joinLink}
                                    readOnly
                                    className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                />
                                <Button onClick={handleCopyUrl}>
                                    <FontAwesomeIcon icon={faCopy} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {joinLink && tournament.allow_join && (
                        <div className="mb-6">
                            <label className="text-white block text-sm mb-2">QR Code</label>
                            <div className="p-4 bg-[#a968b942] rounded-lg w-fit">
                                <QRCode value={joinLink} size={128} />
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-4">
                        <Button onClick={() => setIsMaxPlayersModalOpen(true)}>{(tournament as any)["max_players"] == undefined ? "Add" : "Edit"} Maximum Players</Button>
                        <Button onClick={() => setIsSkillModalOpen(true)}>{(tournament as any)["skill_levels"] == undefined ? "Add" : "Edit"} Skill Levels</Button>
                        <Button onClick={() => setIsRulesModalOpen(true)}>{(tournament as any)["rules"] == undefined ? "Add" : "Edit"} Rule set</Button>
                    </div>


                    {players.length > 0 && (


                        <div className="mb-6 mt-16">
                            <h2 className="text-[#604BAC] font-bold text-2xl mb-4">Registered Players</h2>
                            <table className="w-full text-white bg-[#160A3A] rounded-lg shadow-lg">
                                <thead className="bg-[#4F33B3]">
                                    <tr>
                                        <th className="p-3 text-left">Name</th>
                                        {tournament?.skill_fields.map((skill, index) => (
                                            <th key={index} className="p-3 text-left">{skill}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player) => (
                                        <tr key={player.id} className="hover:bg-[#4F33B3]">
                                            <td className="p-3">{player.name}</td>
                                            {tournament?.skill_fields.map((skill, index) => (
                                                <td key={index} className="p-3">{player.skills[skill]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {players.length == 0 && (
                        <h2 className="text-[#604BAC] font-bold text-2xl mb-4 mt-12">No Registered Players</h2>
                    )}




                    <Modal isOpen={isTournamentNameModelOpen} columnName="name" displayName="Tournament Name" type="string" onClose={() => setIsTournamentNameModelOpen(false)} />
                    <Modal isOpen={isDescriptionModelOpen} columnName="description" displayName="Description" type="string" onClose={() => setIsDescriptionModelOpen(false)} />
                    <Modal isOpen={isLocationModalOpen} columnName="location" displayName="Location" type="string" onClose={() => setIsLocationModalOpen(false)} />
                    <Modal isOpen={isTimeModalOpen} columnName="start_time" displayName="Time" type="time" onClose={() => setIsTimeModalOpen(false)} />
                    <Modal isOpen={isMaxPlayersModalOpen} columnName="max_players" displayName="Maximum Players" type="number" onClose={() => setIsMaxPlayersModalOpen(false)} />
                    <Modal isOpen={isSkillModalOpen} columnName="skill_fields" displayName="Skill Levels" type="array" onClose={() => setIsSkillModalOpen(false)} />
                    <Modal isOpen={isRulesModalOpen} textareas={true} columnName="rules" displayName="Rule set" type="array" onClose={() => setIsRulesModalOpen(false)} />
                </div>
            )}

        </div>
    );
}