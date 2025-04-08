
import { NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'

export async function GET(req: Request) {
    const supabase = createServer()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { data: owning, error: ownerErr } = await supabase
        .from('tournaments')
        .select('*')
        .eq('owner', userId)

    const owningIds = owning?.map((t) => t.id) ?? []

    const { data: organizerAccepted } = await supabase
        .from('tournament_organizers')
        .select('*')
        .eq('member_uuid', userId)
        .eq('accepted', true)

    const organizerIds = organizerAccepted
        ?.map((o) => o.tournament_id)
        .filter((id) => !owningIds.includes(id)) ?? []

    const { data: nonOwnerTournaments } = organizerIds.length
        ? await supabase
            .from('tournaments')
            .select('*')
            .in('id', organizerIds)
        : { data: [] }

    const { data: playing } = await supabase
        .from('tournament_players')
        .select('tournament_id')
        .eq('member_uuid', userId)
        .eq('left_match', false)

    const playingIds = playing?.map((p) => p.tournament_id) ?? []
    const filteredPlayingIds = playingIds.filter((id) => !owningIds.includes(id))

    const tournamentDetails: any[] = []
    for (const id of filteredPlayingIds) {
        const { data } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single()
        if (data) tournamentDetails.push(data)
    }

    const { data: invitations } = await supabase
        .from('tournament_organizers')
        .select('tournament_id, permission_level, accepted')
        .eq('member_uuid', userId)
        .eq('accepted', false)

    let invitationDetails = [];

    if (invitations) {
        invitationDetails = await Promise.all(
            invitations.map(async (inv) => {
                const { data, error } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('id', inv.tournament_id)
                    .single()
                if (data) {
                    return {
                        ...data,
                        permission_level: inv.permission_level,
                    }
                }
                return null
            })
        )
    }

    return NextResponse.json({
        organizing: [...owning ?? [], ...nonOwnerTournaments ?? []],
        playing: tournamentDetails,
        invitations: invitationDetails.filter(Boolean),
    })
}