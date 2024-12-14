'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

// const supabase = createClient<Database>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

function Home() {
  // pages/tournament.js
  return (
    <div className="">

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
        <InfoSection />
      </div>
    </div>
  );
}

// Type definitions for props
type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

import { Bracket, IRoundProps, Seed, SeedItem, SeedTeam, IRenderSeedProps } from 'react-brackets';

const rounds: IRoundProps[] = [
  {
    title: 'Round one',
    seeds: [
      {
        id: 1,
        date: new Date().toDateString(),
        teams: [{ name: 'Team A' }, { name: 'Team B' }],
      },
      {
        id: 2,
        date: new Date().toDateString(),
        teams: [{ name: 'Team C' }, { name: 'Team D' }],
      },
    ],
  },
  {
    title: 'Round two',
    seeds: [
      {
        id: 3,
        date: new Date().toDateString(),
        teams: [{ name: 'Team A' }, { name: 'Team C' }],
      },
    ],
  },
];

const CustomSeed = ({ seed, breakpoint, roundIndex, seedIndex }: IRenderSeedProps) => {
  // breakpoint passed to Bracket component
  // to check if mobile view is triggered or not

  // mobileBreakpoint is required to be passed down to a seed
  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 17 }}>
      <SeedItem>
        <div>
          <SeedTeam style={{ color: '#DADADA' }}>{seed.teams[0]?.name || 'NO TEAM '}</SeedTeam>
          <SeedTeam>{seed.teams[1]?.name || 'NO TEAM '}</SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
};

const Standings = () => {
  return <Bracket rounds={rounds} renderSeedComponent={CustomSeed} 
  roundTitleComponent={(title: React.ReactNode, roundIndex: number) => {
    return <div style={{ textAlign: 'center', color: 'white' }}>{title}</div>;
  }} 
  
  />;
};


// Messages component
function Messages(): JSX.Element {
  return (
    <div className="text-white">
      <h2 className="text-lg font-semibold mb-4">Messages</h2>
      <div className="bg-purple-700 p-4 rounded-lg space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 bg-purple-800 rounded-lg">
            <p className="font-semibold">User {i + 1}</p>
            <p className="text-purple-300 text-sm">This is a placeholder message.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tabs component
function Tabs({ activeTab, setActiveTab }: TabsProps): JSX.Element {
  const tabs = [
    { name: "Players" },
    { name: "Standings" },
    { name: "Messages" },
  ];

  return (
    <div className="flex space-x-4 mb-4 border-b border-purple-700">
      {tabs.map((tab) => (
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
  );
}



const Players: React.FC = () => {
  return (
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
  );
};

const InfoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Players");

  return (
    <div className="col-span-2 bg-purple-800 rounded-lg p-4">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div>
        {activeTab === "Players" && <Players />}
        {activeTab === "Standings" && <Standings />}
        {activeTab === "Messages" && <Messages />}
      </div>
    </div>
  );
};



export default Home;
