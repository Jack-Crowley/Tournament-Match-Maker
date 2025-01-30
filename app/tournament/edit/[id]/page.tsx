'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function EditTournament() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setTournament(data);

        // Fetch owner information
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select('*')
          .eq('uuid', data.owner)
          .single();

        if (ownerError) throw ownerError;

        setOwner(ownerData);
      } catch (error) {
        console.error('Error fetching tournament:', error);
      }
    };

    fetchTournament();
  }, [id, supabase]);

  const handleAddPlayer = async () => {
    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Look up user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uuid')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      if (!userData) {
        setError('User not found.');
        return;
      }

      // Insert into tournament_players table
      const { error: insertError } = await supabase
        .from('tournament_players')
        .insert([{ tournament_id: id, member_uuid: userData.uuid }]);

      if (insertError) throw insertError;

      // Clear the input field
      setEmail('');
      setError('');
      alert('Player added successfully!');
    } catch (error) {
      console.error('Error adding player:', error);
      setError('Failed to add player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tournament || !owner) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Tournament: {tournament.name}</h1>
      <div className="mb-6">
        <p><strong>Description:</strong> {tournament.description}</p>
        <p><strong>Owner:</strong> {owner.email}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Players</h2>
        <div className="flex items-center space-x-2">
          <input
            type="email"
            placeholder="Enter player's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border border-gray-300 rounded text-black"
          />
          <button
            onClick={handleAddPlayer}
            disabled={loading}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? 'Adding...' : 'Add Player'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <button
        onClick={() => router.push(`/tournaments/${id}`)}
        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Back to Tournament
      </button>
    </div>
  );
}