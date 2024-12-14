import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

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

const teams: Team[] = [
    {
        id: 1,
        name: 'Team 1',
        membersCount: 12,
        image: '/team.jpg',
        tournamentsJoined: 5,
        tournamentsWon: 2,
        gamesPlayed: 20,
        gamesWon: 10,
    },
    {
        id: 2,
        name: 'Team 2',
        membersCount: 8,
        image: '/team.jpg',
        tournamentsJoined: 3,
        tournamentsWon: 1,
        gamesPlayed: 15,
        gamesWon: 5,
    },
    {
        id: 3,
        name: 'Team 3',
        membersCount: 15,
        image: '/team.jpg',
        tournamentsJoined: 7,
        tournamentsWon: 3,
        gamesPlayed: 25,
        gamesWon: 12,
    },
    {
        id: 4,
        name: 'Team 4',
        membersCount: 10,
        image: '/team.jpg',
        tournamentsJoined: 4,
        tournamentsWon: 2,
        gamesPlayed: 18,
        gamesWon: 8,
    },
];

// Temporary hardcoded data (replace with a real database or API)

// Fetch a single team based on ID
const getTeamById = (id: number): Team | undefined => {
    return teams.find((team) => team.id === id);
};

// Metadata for SEO
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => {
    const team = getTeamById(Number(params.id));
    return {
        title: team ? `Details for ${team.name}` : 'Team Not Found',
    };
};

// Team Details Page
export default function TeamDetailsPage({ params }: { params: { id: string } }) {
    const team = getTeamById(Number(params.id));

    if (!team) {
        return (
            <div className="w-full justify-center text-center text-white p-8">
                <h1 className="text-4xl font-bold">Team Not Found</h1>
                <Link href="/teams/display">
                    <button className="mt-8 px-8 py-4 bg-[#ECD4F7] rounded-full text-[#160A3A] font-bold text-xl hover:opacity-90 transition-opacity">
                        Back to Teams
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full justify-center">
            <div className="min-h-[calc(100vh-160px)] w-full bg-[#160A3A] flex flex-col items-center justify-center p-8 text-white">
                <div className="relative w-full max-w-4xl flex justify-center rounded-lg overflow-hidden shadow-lg mb-8">
                    <Image
                        src={team.image}
                        alt={`${team.name} banner`}
                        width={800}
                        height={400}
                        className="object-cover"
                    />
                </div>
                <h1 className="text-4xl font-bold mb-8">{team.name}</h1>
                <div className="grid grid-cols-2 gap-8 text-center w-full max-w-4xl mb-8">
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold">Members</h3>
                        <p className="text-5xl font-black mt-4">{team.membersCount}</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold">Tournaments Joined</h3>
                        <p className="text-5xl font-black mt-4">{team.tournamentsJoined}</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold">Tournaments Won</h3>
                        <p className="text-5xl font-black mt-4">{team.tournamentsWon}</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold">Games Played</h3>
                        <p className="text-5xl font-black mt-4">{team.gamesPlayed}</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold">Games Won</h3>
                        <p className="text-5xl font-black mt-4">{team.gamesWon}</p>
                    </div>
                </div>
                <Link href="/teams/display">
                    <button className="mt-8 px-8 py-4 bg-[#ECD4F7] rounded-full text-[#160A3A] font-bold text-xl hover:opacity-90 transition-opacity">
                        Back to Teams
                    </button>
                </Link>
            </div>
        </div>
    );
}
