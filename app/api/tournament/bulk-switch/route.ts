import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'

export async function PATCH(req: NextRequest) {
    const supabase = createServer()
    const body = await req.json()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    console.log('user', user)

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uuid = user.id
    const { tournamentID, playerIDs, type } = body

    if (!tournamentID || !Array.isArray(playerIDs) || !type) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, owner')
        .eq('id', tournamentID)
        .single()

    const isOwner = tournament?.owner === uuid
 
    const { data: organizer } = await supabase
        .from('tournament_organizers')
        .select('id')
        .eq('tournament_id', tournamentID)
        .eq('member_uuid', uuid)
        .eq('accepted', true)
        .eq("permission_level", "Admin")
        .single()

    if (!isOwner && !organizer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const newType = type === 'active' ? 'waitlist' : 'active'


    const { error } = await supabase
        .from('tournament_players')
        .update({ type: newType })
        .in('id', playerIDs)

    if (error) {
        return NextResponse.json({ error: 'Error updating players' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Players updated successfully' }, { status: 200 })
}
