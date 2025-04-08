import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { supabaseServiceRole } from '@/utils/supabase/service_role'

export async function POST(req: NextRequest) {
    const supabase = createServer()
    const body = await req.json()

    const { tournamentID, organizers } = body

    if (!tournamentID || !Array.isArray(organizers)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uuid = user.id

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
        .single()

    if (!isOwner && !organizer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let successCount = 0
    let failCount = 0

    for (const organizer of organizers) {
        const { email, permission } = organizer

        const { data: userData, error: userError } = await supabaseServiceRole
            .from('users')
            .select('uuid')
            .eq('email', email)
            .single()

        console.log("TEST", userError, userData, email)

        if (userError || !userData) {
            failCount++
            continue
        }

        const userUuid = userData.uuid

        const { data: organizerData, error: organizerError } = await supabaseServiceRole
            .from('tournament_organizers')
            .select('accepted, permission_level')
            .eq('tournament_id', tournamentID)
            .eq('member_uuid', userUuid)
            .single()

        console.log(organizerError, organizerData)

        if (organizerError || !organizerData) {
            const { error: addOrganizerError } = await supabaseServiceRole
                .from('tournament_organizers')
                .insert([
                    {
                        tournament_id: tournamentID,
                        member_uuid: userUuid,
                        permission_level: permission,
                        accepted: false,
                    },
                ])

            if (addOrganizerError) {
                failCount++
            } else {
                successCount++
            }
        } else {
            if (organizerData.permission_level === permission) {
                successCount++
                continue
            }

            const { error: updateError } = await supabaseServiceRole
                .from('tournament_organizers')
                .update({ permission_level: permission })
                .eq('tournament_id', tournamentID)
                .eq('member_uuid', userUuid)

            if (updateError) {
                failCount++
            } else {
                successCount++
            }
        }
    }

    return NextResponse.json(
        {
            message: 'Organizers processed successfully',
            successCount,
            failCount,
        },
        { status: 200 }
    )
}

export async function GET(req: NextRequest) {
    const supabase = createServer()
    const { searchParams } = new URL(req.url)
    const tournamentID = searchParams.get('tournamentID')

    if (!tournamentID) {
        return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uuid = user.id

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
        .single()

    if (!isOwner && !organizer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: organizersData, error: organizersError } = await supabaseServiceRole
        .from('tournament_organizers')
        .select('member_uuid, permission_level, accepted')
        .eq('tournament_id', tournamentID)

    if (organizersError) {
        return NextResponse.json({ error: 'Failed to fetch organizers' }, { status: 500 })
    }

    const organizersWithEmails = await Promise.all(
        organizersData.map(async (organizer) => {
            const { data: userData, error: userError } = await supabaseServiceRole
                .from('users')
                .select('email')
                .eq('uuid', organizer.member_uuid)
                .single()

            if (userError || !userData) {
                return null
            }

            return {
                email: userData.email,
                permission: organizer.permission_level,
                accepted: organizer.accepted
            }
        })
    )

    const filteredOrganizers = organizersWithEmails.filter((organizer) => organizer !== null)

    return NextResponse.json({ organizers: filteredOrganizers }, { status: 200 })
}
