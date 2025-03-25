"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";
import { useRouter } from "next/navigation";
import { useClient } from "@/context/clientContext";
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { PlayerSkill } from "@/types/bracketTypes";

// Updated SkillField type
interface SkillField {
    name: string;
    type: "numeric" | "categorical";
    categories?: string[]; // Only for categorical skills
    value: string;
}

export default function JoinTournament() {
    const client = useClient();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [name, setName] = useState<string>("");
    const [skillFields, setSkillFields] = useState<SkillField[]>([]);
    const [anonymous, setAnonymous] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [joining, setJoining] = useState<boolean>(false);
    const [maxNumber, setMaxNumber] = useState<number | null>(null);
    const supabase = createClient();
    const { triggerMessage } = useMessage();
    const router = useRouter();

    const params = useParams();
    const joinCode = params.joinCode as string;

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from("tournaments")
                .select("*")
                .eq("join_code", joinCode)
                .single();

            if (error) {
                triggerMessage("Error fetching tournament data: " + error.message, "red");
                return;
            }

            setTournament(data);

            if (data && data.skill_fields) {
                const initialSkillFields: SkillField[] = data.skill_fields.map((skill: any) => ({
                    name: skill.name,
                    type: skill.type,
                    categories: skill.categories || [],
                    value: "",
                }));
                setSkillFields(initialSkillFields);
            }

            if (data && data.max_players) {
                setMaxNumber(data.max_players);
            }

            if (client.session?.user.is_anonymous) {
                setAnonymous(true);
                setLoading(false);
                return;
            }

            const { data: userData } = await supabase
                .from("users")
                .select("name")
                .eq("uuid", client.session?.user.id)
                .single();

            if (userData && userData.name) {
                setName(userData.name);
            }

            setLoading(false);
        };

        if (client == null || client.session == null) {
            return;
        }

        fetchData();
    }, [client, supabase, joinCode]);

    const handleSkillChange = (index: number, value: string) => {
        const updatedSkillFields = [...skillFields];
        updatedSkillFields[index].value = value;
        setSkillFields(updatedSkillFields);
    };

    const handleSubmit = async (e: FormEvent) => {
        if (!tournament) {
            triggerMessage("Tournament not loaded", "red");
            return;
        }

        e.preventDefault();
        setJoining(true);

        const skills: PlayerSkill[] = skillFields.map(skill => {
            let skillValue = 0;
            let categoryType: string | undefined = undefined;
    
            if (skill.type === "numeric") {
                // Convert numeric value
                skillValue = Number(skill.value) || 0;
            } else if (skill.type === "categorical" && skill.categories) {
                // Find the index of the selected category
                const categoryIndex = skill.categories.indexOf(skill.value);
                skillValue = categoryIndex !== -1 ? categoryIndex : 0; // Default to 0 if not found
                categoryType = skill.value; // Store original category name
            }
    
            return {
                name: skill.name,
                type: skill.type,
                value: skillValue,
                category_type: categoryType, // Only for categorical skills
            };
        });

        const id = client.session?.user.id;

        const { data: previousTournaments } = await supabase
            .from("tournament_players")
            .select("*")
            .eq("tournament_id", tournament.id)
            .eq("member_uuid", id);

        if (previousTournaments && previousTournaments.length > 0) {
            triggerMessage("You are already registered for this tournament", "green");
            router.push(`/tournament/${tournament.id}`);
            return;
        }

        const { data: allTournamentPlayers, error: allTournamentPlayersError } = await supabase
            .from("tournament_players")
            .select("*")
            .eq("tournament_id", tournament.id)
            .eq("type", "active");

        if (allTournamentPlayersError) {
            triggerMessage("Error loading tournament roster", "red");
            setLoading(false);
            return;
        }

        let type = "active";

        if (allTournamentPlayers && maxNumber) {
            if (allTournamentPlayers.length > maxNumber) {
                type = "waitlist";
            }
        }

        if (tournament.status === "completed") {
            triggerMessage("This tournament has already completed", "red");
            setLoading(false);
            return;
        } else if (tournament.status === "started") {
            type = "waitlist";
            triggerMessage("This tournament has already started, you will be added to the waitlist", "yellow");
        }

        const update: any = {
            tournament_id: tournament.id,
            member_uuid: id,
            player_name: name,
            skills: skills,
            is_anonymous: anonymous,
            type,
        };

        const { error } = await supabase.from("tournament_players").insert([update]);

        if (error) {
            triggerMessage("Error joining tournament: " + error.message, "red");
        } else {
            triggerMessage("Successfully joined the tournament!", "green");
            router.push(`/tournament/${tournament.id}`);
        }

        setJoining(false);
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-6">
            {loading ? (
                <SpinningLoader />
            ) : (
                <div className="bg-[#2d2158] p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-[#7458da] font-bold text-2xl mb-6 text-center">Enter your name to join</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-white block text-sm mb-2">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full p-3 bg-[#1E1E1E] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                required
                                readOnly={!anonymous}
                            />
                        </div>

                        {skillFields.length > 0 &&
                            skillFields.map((skill, index) => (
                                <div key={index}>
                                    <label className="text-white block text-sm mb-2">{skill.name}</label>
                                    {skill.type === "numeric" ? (
                                        <input
                                            type="number"
                                            value={skill.value}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSkillChange(index, e.target.value)}
                                            className="w-full p-3 bg-[#1E1E1E] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                            required
                                        />
                                    ) : (
                                        <select
                                            value={skill.value}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSkillChange(index, e.target.value)}
                                            className="w-full p-3 bg-[#1E1E1E] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                            required
                                        >
                                            <option value="">Select {skill.name}</option>
                                            {skill.categories?.map((category, i) => (
                                                <option key={i} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))
                        }


                        <button type="submit" disabled={joining} className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors">
                            {joining ? "Joining..." : `Join Tournament ${anonymous ? "As Anonymous" : ""}`}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
