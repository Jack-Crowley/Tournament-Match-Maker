import { supabase } from './supabaseClient';
import { Team } from "../app/teams/page";

export const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase.from('teams').select('*');

  if (error) {
    console.error('Error fetching teams:', error);
  }

  return data as Team[];
};

export const addTeam = async (team: Team): Promise<Team | null> => {
  try {

    const { data, error } = await supabase.from('teams').insert(team).single();

    if (error) {
      console.error('Error adding team:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data as Team;

  } catch (err) {
    console.error('Unexpected error adding team:', err);
    return null;
  }
};

/**
 * Fetch a team by its unique ID from the 'teams' table.
 * @param {number} id - The unique identifier of the team.
 * @returns {Promise<Team | null>} - Returns the team data or null if not found.
 */
export const fetchTeamById = async (id: number): Promise<Team | null> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching team with ID ${id}:`, error);
      return null;
    }

    return data as Team;
  } catch (err) {
    console.error(`Unexpected error fetching team with ID ${id}:`, err);
    return null;
  }
};
