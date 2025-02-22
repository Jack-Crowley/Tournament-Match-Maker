"use client"

import TournamentBracket from "@/components/tournamentViews/single/bracketView";
import { Bracket } from "@/types/bracketTypes";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faList, faBullhorn, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const NAV_ITEMS = [
  { key: "Bracket", icon: faTrophy },
  { key: "Waitlist", icon: faList },
  { key: "Announcements", icon: faBullhorn },
  { key: "Messages", icon: faEnvelope },
];

const SideNavbar = () => {
  const [activeTab, setActiveTab] = useState("Bracket");

  return (
    <div className="fixed top-1/2 transform -translate-y-1/2 w-[8%] z-20 flex items-center justify-center">
      <nav className="z-20 bg-deep p-3 flex w-fit shadow-lg rounded-full flex-col gap-2 border border-soft">
        {NAV_ITEMS.map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative group text-2xl w-12 h-12 flex justify-center items-center transition-all rounded-full ${activeTab === key ? "bg-primary text-white" : "text-soft hover:bg-highlight hover:text-white"}`}
          >
            <FontAwesomeIcon icon={icon} />
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 bg-accent text-white text-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">{key}</span>
          </button>
        ))}
      </nav>
    </div>

  );
}

const myBracket: Bracket = {
  "rounds": [
    {
      "matches": [
        { "matchId": 1, "player1": { "uuid": "1", "name": "Player 1", "email": "player1@example.com", "score":5 }, "player2": { "uuid": "2", "name": "Player 2", "email": "player2@example.com" }, "scores": { "1": 5, "2": 3 }, "winner": "1" },
        { "matchId": 2, "player1": { "uuid": "3", "name": "Player 3", "email": "player3@example.com" }, "player2": { "uuid": "4", "name": "Player 4", "email": "player4@example.com" }, "scores": { "3": 6, "4": 4 }, "winner": "3" },
        { "matchId": 3, "player1": { "uuid": "5", "name": "Player 5", "email": "player5@example.com" }, "player2": { "uuid": "6", "name": "Player 6", "email": "player6@example.com" }, "scores": { "5": 7, "6": 2 }, "winner": "5" },
        { "matchId": 4, "player1": { "uuid": "7", "name": "Player 7", "email": "player7@example.com" }, "player2": { "uuid": "8", "name": "Player 8", "email": "player8@example.com" }, "scores": { "7": 4, "8": 5 }, "winner": "8" },
        { "matchId": 5, "player1": { "uuid": "9", "name": "Player 9", "email": "player9@example.com" }, "player2": { "uuid": "10", "name": "Player 10", "email": "player10@example.com" }, "scores": { "9": 3, "10": 6 }, "winner": "10" },
        { "matchId": 6, "player1": { "uuid": "11", "name": "Player 11", "email": "player11@example.com" }, "player2": { "uuid": "12", "name": "Player 12", "email": "player12@example.com" }, "scores": { "11": 8, "12": 7 }, "winner": "11" },
        { "matchId": 7, "player1": { "uuid": "13", "name": "Player 13", "email": "player13@example.com" }, "player2": { "uuid": "14", "name": "Player 14", "email": "player14@example.com" }, "scores": { "13": 2, "14": 6 }, "winner": "14" },
        { "matchId": 8, "player1": { "uuid": "15", "name": "Player 15", "email": "player15@example.com" }, "player2": { "uuid": "16", "name": "Player 16", "email": "player16@example.com" }, "scores": { "15": 7, "16": 5 }, "winner": "15" },
        { "matchId": 9, "player1": { "uuid": "17", "name": "Player 17", "email": "player17@example.com" }, "player2": { "uuid": "18", "name": "Player 18", "email": "player18@example.com" }, "scores": { "17": 6, "18": 4 }, "winner": "17" },
        { "matchId": 10, "player1": { "uuid": "19", "name": "Player 19", "email": "player19@example.com" }, "player2": { "uuid": "20", "name": "Player 20", "email": "player20@example.com" }, "scores": { "19": 5, "20": 3 }, "winner": "19" },
        { "matchId": 11, "player1": { "uuid": "21", "name": "Player 21", "email": "player21@example.com" }, "player2": { "uuid": "22", "name": "Player 22", "email": "player22@example.com" }, "scores": { "21": 6, "22": 2 }, "winner": "21" },
        { "matchId": 12, "player1": { "uuid": "23", "name": "Player 23", "email": "player23@example.com" }, "player2": { "uuid": "24", "name": "Player 24", "email": "player24@example.com" }, "scores": { "23": 8, "24": 6 }, "winner": "23" },
        { "matchId": 13, "player1": { "uuid": "25", "name": "Player 25", "email": "player25@example.com" }, "player2": { "uuid": "26", "name": "Player 26", "email": "player26@example.com" }, "scores": { "25": 7, "26": 5 }, "winner": "25" },
        { "matchId": 14, "player1": { "uuid": "27", "name": "Player 27", "email": "player27@example.com" }, "player2": { "uuid": "28", "name": "Player 28", "email": "player28@example.com" }, "scores": { "27": 6, "28": 3 }, "winner": "27" },
        { "matchId": 15, "player1": { "uuid": "29", "name": "Player 29", "email": "player29@example.com" }, "player2": { "uuid": "30", "name": "Player 30", "email": "player30@example.com" }, "scores": { "29": 4, "30": 6 }, "winner": "30" },
        { "matchId": 16, "player1": { "uuid": "31", "name": "Player 31", "email": "player31@example.com" }, "player2": { "uuid": "32", "name": "Player 32", "email": "player32@example.com" }, "scores": { "31": 3, "32": 7 }, "winner": "32" }
      ]
    },
    {
      "matches": [
        { "matchId": 17, "player1": { "uuid": "1", "name": "Player 1", "email": "player1@example.com" }, "player2": { "uuid": "3", "name": "Player 3", "email": "player3@example.com" }, "scores": { "1": 5, "3": 4 }, "winner": "1" },
        { "matchId": 18, "player1": { "uuid": "5", "name": "Player 5", "email": "player5@example.com" }, "player2": { "uuid": "8", "name": "Player 8", "email": "player8@example.com" }, "scores": { "5": 7, "8": 5 }, "winner": "5" },
        { "matchId": 19, "player1": { "uuid": "10", "name": "Player 10", "email": "player10@example.com" }, "player2": { "uuid": "11", "name": "Player 11", "email": "player11@example.com" }, "scores": { "10": 6, "11": 4 }, "winner": "10" },
        { "matchId": 20, "player1": { "uuid": "14", "name": "Player 14", "email": "player14@example.com" }, "player2": { "uuid": "15", "name": "Player 15", "email": "player15@example.com" }, "scores": { "14": 3, "15": 7 }, "winner": "15" },
        { "matchId": 21, "player1": { "uuid": "17", "name": "Player 17", "email": "player17@example.com" }, "player2": { "uuid": "19", "name": "Player 19", "email": "player19@example.com" }, "scores": { "17": 6, "19": 4 }, "winner": "17" },
        { "matchId": 22, "player1": { "uuid": "21", "name": "Player 21", "email": "player21@example.com" }, "player2": { "uuid": "23", "name": "Player 23", "email": "player23@example.com" }, "scores": { "21": 5, "23": 3 }, "winner": "21" },
        { "matchId": 23, "player1": { "uuid": "25", "name": "Player 25", "email": "player25@example.com" }, "player2": { "uuid": "27", "name": "Player 27", "email": "player27@example.com" }, "scores": { "25": 4, "27": 5 }, "winner": "27" },
        { "matchId": 24, "player1": { "uuid": "30", "name": "Player 30", "email": "player30@example.com" }, "player2": { "uuid": "32", "name": "Player 32", "email": "player32@example.com" }, "scores": { "30": 3, "32": 6 }, "winner": "32" }
      ]
    },
    {
      "matches": [
        { "matchId": 25, "player1": { "uuid": "1", "name": "Player 1", "email": "player1@example.com" }, "player2": { "uuid": "5", "name": "Player 5", "email": "player5@example.com" }, "scores": { "1": 6, "5": 4 }, "winner": "1" },
        { "matchId": 26, "player1": { "uuid": "17", "name": "Player 17", "email": "player17@example.com" }, "player2": { "uuid": "21", "name": "Player 21", "email": "player21@example.com" }, "scores": { "17": 5, "21": 6 }, "winner": "21" },
        { "matchId": 27, "player1": { "uuid": "27", "name": "Player 27", "email": "player27@example.com" }, "player2": { "uuid": "32", "name": "Player 32", "email": "player32@example.com" }, "scores": { "27": 4, "32": 7 }, "winner": "32" }
      ]
    },
    {
      "matches": [
        { "matchId": 28, "player1": { "uuid": "1", "name": "Player 1", "email": "player1@example.com" }, "player2": { "uuid": "21", "name": "Player 21", "email": "player21@example.com" }, "scores": { "1": 6, "21": 5 }, "winner": "1" }
      ]
    }
  ]
}

export default function Home() {
  const bracket = myBracket;
  return (
    <div className="relative">
      <SideNavbar />
      <TournamentBracket bracket={bracket} />
    </div>
  )
}