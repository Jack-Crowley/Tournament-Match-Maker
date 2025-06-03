-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcements (
  content text NOT NULL CHECK (length(content) < 750),
  title text NOT NULL CHECK (length(title) < 200),
  tournament_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.announcements_seen (
  announcement_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  seen boolean NOT NULL DEFAULT true,
  CONSTRAINT announcements_seen_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_seen_member_uuid_fkey FOREIGN KEY (member_uuid) REFERENCES public.users(uuid),
  CONSTRAINT announcements_seen_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id)
);
CREATE TABLE public.private_messages (
  tournament_id bigint NOT NULL,
  content text NOT NULL CHECK (length(content) < 1000),
  admin_sent boolean NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  player_seen boolean NOT NULL DEFAULT false,
  admin_seen boolean NOT NULL DEFAULT false,
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  player_uuid uuid NOT NULL,
  CONSTRAINT private_messages_pkey PRIMARY KEY (id),
  CONSTRAINT private_messages_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.score_reports (
  is_tie boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  match_id bigint NOT NULL,
  tournament_id bigint NOT NULL,
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reporter_id uuid NOT NULL,
  scores ARRAY,
  winner text NOT NULL,
  status text NOT NULL,
  CONSTRAINT score_reports_pkey PRIMARY KEY (id),
  CONSTRAINT score_reports_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.tournament_matches(id),
  CONSTRAINT score_reports_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.teams (
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  description text,
  name text NOT NULL DEFAULT ''::text,
  membersCount bigint NOT NULL DEFAULT '0'::bigint,
  image text NOT NULL DEFAULT ''::text,
  tournamentsJoined bigint NOT NULL DEFAULT '0'::bigint,
  tournamentsWon bigint NOT NULL DEFAULT '0'::bigint,
  gamesPlayed bigint NOT NULL DEFAULT '0'::bigint,
  gamesWon bigint NOT NULL DEFAULT '0'::bigint,
  CONSTRAINT teams_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tournament_matches (
  tournament_id bigint NOT NULL,
  round bigint NOT NULL,
  match_number bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  is_tie boolean NOT NULL DEFAULT false,
  winner uuid,
  players ARRAY NOT NULL,
  CONSTRAINT tournament_matches_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.tournament_organizers (
  permission_level text NOT NULL,
  tournament_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  accepted boolean NOT NULL DEFAULT false,
  CONSTRAINT tournament_organizers_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_organizers_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT tournament_organizers_member_uuid_fkey FOREIGN KEY (member_uuid) REFERENCES public.users(uuid)
);
CREATE TABLE public.tournament_players (
  type text NOT NULL DEFAULT ''::text CHECK (type = ANY (ARRAY['active'::text, 'inactive'::text, 'waitlist'::text])),
  member_uuid uuid,
  tournament_id bigint NOT NULL,
  player_name text CHECK (length(player_name) < 75),
  last_update timestamp with time zone NOT NULL DEFAULT now(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT true,
  placeholder_player boolean NOT NULL DEFAULT false,
  skills jsonb NOT NULL,
  left_match boolean NOT NULL DEFAULT false,
  CONSTRAINT tournament_players_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.tournaments (
  style_specific_settings json,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  owner uuid DEFAULT gen_random_uuid(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL CHECK (length(name) < 100),
  description text CHECK (length(description) < 500),
  organization text CHECK (length(organization) < 100),
  team_tournament boolean NOT NULL DEFAULT false,
  join_code text DEFAULT gen_join_code() UNIQUE,
  tournament_type text NOT NULL DEFAULT 'single'::text,
  custom_rules json NOT NULL DEFAULT '{}'::json,
  require_account boolean NOT NULL DEFAULT false,
  status text,
  allow_join boolean DEFAULT false,
  location text CHECK (length(location) < 150),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  waitlist boolean DEFAULT false,
  max_players integer CHECK (max_players < 5000),
  rules ARRAY NOT NULL DEFAULT '{}'::text[],
  max_rounds integer,
  skill_fields jsonb,
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id)
);
CREATE TABLE public.user_permissions (
  tournament_id bigint NOT NULL,
  permission_level text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT user_permissions_member_uuid_fkey FOREIGN KEY (member_uuid) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  email text NOT NULL UNIQUE,
  name text,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (uuid)
);