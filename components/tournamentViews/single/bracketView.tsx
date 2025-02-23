"use client"

import { useEffect, useRef, useState } from "react";
import { Bracket, Matchup } from "@/types/bracketTypes";
import { MatchupModal } from "@/components/modals/displayMatchup";
import { motion } from "framer-motion";

const MatchupElement = ({
  match,
}: {
  match: Matchup;
}) => {
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);

  function openModal() {
    if (match.players.some(player => player.name)) {
      setIsMatchupModalOpen(true)
    }
  }

  return (
    <div className={`flex justify-center items-center flex-shrink-0`}>
      <motion.div
        className="w-40 bg-secondary rounded-lg shadow-lg overflow-hidden z-10 hover:cursor-pointer"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={openModal}
      >
          {match.players.map((player, index) => (
            <div key={index}>
              <div className={`z-5 p-4 font-bold border-l-8 ${match.winner ? player.uuid == match.winner ? "border-primary text-primary" : "border-deep text-deep" : "border-soft text-deep"} bg-opacity-90 hover:bg-opacity-100 transition-all ${player.name == "" && "text-secondary"}`}>
                {player.name ? player.name : "Placeholder"}
              </div>

              {index !== match.players.length - 1 && (
                <div className="h-px bg-primary opacity-50"></div>
              )}
            </div>

          ))}

      </motion.div>
      <MatchupModal matchup={match} isOpen={isMatchupModalOpen} setOpen={setIsMatchupModalOpen} />

    </div>
  )
};

const BracketCreator = ({
  roundIndex,
  matchIndex,
  bracket,
}: {
  roundIndex: number;
  matchIndex: number;
  bracket: Bracket;
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
          match={bracket.rounds[roundIndex].matches[matchIndex]}
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
            />
            <BracketCreator
              matchIndex={matchIndex * 2 + 1}
              roundIndex={roundIndex - 1}
              bracket={bracket}
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
          />
        </div>
      )}
    </div>
  );
};

const TournamentBracket = ({ bracket }: { bracket: Bracket }) => {
  return (
    <div className="mt-[50px] ml-[8%] h-[89vh]">
      {bracket.rounds.length > 0 && (
        <BracketCreator
          roundIndex={bracket.rounds.length - 1}
          matchIndex={0}
          bracket={bracket}
        />
      )}
    </div>
  );
};

export default TournamentBracket;