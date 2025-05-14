import { BracketPlayer, Matchup, PlayerSkill } from "@/types/bracketTypes";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";

// sorting_algo: "ranked" | "random" | "seeded"
// sorting_value: number (used only for "seeded")
export const ConfigureSwissStyleTournament = async (
    tournament: Tournament,
    refreshTournament: any,
    triggerMessage: any,
    sorting_algo: "ranked" | "random" | "seeded" = "ranked",
    sorting_value: number = 2
) => {
    const supabase = createClient();

    if (!tournament) return;

    const { data: tournamentPlayers, error: playerError } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq("type", "active");

    if (playerError || !tournamentPlayers?.length) {
        triggerMessage("Error! You have no players in the database!!!", "red");
        return;
    }

    const formattedPlayers: BracketPlayer[] = tournamentPlayers.map(player => {
        const formattedSkills: PlayerSkill[] = [];

        if (Array.isArray(tournament.skill_fields)) {
            tournament.skill_fields.forEach(skill => {
                let skillValue: number = 0;

                if (Array.isArray(player.skills)) {
                    const playerSkill = player.skills.find((s: { name: string }) => s.name === skill.name);
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

    const seedPlayers = (players: BracketPlayer[]) => {
        return [...players].sort((a : any, b : any) => {
            for (let i = 0; i < Math.min(a.skills?.length || 0, b.skills?.length || 0); i++) {
                const aVal = a.skills[i]?.value || 0;
                const bVal = b.skills[i]?.value || 0;
                if (aVal !== bVal) return bVal - aVal;
            }
            return 0;
        });
    };

    const shuffleArray = <T>(arr: T[]): T[] => {
        return [...arr].sort(() => Math.random() - 0.5);
    };

    const sortPlayers = (players: BracketPlayer[]): BracketPlayer[] => {
        if (sorting_algo === "random") {
            return shuffleArray(players);
        } else if (sorting_algo === "seeded") {
            const sorted = seedPlayers(players);
            const grouped: BracketPlayer[] = [];

            for (let i = 0; i < sorted.length; i += sorting_value) {
                const group = sorted.slice(i, i + sorting_value);
                grouped.push(...shuffleArray(group));
            }

            return grouped;
        } else {
            // "ranked"
            return seedPlayers(players);
        }
    };

    const generateMatchups = (players: BracketPlayer[]): Matchup[] => {
        const sortedPlayers = sortPlayers(players);
        const matchups: Matchup[] = [];
        const totalPlayers = sortedPlayers.length;

        for (let i = 0; i < totalPlayers; i += 2) {
            const player1 = sortedPlayers[i];
            const player2 = sortedPlayers[i + 1] || {
                uuid: "",
                name: "BYE",
                account_type: "placeholder",
                placeholder_player: true,
                email: "",
                score: 0,
                skills: [],
            };

            matchups.push({
                match_number: i / 2 + 1,
                round: 1,
                players: [player1, player2],
                tournament_id: Number(tournament.id),
                id: -1,
                is_tie:false,
            });
        }

        return matchups;
    };

    const saveMatchupsToDatabase = async (matchups: Matchup[]) => {
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
