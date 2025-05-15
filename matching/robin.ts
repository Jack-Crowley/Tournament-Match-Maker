import { useMessage } from "@/context/messageContext";
import { BracketPlayer, Matchup, PlayerSkill } from "@/types/bracketTypes";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";

export const ConfigureRoundRobin = async (tournament: Tournament, refreshTournament: any, triggerMessage : any) => {
    const supabase = createClient();

    if (!tournament) return;

    const { data: tournamentPlayers, error: playerError } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq("type", "active");

    if (playerError) {
        triggerMessage("Error! You have no players in the database!!!", "red");
        return;
    }

    const formattedPlayers: BracketPlayer[] = tournamentPlayers.map(player => {
        const formattedSkills: PlayerSkill[] = [];

        if (Array.isArray(tournament.skill_fields)) {
            tournament.skill_fields.forEach(skill => {
                let skillValue: number = 0;

                if (Array.isArray(player.skills)) {
                    const playerSkill: PlayerSkill = player.skills.find((s: { name: string; }) => s.name === skill.name);
                    if (playerSkill) {
                        skillValue = playerSkill.value;
                    }

                }

                formattedSkills.push({ name: skill.name, type: skill.type, value: skillValue });
            });
        }

        return {
            uuid: player.member_uuid,
            name: player.player_name || "Unknown",
            email: player.email || "",
            account_type: player.is_anonymous ? "anonymous" : "logged_in",
            score: 0,
            skills: formattedSkills,
        };
    });


    function seedPlayers(playersToSeed: BracketPlayer[]) {
        return [...playersToSeed].sort((a, b) => {
            // go in order of the skills arra
            for (let i = 0; i < Math.min(a.skills?.length || 0, b.skills?.length || 0); i++) {
                // get their respective skill values
                const aSkillValue = a.skills?.[i].value || 0;
                const bSkillValue = b.skills?.[i].value || 0;

                // but if they're the same, lets move on to the next skill value to determine who's better
                if (aSkillValue !== bSkillValue) {
                    return bSkillValue - aSkillValue;
                }
            }
            return 0;
        });
    }

    function generateMatchups(players: BracketPlayer[]) {
        if (!tournament) return [];
    
        const seededPlayers = seedPlayers(players);
        const totalPlayers = seededPlayers.length;
    
        const hasBye = totalPlayers % 2 !== 0;
        const workingPlayers = [...seededPlayers];
        if (hasBye) {
            workingPlayers.push({
                uuid: "",
                name: "BYE",
                account_type: "placeholder",
                score: 0,
                email:"",
                skills: [],
            });
        }
    
        const numPlayers = workingPlayers.length;
        const numRounds = numPlayers - 1;
        const half = numPlayers / 2;
    
        const matchups: Matchup[] = [];
        let matchId = 1;
    
        const fixed = workingPlayers[0];
        const rotating = workingPlayers.slice(1);
    
        for (let round = 1; round <= numRounds; round++) {
            const roundPlayers = [fixed, ...rotating];
            for (let i = 0; i < half; i++) {
                const p1 = roundPlayers[i];
                const p2 = roundPlayers[numPlayers - 1 - i];
    
                if (!p1.uuid || !p2.uuid) continue;
    
                matchups.push({
                    match_number: matchId++,
                    round,
                    players: [p1, p2],
                    tournament_id: Number(tournament.id),
                    id: -1,
                    is_tie:false
                });
            }
    
            rotating.unshift(rotating.pop()!);
        }

        return matchups;
    }
    

    const saveMatchupsToDatabase = async (matchups: any[]) => {
        try {
            const { error } = await supabase
                .from("tournament_matches")
                .insert(matchups.map(match => ({
                    tournament_id: tournament.id,
                    round: match.round,
                    match_number: match.match_number,
                    players: match.players,
                })));

            if (error) {
                console.error("Error saving matchups:", error);
                triggerMessage("Error creating tournament brackets", "red");
            } else {
                triggerMessage("Tournament brackets created successfully", "green");
                refreshTournament();
            }
        } catch (error) {
            console.error("Exception saving matchups:", error);
            triggerMessage("Error creating tournament brackets", "red");
        }
    };

    const generatedMatchups = generateMatchups(formattedPlayers);
    saveMatchupsToDatabase(generatedMatchups);
};