import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from "@/utils/supabase/client";
import { useMessage } from '@/context/messageContext';
import { Tournament } from '@/types/tournamentTypes';
import { Player } from '@/types/playerTypes';
import { SkillField } from './modalList';

export const PlayerModal = ({ isOpen, onClose, playerForModal, tournament }: { playerForModal: Player, tournament: Tournament, isOpen: boolean; onClose: () => void }) => {
    const [player, setPlayer] = useState<Player | null>(null);
    const supabase = createClient()
    const { triggerMessage } = useMessage()

    useEffect(() => {
        const checkAndSetPlayer = async () => {
            if (!playerForModal) return;

            const { data: tournamentPlayer, error: tpError } = await supabase
                .from("tournament_players")
                .select("member_uuid")
                .eq("id", playerForModal.id)
                .single();

            if (tpError) {
                triggerMessage("Error fetching member_uuid: " + tpError.message, "green");
                return;
            }

            if (!tournamentPlayer?.member_uuid) return;

            const { data: user, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("uuid", tournamentPlayer.member_uuid)

            if (userError || user.length == 0) {
                setPlayer(playerForModal);
                return;
            }
        };

        checkAndSetPlayer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerForModal, supabase]);


    return (
        <AnimatePresence>
            {isOpen && player && (
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
                        <h2 className="text-xl font-bold mb-4 text-white">Player Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-white block text-sm mb-2">Player Name</label>
                                <input
                                    type="text"
                                    value={player.player_name}
                                    readOnly
                                    className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] cursor-not-allowed"
                                />
                            </div>
                            {player.email && (
                                <div>
                                    <label className="text-white block text-sm mb-2">Email</label>
                                    <input
                                        type="text"
                                        value={player.email}
                                        readOnly
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-white block text-sm mb-2">Anonymous</label>
                                <input
                                    type="text"
                                    value={player.is_anonymous ? 'Yes' : 'No'}
                                    readOnly
                                    className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] cursor-not-allowed"
                                />
                            </div>

                            {player.created_at && (
                                <div>
                                    <label className="text-white block text-sm mb-2">Created At</label>
                                    <input
                                        type="text"
                                        value={new Date(player.created_at).toLocaleString()}
                                        readOnly
                                        className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {tournament?.skill_fields?.some((skillField: SkillField) =>
                                player.skills?.some(skill => skill.name === skillField.name)
                            ) && (
                                    <div>
                                        <label className="text-white block text-sm mb-2">Skill Levels</label>
                                        <div className="space-y-2">
                                            {tournament?.skill_fields?.map((skillField: SkillField, index: number) => {
                                                const playerSkill = player.skills?.find(s => s.name === skillField.name);
                                                const playerValue = playerSkill?.type == "numeric" ? playerSkill.value : playerSkill?.category_type;
                                                return playerValue ? (
                                                    <div key={index}>
                                                        <input
                                                            type="text"
                                                            value={playerValue || ''}
                                                            readOnly
                                                            className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC] cursor-not-allowed"
                                                        />
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}

                        </div>

                        <div className="mt-8">
                            <button
                                onClick={onClose}
                                className="bg-gray-500 text-white px-4 py-2 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
