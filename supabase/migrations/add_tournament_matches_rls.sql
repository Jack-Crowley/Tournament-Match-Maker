-- Enable RLS on tournament_matches table
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Only tournament participants, organizers, and owners can read tournament matches
CREATE POLICY "Only tournament participants, organizers, and owners can read matches"
ON tournament_matches
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_matches.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers
                WHERE tournament_organizers.tournament_id = tournaments.id
                AND tournament_organizers.member_uuid = auth.uid()
                AND tournament_organizers.accepted = true
            ) OR
            EXISTS (
                SELECT 1 FROM tournament_players
                WHERE tournament_players.tournament_id = tournaments.id
                AND tournament_players.member_uuid = auth.uid()
            )
        )
    )
);

-- Only admins, scorekeepers, and tournament owners can update matches
CREATE POLICY "Only admins, scorekeepers, and owners can update matches"
ON tournament_matches
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_matches.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers
                WHERE tournament_organizers.tournament_id = tournaments.id
                AND tournament_organizers.member_uuid = auth.uid()
                AND tournament_organizers.permission_level IN ('Admin', 'Scorekeeper')
                AND tournament_organizers.accepted = true
            )
        )
    )
);

-- Only admins, scorekeepers, and tournament owners can insert matches
CREATE POLICY "Only admins, scorekeepers, and owners can insert matches"
ON tournament_matches
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_matches.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers
                WHERE tournament_organizers.tournament_id = tournaments.id
                AND tournament_organizers.member_uuid = auth.uid()
                AND tournament_organizers.permission_level IN ('Admin', 'Scorekeeper')
                AND tournament_organizers.accepted = true
            )
        )
    )
);

-- Only admins and tournament owners can delete matches
CREATE POLICY "Only admins and owners can delete matches"
ON tournament_matches
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_matches.tournament_id
        AND (
            tournaments.owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM tournament_organizers
                WHERE tournament_organizers.tournament_id = tournaments.id
                AND tournament_organizers.member_uuid = auth.uid()
                AND tournament_organizers.permission_level = 'Admin'
                AND tournament_organizers.accepted = true
            )
        )
    )
); 