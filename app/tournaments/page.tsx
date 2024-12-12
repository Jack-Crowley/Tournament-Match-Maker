import Image from "next/image"

export default function Home() {
    return (
        <div>
            <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-20">Ongoing Tournaments</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 px-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 p-6">
                <div className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                    <Image
                        src="/tmm_logo.png"
                        width={500}
                        height={400}
                        alt="Picture of the author"
                        className='w-[70%]'
                    />
                    <div className="px-6 py-4 text-center">
                        <div className="font-bold text-xl mb-2">The Coldest Sunset</div>
                        <p className="text-gray-100 text-semibold">
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quia, nulla! Maiores et perferendis eaque, exercitationem praesentium nihil.
                        </p>
                    </div>
                    <a href="#" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843] focus:ring-4 focus:outline-none focus:ring-[#412a6e]">
                        Read more
                        <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </a>
                </div>
            </div>
            <h1 className="text-[#7458da] font-bold text-3xl ml-20 mt-5">Previous Tournaments</h1>
            <div className="grid grid-cols-1 px-20 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-6">
                <div className="card bg-[#604BAC] border-r-8 p-4 border-[#816ad1] max-w-sm rounded overflow-hidden shadow-lg flex flex-col items-center">
                    <Image
                        src="/tmm_logo.png"
                        width={500}
                        height={400}
                        alt="Picture of the author"
                        className='w-[70%]'
                    />
                    <div className="px-6 py-4 text-center">
                        <div className="font-bold text-xl mb-2">The Coldest Sunset</div>
                        <p className="text-gray-100 text-semibold">
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quia, nulla! Maiores et perferendis eaque, exercitationem praesentium nihil.
                        </p>
                    </div>
                    <a href="#" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#382460] rounded-lg hover:bg-[#261843] focus:ring-4 focus:outline-none focus:ring-[#412a6e]">
                        Read more
                        <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    )
}
