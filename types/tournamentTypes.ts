export interface Tournament {
    start_time: string;
    end_time: string;
    id: string;
    name: string;
    description: string;
    allow_join: boolean;
    location: string;
    max_players: number | null;
    time: string;
    owner: string;
    skill_fields: string[];
    rules: string[];
}