import { createServer } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServer()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { tournament_id } = body

  if (!tournament_id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('uuid')
    .eq('uuid', user.id)
    .single()

  if (!userData || userError) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select('owner')
    .eq('id', tournament_id)
    .eq('owner', user.id)
    .single()

  if (tournamentData) {
    return NextResponse.json({ message: 'User is the tournament director' }, { status: 200 })
  }

  if (tournamentError) {
    return NextResponse.json({ error: 'Error checking tournament director' }, { status: 500 })
  }

  const { data: organizerData, error: organizerError } = await supabase
    .from('tournament_organizers')
    .select('permission_level')
    .eq('tournament_id', tournament_id)
    .eq('member_uuid', user.id)
    .eq('permission_level', 'admin')
    .single()

  if (organizerData) {
    return NextResponse.json({ message: 'User is an admin organizer' }, { status: 200 })
  }

  if (organizerError) {
    return NextResponse.json({ error: 'Error checking tournament organizer' }, { status: 500 })
  }

  return NextResponse.json({ error: 'User is not authorized' }, { status: 403 })
}