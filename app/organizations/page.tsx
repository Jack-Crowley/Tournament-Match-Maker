import Image from "next/legacy/image"
import Link from "next/link";

export default function Home() {
    return (
        <div>
            <div className="grid grid-cols-3 mt-10 px-20 gap-8 vert gap-y-16">
                
                {/* Create New Organization */}
                <Link href="/organizations/create" passHref>
                    <div className="hover:cursor-pointer w-[75%] h-[250px] ml-[12.5%] bg-[#604BAC] flex flex-col justify-center items-center rounded-md">
                        <div className="h-full flex justify-center items-center">
                            <h1 className="text-white text-[5rem] text-center m-0">+</h1>
                        </div>
                        <div className="text-2xl text-white text-center w-full py-2 mt-auto rounded-md">
                            Create New Organization
                        </div>
                    </div>
                </Link>

                {/* Organization Card 1 */}
                <div className="hover:cursor-pointer w-[75%] h-[250px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md relative overflow-hidden">
                    <Image
                        src="/organization1.jpg"
                        alt="Organization 1"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md z-10">
                    ProGolf Tournament Association
                    </div>
                </div>

                {/* Organization Card 2 */}
                <div className="hover:cursor-pointer w-[75%] h-[250px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md relative overflow-hidden">
                    <Image
                        src="/organization2.jpg"
                        alt="Organization 2"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md z-10">
                        eSports Championship League
                    </div>
                </div>

                {/* Organization Card 3 */}
                <div className="hover:cursor-pointer w-[75%] h-[250px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md relative overflow-hidden">
                    <Image
                        src="/organization3.jpg"
                        alt="Organization 3"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md z-10">
                        Ultimate Sports Challenge
                    </div>
                </div>

                {/* Organization Card 4 */}
                <div className="hover:cursor-pointer w-[75%] h-[250px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md relative overflow-hidden">
                    <Image
                        src="/organization4.png"
                        alt="Organization 4"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md z-10">
                        Northern Counties Soccer Association
                    </div>
                </div>

            </div>
        </div>
    );
}
