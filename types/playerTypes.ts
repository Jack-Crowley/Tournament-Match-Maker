export interface Player {
    id: string;
    member_uuid: string;
    player_name: string;
    member_id?: string;
    email?: string;
    is_anonymous?: boolean;
    created_at?: Date;
    skills: { [key: string]: string };
}