"use client"

import { useEffect, useRef, useState } from "react";
import { Bracket, BracketPlayer, Matchup } from "@/types/bracketTypes";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons/faUserPlus";
import { addPlayerToMatchupFromWaitlist } from "@/utils/bracket/bracket";
import { Tournament } from "@/types/tournamentTypes";
import { useMessage } from "@/context/messageContext";

const AddPlayerButton = ({ onClose }: { onClose: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="bg-[#947ed7] hover:bg-[#af9ce7] transition-colors transition-200"
      onClick={onClose}
      style={{
        padding: '10px 20px',
        color: 'white',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <FontAwesomeIcon icon={faUserPlus} />
      Add Player
    </motion.div>
  );
};

const MatchupElement = ({
  match,
  newPlayer,
  tournament,
  onClose,
}: {
  match: Matchup;
  newPlayer: BracketPlayer;
  tournament: Tournament;
  onClose: () => void;
}) => {
  const {triggerMessage} = useMessage()

  const addPlayer = async (index: number) => {
    const { success, errorCode } = await addPlayerToMatchupFromWaitlist(tournament, match.match_number, match.round, newPlayer, index);

    if (success) {
      triggerMessage("Player added successfully!", "green");
      onClose();
    } else {
      triggerMessage(`Failed to add player. Error code: ${errorCode}`, "red");
    }
  }

  return (
    <div className={`flex justify-center items-center flex-shrink-0`}>
      <motion.div
        className="w-40 bg-secondary rounded-lg shadow-lg overflow-hidden z-10 hover:cursor-pointer"
        transition={{ type: "spring", stiffness: 300 }}
      >
        {match.players.map((player, index) => (
          <div key={index} className={`${match.winner && (player.uuid == match.winner ? "bg-[#98979b10]" : "bg-[#120b2942]")}`}>
            {player.name ? (
              <div className={`z-5 p-4 font-bold border-l-8 ${match.winner ? player.uuid == match.winner ? "border-[#baa6f6] text-[#baa6f6]" : `border-[#1e153e] ${player.name ? "text-[#271c4e]" : "text-[#120b2900]"}` : "border-soft text-[#2e225b]"} bg-opacity-90 hover:bg-opacity-100 transition-all ${player.name == "" && "text-secondary"}`}>
                {player.name ? player.name : "Placeholder"}
              </div>
            ) : (
              <AddPlayerButton onClose={() => addPlayer(index)} />
            )}


            {index !== match.players.length - 1 && (
              <div className="h-px bg-primary opacity-50"></div>
            )}
          </div>

        ))}

      </motion.div>
    </div>
  )
};

const BracketCreator = ({
  roundIndex,
  matchIndex,
  bracket,
  newPlayer,
  tournament,
  onClose,
}: {
  roundIndex: number;
  matchIndex: number;
  bracket: Bracket;
  newPlayer: BracketPlayer;
  tournament: Tournament;
  onClose: () => void;
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const heightOffset = (bracket.rounds.length - roundIndex - 1) * 7;

  useEffect(() => {
    if (elementRef.current) {
      setBox(elementRef.current.getBoundingClientRect());
    }
  }, []);

  return (
    <div>
      {roundIndex == 0 ? (
        <MatchupElement
          match={bracket.rounds[roundIndex].matches[matchIndex]} newPlayer={newPlayer}
          onClose={onClose}
          tournament={tournament}
        />
      ) : (
        <div className="flex">
          <div
            className="flex-shrink-0 mb-4 relative min-h-72 w-fit grid grid-rows-2 space-y-2 mr-[6rem]"
            ref={elementRef}
          >
            <BracketCreator
              matchIndex={matchIndex * 2}
              roundIndex={roundIndex - 1}
              bracket={bracket}
              newPlayer={newPlayer}
              onClose={onClose}
              tournament={tournament}
            />
            <BracketCreator
              matchIndex={matchIndex * 2 + 1}
              roundIndex={roundIndex - 1}
              bracket={bracket}
              newPlayer={newPlayer}
              onClose={onClose}
              tournament={tournament}
            />
            {box && (
              <div>
                <div
                  className="absolute bg-primary w-[2px]"
                  style={{
                    top: `${box.height / 4 - heightOffset}px`,
                    left: `${box.width + 48}px`,
                    height: `${box.height / 2 + 2}px`,
                  }}
                ></div>

                <div
                  className="absolute bg-primary h-[2px]"
                  style={{
                    top: `${box.height / 4 - 1 - heightOffset}px`,
                    left: `${box.width}px`,
                    width: `3rem`,
                  }}
                ></div>

                <div
                  className="absolute bg-primary h-[2px]"
                  style={{
                    top: `${box.height / 4 * 3 - heightOffset}px`,
                    left: `${box.width}px`,
                    width: `3rem`,
                  }}
                ></div>

                <div
                  className="absolute bg-primary h-[2px]"
                  style={{
                    top: `${box.height / 2 + 5}px`,
                    left: `${box.width + 48}px`,
                    width: `3rem`,
                  }}
                ></div>
              </div>
            )}
          </div>
          <MatchupElement
            match={bracket.rounds[roundIndex].matches[matchIndex]}
            newPlayer={newPlayer}
            onClose={onClose}
            tournament={tournament}
          />
        </div>
      )}
    </div>
  );
};

const TournamentBracketWithAddingPlayer = ({ bracket, tournament, newPlayer, onClose }: { tournament: Tournament, bracket: Bracket, newPlayer: BracketPlayer, onClose: () => void }) => {
  return (
    <div className="mt-[50px] ml-[8%] h-[89vh]">
      {bracket.rounds.length > 0 && (
        <BracketCreator
          roundIndex={bracket.rounds.length - 1}
          matchIndex={0}
          bracket={bracket}
          newPlayer={newPlayer}
          onClose={onClose}
          tournament={tournament}
        />
      )}
    </div>
  );
};

export default TournamentBracketWithAddingPlayer;