import { supabase } from './supabaseClient';
import { Team } from "../app/teams/page";

export const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase.from('teams').select('*');

  if (error) {
    console.error('Error fetching teams:', error);
  }

  return data as Team[];
};
