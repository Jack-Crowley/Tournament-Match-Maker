import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faSortUp, faSortDown, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

type PlayerStanding = {
  player: {
    uuid: string;
    name: string;
    seed?: number;
  };
  wins: number;
  losses: number;
  draws: number;
  points: number;
  opponents: string[];
  opponentWinPercentage: number;
  matchWinPercentage: number;
  bye: boolean;
}

type SortDirection = 'asc' | 'desc';

type SortConfig = {
  key: keyof PlayerStanding | 'playerName' | 'totalMatches' | 'winRate';
  direction: SortDirection;
}

const SwissStandings = ({ standings }: { standings: PlayerStanding[] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'points',
    direction: 'desc'
  });

  // Handle sorting toggle
  const requestSort = (key: SortConfig['key']) => {
    let direction: SortDirection = 'desc';
    
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get the sort icon for the column header
  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) {
      return <FontAwesomeIcon icon={faSort} className="ml-1 text-[#947ed7]/40" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-[#947ed7]" />
      : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-[#947ed7]" />;
  };

  // Filter and sort the standings
  const filteredAndSortedStandings = React.useMemo(() => {
    let result = [...standings];
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(standing => 
        standing.player.name && standing.player.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Sort based on current configuration
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.key === 'playerName') {
        comparison = (a.player.name || '').localeCompare(b.player.name || '');
      } else if (sortConfig.key === 'totalMatches') {
        const totalA = a.wins + a.losses + a.draws;
        const totalB = b.wins + b.losses + b.draws;
        comparison = totalA - totalB;
      } else if (sortConfig.key === 'winRate') {
        const totalA = a.wins + a.losses + a.draws;
        const totalB = b.wins + b.losses + b.draws;
        const rateA = totalA > 0 ? a.wins / totalA : 0;
        const rateB = totalB > 0 ? b.wins / totalB : 0;
        comparison = rateA - rateB;
      } else if (sortConfig.key === 'opponentWinPercentage' || sortConfig.key === 'matchWinPercentage') {
        // Direct comparison for percentage fields
        comparison = a[sortConfig.key] - b[sortConfig.key];
      } else {
        // For numeric fields like points, wins, losses
        comparison = (a[sortConfig.key] as number) - (b[sortConfig.key] as number);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [standings, searchTerm, sortConfig]);

  // Get medal icon for top 3 players (when sorted by points)
  const getMedalIcon = (index: number) => {
    if (sortConfig.key !== 'points' || sortConfig.direction !== 'desc') return null;
    
    if (index === 0) return <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 mr-2" />;
    if (index === 1) return <FontAwesomeIcon icon={faTrophy} className="text-gray-400 mr-2" />;
    if (index === 2) return <FontAwesomeIcon icon={faTrophy} className="text-amber-700 mr-2" />;
    
    return null;
  };

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-[#947ed7] mb-6">Tournament Standings</h2>
      
      {/* Search bar */}
      <div className="mb-6">
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
      
      {/* Standings table */}
      <div className="bg-[#1e153e] rounded-lg shadow-xl overflow-hidden border border-[#947ed7]/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#160a3a] text-white">
                <th className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20">Rank</th>
                <th 
                  className="px-4 py-4 text-left font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('playerName')}
                >
                  <div className="flex items-center">
                    Player {getSortIcon('playerName')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('points')}
                >
                  <div className="flex items-center justify-center">
                    Points {getSortIcon('points')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('wins')}
                >
                  <div className="flex items-center justify-center">
                    W {getSortIcon('wins')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('losses')}
                >
                  <div className="flex items-center justify-center">
                    L {getSortIcon('losses')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('draws')}
                >
                  <div className="flex items-center justify-center">
                    D {getSortIcon('draws')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('totalMatches')}
                >
                  <div className="flex items-center justify-center">
                    Played {getSortIcon('totalMatches')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('winRate')}
                >
                  <div className="flex items-center justify-center">
                    Win % {getSortIcon('winRate')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center font-semibold text-[#947ed7] border-b border-[#947ed7]/20 cursor-pointer"
                  onClick={() => requestSort('opponentWinPercentage')}
                >
                  <div className="flex items-center justify-center whitespace-nowrap">
                    SoS {getSortIcon('opponentWinPercentage')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#947ed7]/20">
              {filteredAndSortedStandings.map((standing, index) => {
                const totalMatches = standing.wins + standing.losses + standing.draws;
                const winRate = totalMatches > 0 ? (standing.wins / totalMatches) * 100 : 0;
                
                return (
                  <tr 
                    key={standing.player.uuid}
                    className="hover:bg-[#947ed7]/10 transition-colors"
                  >
                    <td className="px-4 py-4 text-white text-center">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {getMedalIcon(index)}
                        <span className="text-white font-medium">
                          {standing.player.name}
                        </span>
                        {standing.bye && (
                          <span className="ml-2 px-2 py-0.5 bg-[#947ed7]/20 text-[#947ed7] text-xs rounded">
                            BYE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-white font-bold">{standing.points}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-green-400">{standing.wins}</td>
                    <td className="px-4 py-4 text-center text-red-400">{standing.losses}</td>
                    <td className="px-4 py-4 text-center text-yellow-400">{standing.draws}</td>
                    <td className="px-4 py-4 text-center text-white">{totalMatches}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-white">
                      {(standing.opponentWinPercentage * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredAndSortedStandings.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No players found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 bg-[#1e153e] rounded-lg p-4 border border-[#947ed7]/30">
        <h3 className="text-lg font-semibold text-[#947ed7] mb-2">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <span className="w-8 text-center font-medium text-white">W</span>
            <span className="text-gray-300">Wins</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 text-center font-medium text-white">L</span>
            <span className="text-gray-300">Losses</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 text-center font-medium text-white">D</span>
            <span className="text-gray-300">Draws</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 text-center font-medium text-white">SoS</span>
            <span className="text-gray-300">Strength of Schedule (opponent win %)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwissStandings;