import Image from "next/image"
import Link from "next/link";

export default function Home() {
    return (
        <div>
            <div className="grid grid-cols-3 mt-10 px-20 gap-8 vert gap-y-16">
                <Link href="/teams/create" passHref>
                    <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-[#604BAC] flex flex-col justify-center items-center rounded-md">
                        <div className="h-full flex justify-center items-center">
                            <h1 className="text-white text-[5rem] text-center m-0">+</h1>
                        </div>
                        <div className="text-2xl text-white text-center w-full py-2 mt-auto rounded-md">
                            Create New
                        </div>
                    </div>
                </Link>

                <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md relative overflow-hidden">
                    <Image
                        src="/team.jpg"
                        alt="Picture of the author"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md z-10">
                        Team 1
                    </div>
                </div>

                <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md">
                    <div className="h-full flex justify-center items-center">
                        <h1 className="text-[#595959] text-5xl font-bold text-center">Select Profile Picture</h1>
                    </div>
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md">
                        Team 2
                    </div>
                </div>

                <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md">
                    <div className="h-full flex justify-center items-center">
                        <h1 className="text-[#595959] text-5xl font-bold text-center">Select Profile Picture</h1>
                    </div>
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md">
                        Team 3
                    </div>
                </div>

                <div className="hover:cursor-pointer w-[75%] h-[200px] ml-[12.5%] bg-gray-200 flex flex-col justify-center items-center rounded-md">
                    <div className="h-full flex justify-center items-center">
                        <h1 className="text-[#595959] text-5xl font-bold text-center">Select Profile Picture</h1>
                    </div>
                    <div className="text-2xl bg-[#604BAC] text-white text-center w-full py-2 mt-auto rounded-md">
                        Team 4
                    </div>
                </div>
            </div>
        </div>
    )
}