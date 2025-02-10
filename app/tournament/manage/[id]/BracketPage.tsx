"use client";

import { useEffect, useState, useRef } from "react";
import {
  DBTournament,
  // DBTournamentPlayer,
  // DBMatch,
  SingleEliminationBracket,
  generateRandomPlayers,
} from "./types";

interface MatchDisplay {
  id: string;
  round: number;
  p1Name: string;
  p1Elo: number;
  p2Name: string;
  p2Elo: number;
  winner?: string; // "TBD" or player's name
}

interface PlayerWinCount {
  [playerId: number]: {
    name: string;
    wins: number;
    elo: number | undefined;
  };
}

export default function BracketPage() {
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [playerWins, setPlayerWins] = useState<PlayerWinCount>({});

  // Keep a bracket reference for ongoing operations
  const bracketRef = useRef<SingleEliminationBracket | null>(null);

  const runCoinTossForRound = (round: number) => {
    const bracket = bracketRef.current;
    if (!bracket) return;

    // gather matches for this round
    const roundMatches = bracket.matches.filter((m) => m.round === round);

    roundMatches.forEach((m) => {
      // Skip if there's already a winner
      if (m.winner) return;

      if (!m.player1) return;
      if (!m.player2) {
        // Automatic pass
        bracket.enterResult(m.id, m.player1.id);
        incrementWins(m.player1.id);
      } else {
        // coin toss
        const winnerId = m.player1.skills.ELO > m.player2.skills.ELO ? m.player1.id : m.player2.id;
        bracket.enterResult(m.id, winnerId);
        incrementWins(winnerId);
      }
    });
    refreshMatches();
  };

  useEffect(() => {
    const myTournament: DBTournament = {
      id: 1,
      created_at: new Date().toISOString(),
      name: "My Single-Elim Event",
      team_tournament: false,
      require_account: false,
      custom_rules: {},
      skill_fields: [],
      rules: [],
    };


    // Initialize bracket
    const singleElim = new SingleEliminationBracket(myTournament, generateRandomPlayers(20, myTournament.id));
    singleElim.seedPlayers();
    singleElim.generateBracket();
    bracketRef.current = singleElim;

    // Initialize playerWins tracking
    const initialWinCount: PlayerWinCount = {};
    singleElim.players.forEach((p) => {
      initialWinCount[p.id] = {
        name: p.player_name || `Player${p.id}`,
        wins: 0,
        elo: p.skills?.ELO ?? undefined,
      };
    });
    setPlayerWins(initialWinCount);

    // Simulate Round 1 with coin toss
    runCoinTossForRound(1);
  }, [runCoinTossForRound]);

  // Increments the player's win count
  const incrementWins = (playerId: number) => {
    setPlayerWins((prev) => {
      const prevData = prev[playerId];
      if (!prevData) return prev; // safety
      return {
        ...prev,
        [playerId]: {
          ...prevData,
          wins: prevData.wins + 1,
        },
      };
    });
  };

  // Refreshes the displayed matches array from bracket
  const refreshMatches = () => {
    const bracket = bracketRef.current;
    if (!bracket) return;
    const bracketMatches = bracket.matches;
    const matchDisplays: MatchDisplay[] = bracketMatches.map((m) => ({
      id: m.id,
      round: m.round,
      p1Name: m.player1?.player_name ?? "Bye",
      p1Elo: m.player1?.skills?.ELO ?? 0,
      p2Name: m.player2?.player_name ?? "Bye",
      p2Elo: m.player2?.skills?.ELO ?? 0,
      winner: m.winner ? m.winner.player_name : "TBD",
    }));
    setMatches(matchDisplays);
  };

  // Button: Move to next round
  const handleNextRound = () => {
    const bracket = bracketRef.current;
    if (!bracket) return;

    const newMatches = bracket.nextRound();
    if (newMatches.length === 0) {
      alert("No more rounds can be created. The event may be finished.");
      return;
    }

    // Auto-resolve them as well
    const nextRoundNum = newMatches[0].round;
    runCoinTossForRound(nextRoundNum);
  };

  // Helper to see if player is eliminated
  const isEliminated = (playerId: number) => {
    const bracket = bracketRef.current;
    if (!bracket) return false;
    return bracket.isEliminated(playerId);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Single Elimination Bracket</h2>

      <button onClick={handleNextRound} style={{ padding: "0.5rem", marginBottom: "1rem" }}>
        Next Round
      </button>

      {matches.map((m) => (
        <div key={m.id} style={{ margin: "0.5rem 0", border: "1px solid #ddd", padding: "0.5rem" }}>
          <strong>Match {m.id} (Round {m.round}):</strong>
          <div>
            {m.p1Name} (ELO: {m.p1Elo}) vs {m.p2Name} (ELO: {m.p2Elo})
          </div>
          <div>Winner: {m.winner}</div>
        </div>
      ))}

      <h3>Wins so far</h3>
      <ul>
        {Object.entries(playerWins)
          .sort(([, dataA], [, dataB]) => dataB.elo - dataA.elo)
          .map(([idStr, data]) => {
            const id = parseInt(idStr, 10);
            return (
              <li key={idStr}>
                {data.name} (ID {id}) ELO: {data.elo} — Wins: {data.wins}, Eliminated: {isEliminated(id) ? "Yes" : "No"}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
