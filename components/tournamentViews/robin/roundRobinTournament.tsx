import React, { useState, useEffect } from 'react';
import { BracketViewType, MovingPlayer, OnMovePlayer } from '../single/bracketView';
import { Bracket, BracketPlayer, Matchup, Round } from '@/types/bracketTypes';
import { Tournament } from '@/types/tournamentTypes';
import { createClient } from '@/utils/supabase/client';
import { User } from '@/types/userType';

import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faCircle, 
  faListUl, 
  faSitemap, 
  faSearch, 
  faFilter, 
  faChevronDown,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { MatchupElement } from '../single/matchupElement';
import { MatchupModal } from '@/components/modals/displayMatchup';

enum DisplayMode {
  Bracket = "bracket",
  List = "list"
}

const MatchupTable = ({
  bracket,
  tournament,
  user,
  onMatchClick
}: {
  bracket: Bracket;
  tournament: Tournament | null;
  user: User;
  onMatchClick: (match: Matchup) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roundFilter, setRoundFilter] = useState<number | null>(null);
  const [completedFilter, setCompletedFilter, ] = useState<boolean | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const allMatchups: Matchup[] = bracket.rounds.flatMap(round => round.matches);
  
  const filteredMatchups = allMatchups.filter(match => {
    // Apply round filter
    if (roundFilter !== null && match.round !== roundFilter) {
      return false;
    }
    
    // Apply completed filter
    if (completedFilter !== null) {
      const isCompleted = !!match.winner;
      if (completedFilter !== isCompleted) {
        return false;
      }
    }
    
    // Apply search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return match.players.some(player => 
        player.name && player.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    return true;
  });
  
  // Get all round numbers for filter dropdown
  const rounds = [...new Set(allMatchups.map(match => match.round))].sort((a, b) => a - b);
  
  const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

  const resetFilters = () => {
    setSearchTerm("");
    setRoundFilter(null);
    setCompletedFilter(null);
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="flex-1">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e153e] border border-[#947ed7]/40 focus:border-[#947ed7] focus:outline-none text-white shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#947ed7]"
              />
            </div>
          </div>
          
          <div className="flex">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFilters}
              className="py-3 px-5 rounded-lg bg-[#1e153e] border border-[#947ed7]/40 hover:border-[#947ed7] text-white font-medium flex items-center gap-2 shadow-md"
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`transition-transform ${isFiltersOpen ? "rotate-180" : ""}`}
              />
            </motion.button>
          </div>
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 bg-[#1e153e] border border-[#947ed7]/40 rounded-lg shadow-lg"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium text-[#947ed7] mb-1">Round</label>
                  <select 
                    className="w-full md:w-40 px-4 py-2 rounded-lg bg-[#160a3a] border border-[#947ed7]/40 focus:border-[#947ed7] focus:outline-none text-white"
                    value={roundFilter === null ? "" : roundFilter}
                    onChange={(e) => setRoundFilter(e.target.value === "" ? null : Number(e.target.value))}
                  >
                    <option value="">All Rounds</option>
                    {rounds.map(round => (
                      <option key={round} value={round}>Round {round}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium text-[#947ed7] mb-1">Status</label>
                  <select 
                    className="w-full md:w-40 px-4 py-2 rounded-lg bg-[#160a3a] border border-[#947ed7]/40 focus:border-[#947ed7] focus:outline-none text-white"
                    value={completedFilter === null ? "" : completedFilter ? "completed" : "ongoing"}
                    onChange={(e) => {
                      if (e.target.value === "") setCompletedFilter(null);
                      else setCompletedFilter(e.target.value === "completed");
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
                
                <div className="w-full md:w-auto md:self-end">
                  <button 
                    className="w-full px-6 py-2 rounded-lg bg-[#947ed7] hover:bg-[#af9ce7] text-white font-medium transition-colors shadow-md"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="bg-[#1e153e] rounded-lg shadow-xl overflow-hidden border border-[#947ed7]/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#160a3a] text-white">
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Match #</th>
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Round</th>
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Players</th>
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Score</th>
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#947ed7]/20">
              {filteredMatchups.map((match) => {
                const isClickable = (tournament?.status !== "completed") && 
                  ["owner", "admin", "scorekeeper"].includes(user.permission_level.toLowerCase());
                
                return (
                  <tr 
                    key={`${match.round}-${match.match_number}`}
                    className={`${isClickable ? 'cursor-pointer hover:bg-[#947ed7]/10' : ''} transition-all duration-150`}
                    onClick={() => isClickable && onMatchClick(match)}
                  >
                    <td className="px-4 py-4">{match.match_number}</td>
                    <td className="px-4 py-4">{match.round}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        {match.players.map((player, idx) => (
                          <div 
                            key={idx} 
                            className={`${player.uuid === match.winner ? 'text-[#af9ce7] font-semibold' : player.name ? 'text-white' : 'text-gray-400 italic'}`}
                          >
                            {player.name || 'Empty slot'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        {match.players.map((player, idx) => (
                          <div 
                            key={idx}
                            className={`${player.uuid === match.winner ? 'text-[#af9ce7] font-semibold' : ''}`}
                          >
                            {player.score ?? '0'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-sm font-medium 
                          ${match.winner ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {match.winner ? 'Completed' : 'Ongoing'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredMatchups.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No matches found matching your filters</p>
              <button 
                onClick={resetFilters} 
                className="mt-4 px-6 py-2 rounded-lg bg-[#947ed7]/20 hover:bg-[#947ed7]/30 text-white font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

  return (
    <div className="w-full mt-8">
      <div className="flex space-x-6 z-20 items-center justify-center">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous round"
          className={`rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-highlight ${activeIndex === 0 ? 'bg-deep cursor-not-allowed' : 'bg-highlight hover:bg-accent'
            }`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className={`${activeIndex === 0 ? "text-gray-200" : "text-white"}`} />
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
          <FontAwesomeIcon icon={faChevronRight} className={`${activeIndex === rounds.length - 1 ? "text-gray-200" : "text-white"}`} />
        </button>
      </div>

      <div className="w-full flex mt-4 items-center justify-center space-x-2">
        {rounds.map((round: Round, index: number) => {
          const offset = index - activeIndex;

          if (Math.abs(offset) > 2) return null;

          return (
            <AnimatePresence key={`round-${(round as any).id || index}`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: Math.abs(offset) <= 1 ? 1 : 0.6,
                  scale:1
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: .2, ease: 'easeInOut' }}
              >
                <div className={` ${Math.abs(offset) <= 1 ? 'w-64 h-64' : 'w-56 h-56'} transition-all`}>
                  <h3 className={`${Math.abs(offset) <= 1 ? 'text-xl' : 'text-base'} text-center font-bold text-highlight mb-2`}>
                    Round {index + 1}
                  </h3>
                  {round.matches.map((match: Matchup, matchIndex: number) => {
                    const individualViewType = (movingPlayer && movingPlayer?.fromRound === index + 1) ? viewType : BracketViewType.Normal;

                    return (
                      <div key={`match-${match.id || matchIndex}`} className="mb-2">
                        <MatchupElement
                          match={match}
                          viewType={individualViewType}
                          newPlayer={newPlayer}
                          tournament={tournament}
                          bracket={bracket}
                          onMovePlayer={onMovePlayer}
                          movingPlayer={movingPlayer}
                          onClose={onClose}
                          user={user}
                        />
                      </div>
                    )
                  })}
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
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.Bracket);
  const [movingPlayer, setMovingPlayer] = useState<MovingPlayer | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Matchup | null>(null);
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);

  const handleMovePlayer: OnMovePlayer = (player) => {
    if (player === null) {
      setMovingPlayer(null);
      setViewType(BracketViewType.Normal);
    } else {
      setMovingPlayer(player);
      setViewType(BracketViewType.MovePlayer);
    }
  };

  const handleMatchClick = (match: Matchup) => {
    setSelectedMatch(match);
    setIsMatchupModalOpen(true);
  };

  // Floating status bar for move player mode
  const renderMovePlayerStatus = () => {
    if (viewType !== BracketViewType.MovePlayer || !movingPlayer) return null;
    
    return (
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#1e153e] text-white px-6 py-3 rounded-lg shadow-xl 
                  border border-[#947ed7]/40 z-20 flex items-center gap-4"
      >
        <div>
          <span className="text-[#947ed7] font-medium">Moving Player: </span>
          <span className="font-semibold">{movingPlayer.player.name}</span>
        </div>
        <button 
          onClick={() => handleMovePlayer(null)}
          className="bg-[#947ed7]/20 hover:bg-[#947ed7]/40 p-2 rounded-full transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </motion.div>
    );
  };

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

    if (tournamentID) {
      getTournament();
    }
  }, [tournamentID]);

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh] bg-[#160a3a]/50 rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-[#947ed7] mb-2">No Tournament Data</h3>
          <p className="text-white/70">The bracket information is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[89vh] bg-[#160a3a]/30">
      {renderMovePlayerStatus()}
      
      <div className="h-[calc(89vh-60px)] overflow-auto pb-16">
        <AnimatePresence mode="wait">
          {displayMode === DisplayMode.Bracket ? (
            <motion.div
              key="bracket"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bracket-container"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="list-container"
            >
              <MatchupTable 
                bracket={bracket} 
                tournament={tournament} 
                user={user}
                onMatchClick={handleMatchClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View Toggle */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 z-10">
        <motion.div 
          className="bg-[#1e153e] rounded-full shadow-xl p-1.5 flex border border-[#947ed7]/30"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            className={`px-7 py-3 rounded-full flex items-center gap-2 font-medium transition-all duration-200 ${
              displayMode === DisplayMode.Bracket 
                ? 'bg-[#947ed7] text-white shadow-md' 
                : 'text-[#947ed7] hover:text-white'
            }`}
            onClick={() => setDisplayMode(DisplayMode.Bracket)}
            whileHover={{ scale: displayMode === DisplayMode.Bracket ? 1 : 1.05 }}
          >
            <FontAwesomeIcon icon={faSitemap} />
            Bracket
          </motion.button>
          <motion.button
            className={`px-7 py-3 rounded-full flex items-center gap-2 font-medium transition-all duration-200 ${
              displayMode === DisplayMode.List 
                ? 'bg-[#947ed7] text-white shadow-md' 
                : 'text-[#947ed7] hover:text-white'
            }`}
            onClick={() => setDisplayMode(DisplayMode.List)}
            whileHover={{ scale: displayMode === DisplayMode.List ? 1 : 1.05 }}
          >
            <FontAwesomeIcon icon={faListUl} />
            List
          </motion.button>
        </motion.div>
      </div>

      {selectedMatch && tournament && (
        <MatchupModal 
          matchup={selectedMatch} 
          isOpen={isMatchupModalOpen} 
          setOpen={setIsMatchupModalOpen} 
          user={user} 
          tournament_type={tournament?.tournament_type}
        />
      )}
    </div>
  );
};