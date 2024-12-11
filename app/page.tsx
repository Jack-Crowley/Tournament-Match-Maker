'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { NumberList } from '@/components/NumberList'
import { Controls } from '@/components/Controls'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function Home() {
  // pages/tournament.js
  return (
    <div className="min-h-screen bg-base-dark-purple text-white font-sans">
      {/* Navbar */}
      <nav className="bg-nav-bar-purple p-4 flex justify-between items-center">
        <div className="flex space-x-8">
          <a href="#" className="hover:underline">Home</a>
          <a href="#" className="hover:underline">Team</a>
          <a href="#" className="hover:underline">Tournaments</a>
          <a href="#" className="hover:underline">Rules</a>
        </div>
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
      </nav>

      {/* Content Section */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="col-span-1 bg-purple-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Announcements</h2>
          <ul className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <li
                key={i}
                className="bg-purple-700 rounded-lg p-3 flex items-center space-x-4"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  👤
                </div>
                <span>New Announcement!</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Players Section */}
        <PlayersSection />
      </div>
    </div>
  );
}

function PlayersSection() {
  const [activeTab, setActiveTab] = useState("Players");

  // Placeholder components for Standings and Messages
  const Standings = () => <p className="text-white">Standings!</p>;
  const Messages = () => <p className="text-white">Messages!</p>;

  return (
    <div className="col-span-2 bg-purple-800 rounded-lg p-4">
      <div className="flex space-x-4 mb-4 border-b border-purple-700">
        {[
          { name: "Players", component: "Players" },
          { name: "Standings", component: "Standings" },
          { name: "Messages", component: "Messages" },
        ].map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`py-2 px-4 text-white font-semibold border-b-2 ${activeTab === tab.name
                ? "border-white"
                : "border-transparent hover:border-purple-500"
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "Players" && (
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Players</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search"
                  className="p-2 rounded bg-purple-700 text-white placeholder-purple-300"
                />
                <select className="p-2 bg-purple-700 rounded text-white">
                  <option>Filters</option>
                </select>
              </div>
            </div>
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Skill/Rating</th>
                  <th className="px-4 py-2">Standing</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="bg-purple-700">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "Standings" && <Standings />}
        {activeTab === "Messages" && <Messages />}
      </div>
    </div>
  );
}


export default Home;