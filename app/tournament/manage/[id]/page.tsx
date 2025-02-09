'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import Messages from './messages';
import BracketPage from './BracketPage';

type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

// Simulating fetching data
const announcements = [
  { id: 1, title: 'New update on tournament rules!', user: 'Admin' },
  { id: 2, title: 'Match times updated', user: 'Admin' },
  { id: 3, title: 'Come to the table by the rear door to check in once you arrive!', user: 'Admin' },
  { id: 4, title: 'Sign up deadline approaching!', user: 'Admin' }
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
        {activeTab === "Standings" && <BracketPage />}
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
