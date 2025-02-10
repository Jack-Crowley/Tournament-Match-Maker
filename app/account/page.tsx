"use client"

import Image from "next/legacy/image";
import Link from 'next/link';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { SignUpToProceedScreen } from "@/components/sign-up-anonymous";
import { useClient } from "@/context/clientContext";
import { SpinningLoader } from "@/components/loading";

export default function Account() {
  const supabase = createClient()
  const client = useClient()
  const [name, setName] = useState(null)
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState<boolean>(true)
  const [anonymous, setAnonymous] = useState<boolean>(false)

  useEffect(() => {
    async function load() {
      let anony = client.session?.user.is_anonymous

      if (!anony) {
        anony = false;
      };

      setAnonymous(anony)

      if (!anony) {
        setName((await supabase.auth.getUser()).data.user?.user_metadata.name)
        setEmail((await supabase.auth.getUser()).data.user?.user_metadata.email)
      }

      setLoading(false)

      return;
    }

    load()
  })

  return (
    <div className="w-full justify-center">
      {loading ? (
        <SpinningLoader />
      ) : (
        <div>
          {anonymous ? (
            <SignUpToProceedScreen />
          ) : (
            <div className="">
              <div className="grid grid-cols-2 min-h-[calc(100vh-160px)] w-full">
                {/* Left Section: User Info */}
                <div className="bg-[#160A3A] flex items-center justify-center p-8">
                  <div className="flex flex-col gap-4">
                    <Image
                      src="/lego.jpg"
                      width={150}
                      height={150}
                      alt="User Avatar"
                      className="w-36 h-36 object-cover rounded-full border-4 border-[#604BAC] shadow-lg"
                    />
                    <h2 className="text-4xl font-black text-white uppercase tracking-wide">
                      {name ?? "Loading"}
                    </h2>
                    <p className="text-lg text-[#ecd4f7]">Joined: January 2024</p>
                    <p className="text-lg text-[#ecd4f7]">{email}</p>
                    <p className="text-lg text-[#FF9CEE]">Location: New York, USA</p>
                    <Link href="/account/edit">
                      <button className="mt-4 px-6 py-3 bg-[#604BAC] rounded-full text-[#160A3A] font-bold text-lg hover:opacity-90 transition-opacity w-fit">
                        Edit Profile
                      </button>
                    </Link>
                    <Link href="/api/auth/signout" className="mt-4 px-6 py-3 bg-[#b36969] rounded-full text-[#160A3A] font-bold text-lg hover:opacity-90 transition-opacity w-fit" prefetch={false}>Log Out</Link>
                  </div>
                </div>

                {/* Right Section: Statistics */}
                <div className="bg-[#160A3A] flex flex-col items-center justify-center p-8 text-white">
                  <h2 className="text-3xl font-bold uppercase mb-8">Your Stats</h2>
                  <div className="grid grid-cols-2 gap-8 text-center w-full max-w-lg">
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                      <h3 className="text-2xl font-bold">Tournaments Created</h3>
                      <p className="text-5xl font-black mt-4">3</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                      <h3 className="text-2xl font-bold">Tournaments Joined</h3>
                      <p className="text-5xl font-black mt-4">8</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                      <h3 className="text-2xl font-bold">Games Played</h3>
                      <p className="text-5xl font-black mt-4">24</p>
                    </div>
                    <div className="p-6 bg-[#604BAC] rounded-lg shadow-lg">
                      <h3 className="text-2xl font-bold">Games Won</h3>
                      <p className="text-5xl font-black mt-4">10</p>
                    </div>
                  </div>
                  <Link href="/tournaments">
                    <button className="mt-8 px-8 py-4 bg-[#ECD4F7] rounded-full text-[#160A3A] font-bold text-xl hover:opacity-90 transition-opacity">
                      View Tournaments
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
