"use client"

import Image from "next/legacy/image"
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full justify-center">
      <div className="hidden md:grid sm:grid-cols-2 min-h-[calc(100vh-160px)] w-full">
        <div className="bg-[#160A3A] flex items-center justify-center p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-7xl m-0 font-black uppercase tracking-wider bg-[#7864c0] bg-clip-text text-transparent">
              Organize
            </h2>
            <h2 className="text-7xl m-0 font-black uppercase tracking-wider bg-[#7864c0] bg-clip-text text-transparent">
              Compete
            </h2>
            <h2 className="text-7xl font-black uppercase tracking-wider bg-gradient-to-r from-[#ecd4f7] to-[#FF9CEE] bg-clip-text text-transparent">
              Win
            </h2>
            <Link href='/tournaments'>
              <button className="mt-8 px-8 py-4 bg-[#604BAC] rounded-full text-[#160A3A] font-bold text-xl hover:opacity-90 transition-opacity w-fit">
                Get Started!
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#160A3A]">
          <div className="w-[60%] relative">
            <Image
              src="/tmm_logo.png"
              width={300}
              height={300}
              alt="Picture of the author"
              className='w-full h-full object-cover rounded-lg shadow-lg'
            />
          </div>
        </div>
      </div>


      <div className="block md:hidden sm:grid-cols-2 min-h-[calc(100vh-160px)] w-full mt-12">
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#160A3A]">
          <div className="w-[60%] relative flex items-center justify-center">
            <Image
              src="/tmm_logo.png"
              width={300}
              height={300}
              alt="Picture of the author"
              className='w-full h-full object-cover rounded-lg shadow-lg'
            />
          </div>
        </div>

        <div className="bg-[#160A3A] flex items-center justify-center p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-5xl text-center m-0 font-black uppercase tracking-wider bg-[#7864c0] bg-clip-text text-transparent">
              Organize
            </h2>
            <h2 className="text-5xl text-center m-0 font-black uppercase tracking-wider bg-[#7864c0] bg-clip-text text-transparent">
              Compete
            </h2>
            <h2 className="text-5xl text-center font-black uppercase tracking-wider bg-gradient-to-r from-[#ecd4f7] to-[#FF9CEE] bg-clip-text text-transparent">
              Win
            </h2>
            <Link href={'/tournaments'}>
              <button className="ml-[20%] width-[60%] mt-8 px-8 py-4 bg-[#604BAC] rounded-full text-[#160A3A] font-bold text-xl hover:opacity-90 transition-opacity w-fit">
                Get Started!
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}