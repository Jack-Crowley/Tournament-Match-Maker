-- Enable RLS on tournaments table
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read tournaments" ON tournaments;
DROP POLICY IF EXISTS "Only authenticated and non-anonymous users can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Only admins and organizers can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Only admins can delete tournaments" ON tournaments;

-- Create new policies

-- Only allow read access to users who are players, admins, organizers, scorekeepers, viewers, or owners
CREATE POLICY "Restricted read access to tournaments"
ON tournaments
FOR SELECT
USING (
    auth.uid() = owner OR
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
);

-- Only authenticated and non-anonymous users can create tournaments
CREATE POLICY "Only authenticated and non-anonymous users can create tournaments"
ON tournaments
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'is_anonymous')::boolean = false
);

-- Only admins and organizers can update their own tournaments, except protected columns
CREATE POLICY "Only admins and organizers can update their own tournaments"
ON tournaments
FOR UPDATE
USING (
    auth.uid() = owner OR
    EXISTS (
        SELECT 1 FROM tournament_organizers
        WHERE tournament_organizers.tournament_id = tournaments.id
        AND tournament_organizers.member_uuid = auth.uid()
        AND tournament_organizers.permission IN ('Admin', 'Organizer')
        AND tournament_organizers.accepted = true
    )
)
WITH CHECK (
    -- Prevent updates to protected columns by ensuring they match the existing values
    id = tournaments.id AND
    created_at = tournaments.created_at AND
    owner = tournaments.owner
);

-- Only admins can delete their own tournaments
CREATE POLICY "Only admins can delete their own tournaments"
ON tournaments
FOR DELETE
USING (
    auth.uid() = owner OR
    EXISTS (
        SELECT 1 FROM tournament_organizers
        WHERE tournament_organizers.tournament_id = tournaments.id
        AND tournament_organizers.member_uuid = auth.uid()
        AND tournament_organizers.permission = 'Admin'
        AND tournament_organizers.accepted = true
    )
); 