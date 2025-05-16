import { NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/utils/supabase/service_role'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const joinCode = searchParams.get('code')

    if (!joinCode) {
        return NextResponse.json(
            { error: 'Join code is required' },
            { status: 400 }
        )
    }

    // Get tournament by join code
    const { data: tournament, error } = await supabaseServiceRole
        .from('tournaments')
        .select('*')
        .eq('join_code', joinCode)
        .single()

    if (error) {
        return NextResponse.json(
            { error: 'Tournament not found' },
            { status: 404 }
        )
    }

    if (tournament.allow_join !== true) {
        return NextResponse.json(
            { error: 'Tournament is not currently accepting players' },
            { status: 400 }
        )
    }

    // Get current number of players
    const { count } = await supabaseServiceRole 
        .from('tournament_players')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id)
        .eq('left_match', false)

    // Check if tournament is full
    if (count && tournament.max_players && tournament.max_players != 0 && count >= tournament.max_players) {
        return NextResponse.json(
            { error: 'Tournament is full' },
            { status: 400 }
        )
    }

    return NextResponse.json({
        tournament: {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            status: tournament.status,
            skill_fields: tournament.skill_fields,
            max_players: tournament.max_players,
            current_players: count || 0
        }
    })
}
