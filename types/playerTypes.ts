import { PlayerSkill } from "./bracketTypes";

export interface Player {
    id: string;
    member_uuid: string;
    player_name: string;
    member_id?: string;
    email?: string;
    is_anonymous?: boolean;
    created_at?: Date;
    skills: PlayerSkill[];
}

export interface TournamentPlayer {
    id: number;
    last_update:string;
    member_uuid:string;
    tournament_id:number;
    tournament_director:boolean;
    player_name:string;
    is_anonymous:boolean;
    skills:JSON;
    placeholder_player:boolean;
    type:string;
}