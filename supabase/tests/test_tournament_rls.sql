-- Test tournament RLS policies

DO $$
BEGIN
    RAISE NOTICE 'Starting tournament RLS tests...';
END;
$$;

-- First, create test users
INSERT INTO auth.users (id, email, is_anonymous) VALUES
    ('11111111-1111-1111-1111-111111111111', 'test1@example.com', false),
    ('22222222-2222-2222-2222-222222222222', 'test2@example.com', false),
    ('33333333-3333-3333-3333-333333333333', 'test3@example.com', false);

DO $$
BEGIN
    RAISE NOTICE 'Created test users';
END;
$$;

-- Create test tournaments
INSERT INTO tournaments (id, name, description, owner, created_at) VALUES
    ('1111', 'Test Tournament 1', 'Description 1', '11111111-1111-1111-1111-111111111111', NOW()),
    ('2222', 'Test Tournament 2', 'Description 2', '22222222-2222-2222-2222-222222222222', NOW());

DO $$
BEGIN
    RAISE NOTICE 'Created test tournaments';
END;
$$;

-- Add test_user_1 as admin of tournament_2
INSERT INTO tournament_organizers (tournament_id, member_uuid, permission_level, accepted) VALUES
    ('2222', '11111111-1111-1111-1111-111111111111', 'Admin', true);

DO $$
BEGIN
    RAISE NOTICE 'Added test_user_1 as admin of tournament_2';
END;
$$;

-- Test 1: Regular user trying to update a tournament they don't own
DO $$
BEGIN
    RAISE NOTICE 'Test 1: Regular user trying to update a tournament they don''t own (should fail)';
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '33333333-3333-3333-3333-333333333333';
SET LOCAL "request.jwt.claim.is_anonymous" TO 'false';

-- This should fail
UPDATE tournaments 
SET name = 'Updated Name' 
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 1: Update succeeded (this is unexpected!)';
END;
$$;

ROLLBACK;

-- Test 2: Admin trying to update their own tournament
DO $$
BEGIN
    RAISE NOTICE 'Test 2: Admin trying to update their own tournament (should succeed)';
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claim.is_anonymous" TO 'false';

-- This should succeed
UPDATE tournaments 
SET name = 'Updated Name' 
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 2: Update succeeded (as expected)';
END;
$$;

ROLLBACK;

-- Test 3: Admin trying to modify protected columns
DO $$
BEGIN
    RAISE NOTICE 'Test 3: Admin trying to modify protected columns (should fail)';
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claim.is_anonymous" TO 'false';

-- These should all fail
UPDATE tournaments 
SET id = '3333' 
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 3: Protected column update succeeded (this is unexpected!)';
END;
$$;

UPDATE tournaments 
SET created_at = NOW() 
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 3: Protected column update succeeded (this is unexpected!)';
END;
$$;

UPDATE tournaments 
SET owner = '33333333-3333-3333-3333-333333333333' 
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 3: Protected column update succeeded (this is unexpected!)';
END;
$$;

ROLLBACK;

-- Test 4: Admin trying to modify non-protected columns
DO $$
BEGIN
    RAISE NOTICE 'Test 4: Admin trying to modify non-protected columns (should succeed)';
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claim.is_anonymous" TO 'false';

-- These should all succeed
UPDATE tournaments 
SET name = 'New Name',
    description = 'New Description',
    location = 'New Location'
WHERE id = '1111';

DO $$
BEGIN
    RAISE NOTICE 'Test 4: Non-protected column update succeeded (as expected)';
END;
$$;

ROLLBACK;

-- Test 5: Admin trying to update a tournament they are admin of but don't own
DO $$
BEGIN
    RAISE NOTICE 'Test 5: Admin trying to update a tournament they are admin of but don''t own (should succeed)';
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claim.is_anonymous" TO 'false';

-- This should succeed
UPDATE tournaments 
SET name = 'Updated Name' 
WHERE id = '2222';

DO $$
BEGIN
    RAISE NOTICE 'Test 5: Update succeeded (as expected)';
END;
$$;

ROLLBACK;

-- Cleanup
DELETE FROM tournament_organizers WHERE tournament_id IN ('1111', '2222');
DELETE FROM tournaments WHERE id IN ('1111', '2222');
DELETE FROM auth.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

DO $$
BEGIN
    RAISE NOTICE 'Cleanup completed';
    RAISE NOTICE 'All tests finished';
END;
$$; 