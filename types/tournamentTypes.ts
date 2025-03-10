export interface Tournament {
    start_time: string;
    end_time: string;
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
    skill_fields: string[];
    rules: string[];
}