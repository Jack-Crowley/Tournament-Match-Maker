// page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

// Define Team interface for type safety
interface Team {
    id: number;
    name: string;
    membersCount: number;
    image: string;
    tournamentsJoined: number;
    tournamentsWon: number;
    gamesPlayed: number;
    gamesWon: number;
}

// Mock database (replace this with a real API or database query)
const teams: Team[] = [
    {
        id: 1,
        name: 'Knightly Knights',
        membersCount: 12,
        image: '/team1.jpg',
        tournamentsJoined: 5,
        tournamentsWon: 2,
        gamesPlayed: 20,
        gamesWon: 10,
    },
    {
        id: 2,
        name: 'Rockeeters',
        membersCount: 8,
        image: '/team2.jpg',
        tournamentsJoined: 3,
        tournamentsWon: 1,
        gamesPlayed: 15,
        gamesWon: 5,
    },
    {
        id: 3,
        name: 'Chicago Monkees',
        membersCount: 15,
        image: '/team3.jpg',
        tournamentsJoined: 7,
        tournamentsWon: 3,
        gamesPlayed: 25,
        gamesWon: 12,
    },
    {
        id: 4,
        name: 'Blazing Blues',
        membersCount: 10,
        image: '/team4.jpg',
        tournamentsJoined: 4,
        tournamentsWon: 2,
        gamesPlayed: 18,
        gamesWon: 8,
    },
];

// Helper function to fetch a team by ID
const getTeamById = (id: number): Team | undefined => {
    return teams.find((team) => team.id === id);
};

// Default export for the dynamic Team Details page
export default async function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    const team = getTeamById(Number(id));

    if (!team) {
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
                {/* Team banner */}
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
                {/* Team name */}
                <h1 className="text-4xl font-bold text-center mb-8">{team.name}</h1>

                {/* Team stats grid */}
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

// Helper component for team stats
const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-bold mb-2">{label}</h3>
        <p className="text-4xl font-black">{value}</p>
    </div>
);
