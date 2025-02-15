export interface Player {
    id: string;
    player_name: string;
    member_id?: string;
    email?: string;
    anonymous?: boolean;
    created_at?: Date;
    skills: { [key: string]: string };
}