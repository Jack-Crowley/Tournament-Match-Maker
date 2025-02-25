"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useMessage } from '@/context/messageContext';
import { useRouter } from 'next/navigation';
import { useClient } from '@/context/clientContext';
import { SpinningLoader } from '@/components/loading';
import { Tournament } from '@/types/tournamentTypes';

interface SkillField {
    name: string;
    value: string;
}

export default function JoinTournament() {
    const client = useClient()
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [name, setName] = useState<string>('');
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
                .from('tournaments')
                .select('*')
                .eq('join_code', joinCode)
                .single();

            if (error) {
                triggerMessage("Error fetching tournament data: " + error.message, "red");
                return;
            } 
            setTournament(data)

            if (data && data.skill_fields) {
                const initialSkillFields = data.skill_fields.map((skill: string) => ({
                    name: skill,
                    value: ''
                }));
                setSkillFields(initialSkillFields);
            }

            if (data && data.max_players) {
                setMaxNumber(data.max_players)
            }

            console.log(client.session?.user.id)

            if (client.session?.user.is_anonymous) {
                setAnonymous(true)
                setLoading(false)
                return;
            }

            const { data:userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', client.session?.user.id)
                .single();

            if (userData && userData.name) {
                setName(userData.name)
            }

            setLoading(false)
        };


        if (client == null || client.session == null) {
            return;
        }

        fetchData();
    }, [client, supabase]);

    const handleSkillChange = (index: number, value: string) => {
        const updatedSkillFields = [...skillFields];
        updatedSkillFields[index].value = value;
        setSkillFields(updatedSkillFields);
    };

    const handleSubmit = async (e: FormEvent) => {
        if (!tournament) {
            triggerMessage("Tournament not loaded", "red")
            return
        }

        e.preventDefault();
        setJoining(true);

        const skills = skillFields.reduce((acc, skill) => {
            acc[skill.name] = skill.value;
            return acc;
        }, {} as { [key: string]: string });

        const id = client.session?.user.id

        const {data:previousTournaments, error:tournamentPlayersError} = await supabase
            .from('tournament_players')
            .select('*')
            .eq("tournament_id", tournament.id)
            .eq("member_uuid", id)
        
        if (previousTournaments && previousTournaments.length > 0) {
            triggerMessage("You are already registered for this tournament", "green")
            router.push(`/tournament/${tournament.id}`);
            return;
        }

        const {data:allTournamentPlayers, error:allTournamentPlayersError} = await supabase
            .from('tournament_players')
            .select('*')
            .eq("tournament_id", tournament.id)
            .eq("type", "active")

        if (allTournamentPlayersError) {
            triggerMessage("Error loading tournament roster", "red")
            setLoading(false)
            return;
        }

        let type = "active"

        if (allTournamentPlayers && maxNumber) {
            if (allTournamentPlayers.length > maxNumber) {
                type = "waitlist"
            }
        }

        const update : any = {
            tournament_id: tournament.id,
            member_uuid: id,
            player_name: name,
            skills: skills,
            is_anonymous: anonymous,
            type:"waitlist"
        }

        const { error } = await supabase
            .from('tournament_players')
            .insert([
                update
            ])
            .select();

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
                    <h2 className="text-[#7458da] font-bold text-2xl mb-6 text-center">Join Tournament</h2>
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

                        {skillFields.map((skill, index) => (
                            <div key={index}>
                                <label className="text-white block text-sm mb-2">{skill.name}</label>
                                <input
                                    type="text"
                                    value={skill.value}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSkillChange(index, e.target.value)}
                                    placeholder={`Enter your ${skill.name}`}
                                    className="w-full p-3 bg-[#1E1E1E] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                                    required
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={joining}
                            className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                        >
                            {joining ? 'Joining...' : `Join Tournament ${anonymous ? "As Anonymous" : ""}`}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}