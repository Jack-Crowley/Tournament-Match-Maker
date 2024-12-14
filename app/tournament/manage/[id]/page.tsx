'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Bracket, IRoundProps, Seed, SeedItem, SeedTeam, IRenderSeedProps } from 'react-brackets';

type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

// Simulating fetching data
const announcements = [
  { id: 1, title: 'New update on tournament rules!', user: 'Admin' },
  { id: 2, title: 'Match times updated', user: 'Admin' },
  { id: 3, title: 'Join the Discord server for updates!', user: 'Admin' },
  { id: 4, title: 'Sign up deadline approaching!', user: 'Admin' }
];

const messages = [
  { id: 0, role:"TD", user: 'TD: Stacy Keith', text: 'Sorry, we are locked on a tight schedule. Be there or forfeit.' },
  { id: 1, role:"player", user: 'Stephanie Owen', text: 'Can we reschedule my match?' },
  { id: 2, role:"player", user: 'Johnathon Casey', text: 'Ready for my next round!' },
  { id: 3, role:"player", user: 'Dion Powers', text: 'Need more info about the rules.' },
  { id: 4, role:"player", user: 'Stephanie Owen', text: 'When is the next update?' },
  { id: 5, role:"player", user: 'Sasha Mcmillan', text: 'Excited for the tournament!' }
];

const playersList = [
  { id: 1, name: 'Jolene Rose', skill: 'Expert', standing: 3 },
  { id: 2, name: 'Stephanie Owen', skill: 'Advanced', standing: 5 },
  { id: 3, name: 'Shelia Lynn', skill: 'Intermediate', standing: 5 },
  { id: 4, name: 'Sasha Mcmillan', skill: 'Advanced', standing: 3 },
  { id: 5, name: 'Roscoe Rodriguez', skill: 'Beginner', standing: 3 },
  { id: 6, name: 'Johnathon Casey', skill: 'Expert', standing: 5 },
  { id: 7, name: 'Lauren Greene', skill: 'Intermediate', standing: 1 },
  { id: 8, name: 'Dion Powers', skill: 'Beginner', standing: 5 }
];
const rounds = [
  {
    title: 'Round one',
    seeds: [
      { id: 1, date: '2024-12-13', teams: [{ name: 'Jolene Rose' }, { name: 'Stephanie Owen' }] },
      { id: 2, date: '2024-12-13', teams: [{ name: 'Shelia Lynn' }, { name: 'Sasha Mcmillan' }] },
      { id: 3, date: '2024-12-13', teams: [{ name: 'Roscoe Rodriguez' }, { name: 'Johnathon Casey' }] },
      { id: 4, date: '2024-12-13', teams: [{ name: 'Lauren Greene' }, { name: 'Dion Powers' }] }
    ]
  },
  {
    title: 'Round two',
    seeds: [
      { id: 5, date: '2024-12-14', teams: [{ name: 'Jolene Rose' }, { name: 'Sasha Mcmillan' }] },
      { id: 6, date: '2024-12-14', teams: [{ name: 'Roscoe Rodriguez' }, { name: 'Lauren Greene' }] }
    ]
  },
  {
    title: 'Round three',
    seeds: [
      { id: 8, date: '2024-12-21', teams: [{ name: '' }, { name: 'Lauren Greene' }] },
    ]
  }
];

const getWinner = (seed: { teams: { name: string }[] }, index: number) => {
  // Ensure Player 7 wins in the match where they are involved
  if (seed.teams[0].name === 'Lauren Greene' || seed.teams[1].name === 'Lauren Greene') {
    return { name: 'Lauren Greene' };
  }

  if (seed.teams[0].name === 'Jolene Rose' && seed.teams[1].name === 'Sasha Mcmillan') {
    return { name: 'Noone' };
  }
  
  // Alternate the winner between first and second team for other matches
  return index % 2 === 0 ? seed.teams[0] : seed.teams[1];
};

// Custom seed component for displaying teams
const CustomSeed = ({ seed, breakpoint, roundIndex, seedIndex }: IRenderSeedProps) => {
  // Get the winner from the seed based on the index
  const winner = getWinner(seed, seedIndex);

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 17 }}>
      <SeedItem>
        <div>
          <SeedTeam style={{ color: winner?.name === seed.teams[0]?.name || (seed.teams[0]?.name == "Jolene Rose" && seed.teams[1]?.name == "Sasha Mcmillan") ? 'white' : '#aaaaaa' }}>
            {seed.teams[0]?.name || 'NO TEAM'}
          </SeedTeam>
          <SeedTeam style={{ color: winner?.name === seed.teams[1]?.name || (seed.teams[0]?.name == "Jolene Rose" && seed.teams[1]?.name == "Sasha Mcmillan") ? 'white' : '#aaaaaa' }}>
            {seed.teams[1]?.name || 'NO TEAM'}
          </SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
};

const Standings = () => {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Bracket
        rounds={rounds}
        renderSeedComponent={CustomSeed}
        roundTitleComponent={(title: React.ReactNode, roundIndex: number) => (
          <div style={{ textAlign: 'center', color: 'white' }}>{title}</div>
        )}
      />
    </div>
  );
};

// Messages component
function Messages(): JSX.Element {
  return (
    <div className="text-white">
      <h2 className="text-lg font-semibold mb-4">Messages</h2>
      <div className="bg-[#604BAC] p-4 rounded-lg space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="p-3 bg-[#7e67d2] rounded-lg">
            <p className={`font-semibold ${message.role == "TD" ? "text-[#dddd4c]" : ""} font-bold`}>{message.user}</p>
            <p className="text-sm">{message.text}</p>
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
    <div className="flex space-x-4 mb-4 border-b border-[#7e67d2]">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => setActiveTab(tab.name)}
          className={`py-2 px-4 text-white font-semibold border-b-2 ${activeTab === tab.name
            ? "border-white"
            : "border-transparent hover:border-[#7e67d2]"}`
          }
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
            className="p-2 rounded bg-[#7e67d2] text-white placeholder-purple-300"
          />
          <select className="p-2 bg-[#7e67d2] rounded text-white">
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
          {playersList.map((player) => (
            <tr key={player.id} className="bg-[#7e67d2]">
              <td className="px-4 py-2">{player.name}</td>
              <td className="px-4 py-2">{player.skill}</td>
              <td className="px-4 py-2">{player.standing}</td>
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
    <div className="col-span-2 bg-[#604BAC] rounded-lg p-4">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div>
        {activeTab === "Players" && <Players />}
        {activeTab === "Standings" && <Standings />}
        {activeTab === "Messages" && <Messages />}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="">
      {/* Content Section */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="col-span-1 bg-[#604BAC] rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Announcements</h2>
          <ul className="space-y-4">
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className="bg-[#7e67d2] rounded-lg p-3 flex items-center space-x-4"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-white w-6 h-6" />
                </div>
                <span>{announcement.title}</span>
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
