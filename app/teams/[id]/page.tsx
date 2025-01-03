import { Metadata } from 'next';
import Link from 'next/link';
import Image from "next/legacy/image";
import { supabase } from '../../../lib/supabaseClient'; // Adjust the path as per your setup

// Dynamic metadata for the team page
export const generateMetadata = async ({ params }: { params: { id: string } }): Promise<Metadata> => {
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', Number(params.id))
    .single();

  return {
    title: team ? `${team.name} Details` : 'Team Not Found',
  };
};

// Team Details Page
export default async function TeamDetailsPage({ params }: { params: { id: string } }) {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', Number(params.id))
    .single();

  if (error || !team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-4">Team Not Found</h1>
        <p className="text-lg mb-8">The team you are looking for does not exist or may have been removed.</p>
        <Link href="/teams">
          <button className="px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-bold hover:bg-purple-600 transition">
            Back to Teams
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <div className="w-full max-w-4xl p-8">
        {/* Team Banner */}
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg mb-6">
          <Image
            src={team.image}
            alt={`Banner for ${team.name}`}
            width={800}
            height={400}
            className="object-cover"
            priority
          />
        </div>

        {/* Team Name */}
        <h1 className="text-4xl font-bold text-center mb-8">{team.name}</h1>

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-6">
          <StatCard label="Members" value={team.membersCount} />
          <StatCard label="Tournaments Joined" value={team.tournamentsJoined} />
          <StatCard label="Tournaments Won" value={team.tournamentsWon} />
          <StatCard label="Games Played" value={team.gamesPlayed} />
          <StatCard label="Games Won" value={team.gamesWon} />
        </div>

        {/* Back to Teams Button */}
        <div className="text-center mt-8">
          <Link href="/teams">
            <button className="px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-bold hover:bg-purple-600 transition">
              Back to Teams
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reusable component for displaying stats
const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{label}</h3>
    <p className="text-4xl font-black">{value}</p>
  </div>
);
