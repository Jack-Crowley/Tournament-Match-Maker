import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'

export async function GET(req: NextRequest) {
    const supabase = createServer()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uuid = user.id
    const anonymous = user.user_metadata?.is_anonymous ?? false

    const tournamentID = parseInt(req.nextUrl.searchParams.get('tournamentID') || '')

    if (isNaN(tournamentID)) {
        return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 })
    }

    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentID)
        .single()

    if (tournamentError || !tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.owner === uuid) {
        return NextResponse.json({
            uuid,
            anonymous,
            permission_level: 'owner',
        })
    }

    const { data: organizer, error: organizerError } = await supabase
        .from('tournament_organizers')
        .select('*')
        .eq('tournament_id', tournamentID)
        .eq('member_uuid', uuid)
        .eq('accepted', true)
        .single()

    if (organizer && !organizerError) {
        return NextResponse.json({
            uuid,
            anonymous,
            permission_level: organizer.permission_level,
        })
    }

    const { data: player } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentID)
        .eq('member_uuid', uuid)
        .single()

    if (player) {
        return NextResponse.json({
            uuid,
            anonymous,
            permission_level: 'playing',
        })
    }

    return NextResponse.json({
        uuid,
        anonymous,
        permission_level: 'none',
    })
}
