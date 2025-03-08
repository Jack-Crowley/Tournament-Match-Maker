import { User } from "@/types/userType";
import { createClient } from "../supabase/client";

export const getPermissionLevelForTournament = async (tournamentID: number, client : any): Promise<User | null> => {
    const uuid = client.session?.user.id;
    console.log()
    if (!uuid) return null;

    const anonymous = client.session?.user.is_anonymous
    if (anonymous == undefined) return null;
    let role = "none"

    const supabase = createClient()

    const { data:tournament, error:tournamentError } = await supabase.from("tournaments").select("*").eq("id", tournamentID).single()

    if (tournamentError) {
        console.log("Error fetching tournament")
        return null;
    }

    if (tournament.owner == uuid) {
        role = "owner"

        const user = {
            uuid,
            anonymous,
            permission_level: role
        }

        return user
    }

    console.log("given uuid is this: ", uuid)

    const {data:tournamentPermissions, error} = await supabase.from("tournament_organizers").select("*").eq("tournament_id", tournamentID).eq("member_uuid", uuid).eq("accepted", true).single()
    if (error) {
        console.log("Error fetching tournament permissions")
        return null
    }

    if (tournamentPermissions) {
        const user = {
            uuid,
            anonymous,
            permission_level: tournamentPermissions.permission_level
        }

        return user
    }

    const {data:tournament_playing} = await supabase.from("tournament_players").select("*").eq("tournament_id", tournamentID).eq("member_uuid", uuid).single()

    if (tournament_playing) {
        const user = {
            uuid,
            anonymous,
            permission_level: "playing"
        }

        return user
    }

    const user = {
        uuid,
        anonymous,
        permission_level: "none"
    }

    return user;

        
}