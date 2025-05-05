import { SkillField } from "@/components/modals/modalList";

export interface Tournament {
    start_time: string;
    end_time: string;
    join_code: string;
    created_at: string;
    id: string;
    name: string;
    description: string;
    allow_join: boolean;
    location: string;
    max_players: number | null;
    max_rounds: number | null;
    time: string;
    owner: string;
    status: string;
    skill_fields: SkillField[];
    min_score_to_win: number;
    tournament_type: string;
    rules: Rules;
}

export type Rules = Array<{
    type: string,
    value: any,
}>;
