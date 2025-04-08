-- Enable RLS on tournament_organizers table
ALTER TABLE tournament_organizers ENABLE ROW LEVEL SECURITY;

-- Only tournament owners, admins, and users can read their own row
CREATE POLICY "Only owners, admins, and users can read organizers"
ON tournament_organizers
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_organizers.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers AS existing_orgs
                WHERE existing_orgs.tournament_id = tournaments.id
                AND existing_orgs.member_uuid = auth.uid()
                AND existing_orgs.permission_level = 'Admin'
                AND existing_orgs.accepted = true
            )
        )
    )
    OR
    tournament_organizers.member_uuid = auth.uid()
);

-- Only admins and tournament owners can insert organizers
CREATE POLICY "Only admins and owners can insert organizers"
ON tournament_organizers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_organizers.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers AS existing_orgs
                WHERE existing_orgs.tournament_id = tournaments.id
                AND existing_orgs.member_uuid = auth.uid()
                AND existing_orgs.permission_level = 'Admin'
                AND existing_orgs.accepted = true
            )
        )
    )
);

-- Admins and owners can update any row, users can only update their own accepted status
CREATE POLICY "Admins and owners can update any row, users can update their own accepted status"
ON tournament_organizers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_organizers.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers AS existing_orgs
                WHERE existing_orgs.tournament_id = tournaments.id
                AND existing_orgs.member_uuid = auth.uid()
                AND existing_orgs.permission_level = 'Admin'
                AND existing_orgs.accepted = true
            )
        )
    )
    OR
    (
        tournament_organizers.member_uuid = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM tournament_organizers AS existing_orgs
            WHERE existing_orgs.tournament_id = tournament_organizers.tournament_id
            AND existing_orgs.member_uuid = auth.uid()
            AND existing_orgs.accepted = true
        )
    )
)
WITH CHECK (
    -- For admins and owners, they can update any column
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_organizers.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers AS existing_orgs
                WHERE existing_orgs.tournament_id = tournaments.id
                AND existing_orgs.member_uuid = auth.uid()
                AND existing_orgs.permission_level = 'Admin'
                AND existing_orgs.accepted = true
            )
        )
    )
    OR
    -- For regular users, they can only update the 'accepted' column
    (
        tournament_organizers.member_uuid = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM tournament_organizers AS existing_orgs
            WHERE existing_orgs.tournament_id = tournament_organizers.tournament_id
            AND existing_orgs.member_uuid = auth.uid()
            AND existing_orgs.accepted = true
        )
        AND tournament_organizers.permission_level = (SELECT permission_level FROM tournament_organizers WHERE id = tournament_organizers.id)
        AND tournament_organizers.member_uuid = (SELECT member_uuid FROM tournament_organizers WHERE id = tournament_organizers.id)
        AND tournament_organizers.tournament_id = (SELECT tournament_id FROM tournament_organizers WHERE id = tournament_organizers.id)
    )
);

-- Admins, owners, or users can delete their own row
CREATE POLICY "Admins, owners, or users can delete their own row"
ON tournament_organizers
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_organizers.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers AS existing_orgs
                WHERE existing_orgs.tournament_id = tournaments.id
                AND existing_orgs.member_uuid = auth.uid()
                AND existing_orgs.permission_level = 'Admin'
                AND existing_orgs.accepted = true
            )
        )
    )
    OR
    tournament_organizers.member_uuid = auth.uid()
); 