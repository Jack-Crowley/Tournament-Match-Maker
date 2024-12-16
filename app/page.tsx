import Image from 'next/image'
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full justify-center">
      <div className="">
        <div className="grid grid-cols-2 min-h-[calc(100vh-160px)] w-full">
          <div className="bg-[#160A3A] flex items-center justify-center p-8">
            <div className="flex flex-col gap-2">
              {['Organize', 'Compete'].map((text) => (
                <h2
                  key={text}
                  className="text-7xl m-0 font-black uppercase tracking-wider bg-[#7864c0] bg-clip-text text-transparent"
                >
                  {text}
                </h2>
              ))}
              {['Win'].map((text) => (
                <h2
                  key={text}
                  className="text-7xl font-black uppercase tracking-wider bg-gradient-to-r from-[#ecd4f7] to-[#FF9CEE] bg-clip-text text-transparent"
                >
                  {text}
                </h2>
              ))}
              <Link href="/login">
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
                width={500}
                height={400}
                alt="Picture of the author"
                className='w-full h-full object-cover rounded-lg shadow-lg'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}