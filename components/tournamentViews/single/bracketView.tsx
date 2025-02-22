"use client"

import { useEffect, useRef, useState } from "react";
import { Bracket } from "@/types/bracketTypes";
import { motion } from "framer-motion";

const MatchupElement = ({ round, match, bracket }: { round: number, match: number, bracket: Bracket }) => {
  const matchup = bracket.rounds[round].matches[match];

  return (
    <div className={`flex justify-center items-center flex-shrink-0 z-10`}>
      <motion.div
        className="w-40 bg-secondary rounded-lg shadow-lg overflow-hidden z-10 hover:cursor-pointer"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex justify-between items-center z-5 p-4 font-bold text-deep border-l-8 border-deep bg-opacity-90 hover:bg-opacity-100 transition-all">
          <span>{matchup.player1.name}</span>
          {matchup.player1.score && (
            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">
              {matchup.player1.score}
            </div>
          )}

        </div>
        <div className="h-px bg-primary opacity-50"></div>
        <div className="flex justify-between items-center z-5 p-4 font-bold text-primary border-l-8 border-primary bg-opacity-90 hover:bg-opacity-100 transition-all">
          <span>{matchup.player2.name}</span>
          {matchup.player2.score && (
            <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-sm">
              {matchup.player2.score}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const BracketCreator = ({ roundIndex, matchIndex, bracket }: { roundIndex: number, matchIndex: number, bracket: Bracket }) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const heightOffset = (bracket.rounds.length - roundIndex - 1) * 7;

  useEffect(() => {
    if (elementRef.current) {
      setBox(elementRef.current.getBoundingClientRect());
    }
  }, [elementRef.current]);

  return (
    <div>
      {roundIndex == 0 ? (
        <MatchupElement match={matchIndex} round={roundIndex} bracket={bracket} />
      ) : (
        <div className="flex">
          <div className="flex-shrink-0 mb-4 relative min-h-72 w-fit grid grid-rows-2 space-y-2 mr-[6rem]" ref={elementRef}>
            <BracketCreator matchIndex={matchIndex * 2} roundIndex={roundIndex - 1} bracket={bracket} />
            <BracketCreator matchIndex={matchIndex * 2 + 1} roundIndex={roundIndex - 1} bracket={bracket} />
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
          <MatchupElement match={matchIndex} round={roundIndex} bracket={bracket} />
        </div>
      )}
    </div>
  );
};

const TournamentBracket = ({ bracket }: { bracket: Bracket }) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const lastRound = bracket.rounds[bracket.rounds.length - 1];
  const lastMatch = lastRound.matches[lastRound.matches.length - 1];

  useEffect(() => {
    if (elementRef.current) {
      setBox(elementRef.current.getBoundingClientRect());
    }
  }, [elementRef.current]);

  return (
    <div className="mt-[50px] ml-[8%] h-[89vh]">
      <BracketCreator roundIndex={bracket.rounds.length - 1} matchIndex={0} bracket={bracket} />
    </div>
  );
};

export default TournamentBracket;