import Image from "next/image";
import Link from "next/link";

export default function Home() {
    return (
        <div>
            <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-20">Ongoing Tournaments</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                <div className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                    <Image
                        src="/frisbee.jpeg"
                        width={500}
                        height={400}
                        alt="Picture of the author"
                        className="w-[70%] rounded-2xl"
                    />
                    <div className="px-6 py-4 text-center">
                        <div className="font-bold text-xl mb-2">The Michael Scott Memorial Frisbee Golf Tournament</div>
                        <p className="text-gray-100 text-semibold">
                            Join us for the inaugural Michael Thompson Memorial Frisbee Golf Tournament! Celebrate the life and legacy of Michael Thompson, a passionate Frisbee golfer whose dedication to the sport inspired many. The tournament will feature challenging courses, friendly competition, and a chance to honor his contributions to the Frisbee golf community.
                            <br />
                            <strong>Event Date:</strong> January 15th, 2025
                            <br />
                            <strong>Location:</strong> Green Meadows Golf Course
                            <br />
                        </p>
                    </div>
                    <Link href="/tournament/manage/1" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843] focus:ring-4 focus:outline-none focus:ring-[#412a6e]">
                        Read more
                        <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </Link>
                </div>
            </div>
            <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-5">Previous Tournaments</h1>
            <div className="grid grid-cols-1 px-20 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-6">
                <div className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                    <Image
                        src="/car.jpg"
                        width={500}
                        height={400}
                        alt="Picture of the author"
                        className="w-[70%] rounded-2xl"
                    />
                    <div className="px-6 py-4 text-center">
                        <div className="font-bold text-xl mb-2">5th Annual Matchbox Car Race</div>
                        <p className="text-gray-100 text-semibold">
                            Join us for the 5th Annual Matchbox Car Race, a thrilling event where competitors from all ages showcase their custom-built cars. This year’s race promises exciting challenges, new categories, and an even bigger crowd. Whether you're a seasoned racer or a first-timer, the fun is sure to be unforgettable!
                            <br />
                            <strong>Event Date:</strong> December 20th, 2024
                            <br />
                            <strong>Location:</strong> Central Park Raceway, Downtown
                            <br />
                        </p>
                    </div>
                    <Link href="/tournament/manage/1" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843] focus:ring-4 focus:outline-none focus:ring-[#412a6e]">
                        Read more
                        <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
