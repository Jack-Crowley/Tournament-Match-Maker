import React, { useState, useEffect } from 'react';
import { BracketViewType, MovingPlayer, OnMovePlayer } from '../single/bracketView';
import { Bracket, BracketPlayer, Matchup, Round } from '@/types/bracketTypes';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { User } from '@/types/userType';

import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import { MatchupElement } from '../single/matchupElement';


const RoundRobinCarousel = ({
  bracket,
  user,
  viewType = BracketViewType.Normal,
  newPlayer = null,
  movingPlayer,
  tournament = null,
  onMovePlayer,
  onClose = null,
}: {
  bracket: Bracket;
  user: User;
  viewType: BracketViewType;
  movingPlayer: MovingPlayer | null;
  onMovePlayer: OnMovePlayer;
  newPlayer?: BracketPlayer | null;
  tournament?: Tournament | null;
  onClose?: (() => void) | null;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const rounds = bracket.rounds;

  const handleNext = () => {
    setActiveIndex((prevIndex) => Math.min(prevIndex + 1, rounds.length - 1));
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  const getRoundTransform = (offset: number) => {
    switch (offset) {
      case 0: return { x: '-50%' };
      case 1: return { x: '40%' };
      case -1: return { x: '-140%' };
      case 2: return { x: '140%' };
      case -2: return { x: '-240%' };
      default: return { x: '0%' };
    }
  };

  return (
    <div className="relative w-full h-96">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex space-x-6 z-20">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous round"
          className={`rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-highlight ${activeIndex === 0 ? 'bg-deep cursor-not-allowed' : 'bg-highlight hover:bg-accent'
            }`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className={`${activeIndex == 0 ? "text-gray-200" : "text-white"}`} />
        </button>
        <div className='flex space-x-2 z-20 mr-4'>
          {rounds.map((_: any, index: number) => (
            <button
              key={`indicator-${index}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to round ${index + 1}`}
              className="focus:outline-none focus:ring-2 focus:ring-highlight rounded-full"
            >
              <FontAwesomeIcon
                icon={faCircle}
                className={`${index === activeIndex ? 'text-highlight' : 'text-deep'} text-xs transition-colors`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={activeIndex === rounds.length - 1}
          aria-label="Next round"
          className={`rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-highlight ${activeIndex === rounds.length - 1 ? 'bg-deep cursor-not-allowed' : 'bg-highlight hover:bg-accent'
            }`}
        >
          <FontAwesomeIcon icon={faChevronRight} className={`${activeIndex == 0 ? "text-gray-200" : "text-white"}`} />
        </button>
      </div>

      <div className="w-full h-full relative">
        {rounds.map((round: Round, index: number) => {
          const offset = index - activeIndex;

          if (Math.abs(offset) > 2) return null;

          const transform = getRoundTransform(offset);

          return (
            <AnimatePresence key={`round-${(round as any).id || index}`}>
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: Math.abs(offset) <= 1 ? 1 : 0.85,
                  top: '50%',
                  left: '50%',
                  ...transform,
                  y: '-50%',
                  zIndex: 10 - Math.abs(offset),
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className={`p-6 ${Math.abs(offset) <= 1 ? 'w-64 h-64' : 'w-56 h-56'} transition-all`}>
                  <h3 className={`${Math.abs(offset) <= 1 ? 'text-xl' : 'text-base'} text-center font-bold text-highlight mb-2`}>
                    Round {index + 1}
                  </h3>
                  {round.matches.map((match: Matchup, matchIndex: number) => (
                    <div key={`match-${match.id || matchIndex}`} className="mb-2">
                      <MatchupElement
                        match={match}
                        viewType={viewType}
                        newPlayer={newPlayer}
                        tournament={tournament}
                        bracket={bracket}
                        onMovePlayer={onMovePlayer}
                        movingPlayer={movingPlayer}
                        onClose={onClose}
                        user={user}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
};



export const RoundRobinTournament = ({
  bracket,
  newPlayer = null,
  tournamentID = null,
  onClose = null,
  user,
  bracketViewType = BracketViewType.Normal,

}: {
  bracket: Bracket;
  newPlayer?: BracketPlayer | null;
  tournamentID?: number | null;
  onClose?: (() => void) | null;
  user: User;
  bracketViewType: BracketViewType;
}) => {
  const [viewType, setViewType] = useState<BracketViewType>(bracketViewType);
  const [movingPlayer, setMovingPlayer] = useState<MovingPlayer | null>(null);

  const handleMovePlayer: OnMovePlayer = (player) => {
    if (player === null) {
      setMovingPlayer(null);
      setViewType(BracketViewType.Normal);
    } else {
      setMovingPlayer(player);
      setViewType(BracketViewType.MovePlayer);
    }
  };

  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const getTournament = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("tournaments").select("*").eq("id", tournamentID).single();

      if (error) {
        console.error("Error fetching tournament data");
        return;
      }

      setTournament(data);
    };

    getTournament();
  }, [tournamentID]);


  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return <div className="flex justify-center items-center h-full">No tournament data available</div>;
  }

  return (
    <div className="min-h-screen py-12 px-4">
      {tournament && (
        <div className="w-full h-full mx-auto">
          <h1 className="text-3xl font-bold text-center">{tournament.name}</h1>
          <RoundRobinCarousel
            bracket={bracket}
            viewType={viewType}
            newPlayer={newPlayer}
            movingPlayer={movingPlayer}
            onMovePlayer={handleMovePlayer}
            tournament={tournament}
            onClose={onClose}
            user={user}
          />
        </div>
      )}
    </div>
  );
};
