export interface ScoreReport {
    id: string;
    created_at: string;
    match_id: number;
    tournament_id: string;
    is_tie:boolean;
    reporter_id: string;
    scores : {
        player_uuid: string,
        score:string;
    }[];
    winner: string;
    status: "pending" | "disputed" | "accepted" | "auto-accepted";
};