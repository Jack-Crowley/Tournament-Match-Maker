"use client";

import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faUsers, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { Footer } from "@/components/footer";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/legacy/image";


export default function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!data.session?.user?.is_anonymous);
    };

    checkUser();
  }, [supabase.auth]);
  

  return (
    <div className="min-h-screen bg-[#160A3A]">
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Elevate Your Game with <span className="text-[#7458da]">TMM Tournaments</span>
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                Join a vibrant community of players and fans with TMM. Create, manage, and host tournaments effortlessly while staying updated on all the action.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={isLoggedIn ? "/tournaments" : "/login"}
                  className="bg-[#7458da] hover:bg-[#604BAC] text-white px-8 py-3 rounded-lg transition-colors font-medium"
                >
                  {isLoggedIn ? "Tournaments" : "Sign Up"}
                </Link>
                <Link
                  href="/how-it-works"
                  className="border border-[#7458da] text-white hover:bg-[#2a1a66] px-8 py-3 rounded-lg transition-colors font-medium"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-12">
              <Image
                src={"/tmm_logo.png"}
                alt={`logo`}
                width={400}
                height={400}
                className="object-cover"
                priority
              />

            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#201644]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Discover Our Powerful Tournament Management Features!
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Our platform simplifies the tournament experience for everyone involved. From players to organizers, we provide tools for efficient management and streamlined operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faTrophy} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Create Tournaments Effortlessly
              </h3>
              <p className="text-gray-300">
                Launch your tournaments in minutes with our intuitive interface.
              </p>
              <Link href="/features" className="mt-4 inline-block text-[#7458da] hover:text-[#604BAC]">
                Learn More
              </Link>
            </div>

            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faUsers} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Manage Teams with Ease
              </h3>
              <p className="text-gray-300">
                Keep track of team rosters and performance effortlessly.
              </p>
              <Link href="/features" className="mt-4 inline-block text-[#7458da] hover:text-[#604BAC]">
                Learn More
              </Link>
            </div>

            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Track Matches in Real-Time
              </h3>
              <p className="text-gray-300">
                Stay updated with live event and match statistics updates.
              </p>
              <Link href="/features" className="mt-4 inline-block text-[#7458da] hover:text-[#604BAC]">
                Learn More
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href={isLoggedIn ? "/tournaments" : "/join"}
              className="bg-[#7458da] hover:bg-[#604BAC] text-white px-8 py-3 rounded-lg transition-colors font-medium inline-block mx-2"
            >
              {isLoggedIn ? "Tournaments" : "Sign Up"}
            </Link>
            <Link
              href="/features"
              className="border border-[#7458da] text-white hover:bg-[#2a1a66] px-8 py-3 rounded-lg transition-colors font-medium inline-block mx-2"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Creating and Managing Tournaments Made Easy
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Our platform simplifies the tournament process for everyone involved, from setup to execution, we guide you every step of the way.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="bg-gray-200 rounded-lg w-full aspect-video mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Step 1: Sign Up for an Account
              </h3>
              <p className="text-gray-300">
                Create your free account to get started.
              </p>
            </div>

            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="bg-gray-200 rounded-lg w-full aspect-video mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Step 2: Create Your Tournament
              </h3>
              <p className="text-gray-300">
                Define all your tournament details and format.
              </p>
            </div>

            <div className="bg-[#2a1a66] p-6 rounded-lg">
              <div className="bg-gray-200 rounded-lg w-full aspect-video mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Step 3: Invite Participants and Manage
              </h3>
              <p className="text-gray-300">
                Invite players and keep track of their progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#2a1a66] rounded-lg p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Join the Tournament Revolution
                </h2>
                <p className="text-gray-300 mb-6">
                  Sign up today to create and manage your own tournaments with ease and efficiency!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={isLoggedIn ? "/tournaments" : "/join"}
                    className="bg-[#7458da] hover:bg-[#604BAC] text-white px-8 py-3 rounded-lg transition-colors font-medium inline-block mx-2"
                  >
                    {isLoggedIn ? "Tournaments" : "Sign Up"}
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="border border-[#7458da] text-white hover:bg-[#2a1a66] px-6 py-3 rounded-lg transition-colors font-medium"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="md:w-1/3">
                <div className="bg-gray-200 rounded-lg w-full aspect-square flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
