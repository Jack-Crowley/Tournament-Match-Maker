import Link from 'next/link';
import Image from 'next/image';

export default function TeamsPage() {
    const teams = [
        { id: 1, name: 'Knightly Knights', membersCount: 12, image: '/team.jpg' },
        { id: 2, name: 'Rockeeters', membersCount: 8, image: '/team.jpg' },
        { id: 3, name: 'Chicago Monkees', membersCount: 15, image: '/team.jpg' },
        { id: 4, name: 'Blazing Blues', membersCount: 10, image: '/team.jpg' },

    ];

    return (
        <div className="w-full justify-center">
            <div className="w-full">
                <div className="grid grid-cols-3 gap-8 p-8">
                    <Link href="/teams/create">
                        <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-[#604BAC] flex flex-col justify-center items-center rounded-md">
                            <div className="h-full flex justify-center items-center">
                                <h1 className="text-white text-[5rem] text-center m-0">+</h1>
                            </div>
                            <div className="text-2xl text-white text-center w-full py-2 mt-auto rounded-md">
                                Create New
                            </div>
                        </div>
                    </Link>

                    {teams.map((team) => (
                        <div
                            key={team.id}
                            className="hover:cursor-pointer w-[75%] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center relative overflow-hidden"
                        >
                            <Link href={`/teams/${team.id}`} className='w-full'>
                                <div className="relative w-full h-[200px]">
                                    <Image
                                        src={team.image}
                                        alt={`${team.name} image`}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                                <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 z-10">
                                    {team.name}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
