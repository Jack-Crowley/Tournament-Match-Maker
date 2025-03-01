"use client"

import { useEffect, useRef, useState } from "react";
import { Bracket, BracketPlayer, Matchup } from "@/types/bracketTypes";
import { MatchupModal } from "@/components/modals/displayMatchup";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons/faUserPlus";
import { addPlayerToMatchupFromWaitlist } from "@/utils/bracket/bracket";
import { Tournament } from "@/types/tournamentTypes";
import { useMessage } from "@/context/messageContext";

const AddPlayerButton = ({ onAddPlayer }: { onAddPlayer: () => void }) => {
  return (
    <motion.div
      className="bg-[#947ed7] hover:bg-[#af9ce7] transition-colors duration-200"
      onClick={onAddPlayer}
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
    >
      <FontAwesomeIcon icon={faUserPlus} />
      Add Player
    </motion.div>
  );
};

const MatchupElement = ({
  match,
  viewType = "single",
  newPlayer = null,
  tournament = null,
  onClose = null,
}: {
  match: Matchup;
  viewType?: "single" | "add-player";
  newPlayer?: BracketPlayer | null;
  tournament?: Tournament | null;
  onClose?: (() => void) | null;
}) => {
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState<boolean>(false);
  const { triggerMessage } = useMessage?.() || { triggerMessage: () => {} };

  function openModal() {
    if (viewType === "single") {
      setIsMatchupModalOpen(true);
    }
  }

  const addPlayerFromWaitlist = async (index: number) => {
    if (viewType !== "add-player" || !tournament || !newPlayer || !onClose) return;
    
    const { success, errorCode } = await addPlayerToMatchupFromWaitlist(
      tournament, 
      match.match_number, 
      match.round, 
      newPlayer, 
      index
    );

    if (success) {
      triggerMessage("Player added successfully!", "green");
      onClose();
    } else {
      triggerMessage(`Failed to add player. Error code: ${errorCode}`, "red");
    }
  }

  return (
    <div className="flex justify-center items-center flex-shrink-0">
      <motion.div
        className={`${viewType === "single" ? "w-44" : "w-40"} bg-secondary rounded-lg shadow-xl overflow-hidden z-10 hover:cursor-pointer transition-all duration-300`}
        whileHover={viewType === "single" ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={viewType === "single" ? openModal : undefined}
      >
        {match.players.map((player, index) => (
          <div
            key={index}
            className={`${match.winner && (player.uuid === match.winner ? "bg-[#98979b20]" : "bg-[#120b2950]")}`}
          >
            {player.name ? (
              <div
                className={`p-4 ${viewType === "single" ? "flex justify-between" : ""} font-bold border-l-8 
                  ${match.winner
                    ? player.uuid === match.winner
                      ? "border-[#baa6f6] text-[#baa6f6]"
                      : `border-[#1e153e] text-[#271c4e]`
                    : "border-soft text-[#2e225b]"} 
                  bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 ${player.name === "" && "text-secondary"}`}
              >
                {viewType === "single" ? (
                  <>
                    <span className="truncate mr-2">{player.name}</span>
                    <div
                      className={`w-6 h-6 flex items-center justify-center flex-shrink-0
                          ${match.winner
                          ? player.uuid === match.winner
                            ? "bg-[#baa6f6a2]"
                            : "bg-[#1e153e9b]"
                          : "bg-soft"} 
                          text-white rounded-full text-sm font-bold`}
                    >
                      {player.score ? player.score : 0}
                    </div>
                  </>
                ) : (
                  player.name
                )}
              </div>
            ) : (
              viewType === "add-player" ? (
                <AddPlayerButton onAddPlayer={() => addPlayerFromWaitlist(index)} />
              ) : (
                <div
                  className={`p-4 font-bold border-l-8 
                    ${match.winner
                      ? "border-[#1e153e] text-[rgba(0,0,0,0)]"
                      : "border-soft text-[#2e225b00]"} 
                    bg-opacity-90 transition-all`}
                >
                  Placeholder
                </div>
              )
            )}
            {index !== match.players.length - 1 && (
              <div className="h-px bg-primary opacity-50"></div>
            )}
          </div>
        ))}
      </motion.div>
      {viewType === "single" && (
        <MatchupModal matchup={match} isOpen={isMatchupModalOpen} setOpen={setIsMatchupModalOpen} />
      )}
    </div>
  );
};

const BracketCreator = ({
  roundIndex,
  matchIndex,
  bracket,
  viewType = "single",
  newPlayer = null,
  tournament = null,
  onClose = null,
}: {
  roundIndex: number;
  matchIndex: number;
  bracket: Bracket;
  viewType?: "single" | "add-player";
  newPlayer?: BracketPlayer | null;
  tournament?: Tournament | null;
  onClose?: (() => void) | null;
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const heightOffset = (bracket.rounds.length - roundIndex - 1) * (viewType === "single" ? 8 : 7);
  const connectionColor = "bg-primary";
  const connectionThickness = "2px";
  const connectionSpacing = "3rem";

  useEffect(() => {
    if (elementRef.current) {
      const updateBox = () => {
        if (elementRef.current) {
          setBox(elementRef.current.getBoundingClientRect());
        }
      };

      updateBox();

      const resizeObserver = new ResizeObserver(updateBox);
      resizeObserver.observe(elementRef.current);
    }
  }, []);

  if (roundIndex === 0) {
    return (
      <MatchupElement 
        match={bracket.rounds[roundIndex].matches[matchIndex]} 
        viewType={viewType}
        newPlayer={newPlayer}
        tournament={tournament}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex">
      <div
        className="flex-shrink-0 mb-4 relative min-h-72 w-fit grid grid-rows-2 space-y-2 mr-[6rem]"
        ref={elementRef}
      >
        <BracketCreator
          matchIndex={matchIndex * 2}
          roundIndex={roundIndex - 1}
          bracket={bracket}
          viewType={viewType}
          newPlayer={newPlayer}
          tournament={tournament}
          onClose={onClose}
        />
        <BracketCreator
          matchIndex={matchIndex * 2 + 1}
          roundIndex={roundIndex - 1}
          bracket={bracket}
          viewType={viewType}
          newPlayer={newPlayer}
          tournament={tournament}
          onClose={onClose}
        />
        {box && (
          <div>
            <div
              className={`absolute ${connectionColor} w-[${connectionThickness}]`}
              style={{
                top: `${box.height / 4 - heightOffset}px`,
                left: `${box.width + 48}px`,
                height: `${box.height / 2 + 2}px`,
                width: "2px",
              }}
            />

            <div
              className={`absolute ${connectionColor} h-[${connectionThickness}]`}
              style={{
                top: `${box.height / 4 - 1 - heightOffset}px`,
                left: `${box.width}px`,
                width: connectionSpacing,
                height: "2px",
              }}
            />

            <div
              className={`absolute ${connectionColor} h-[${connectionThickness}]`}
              style={{
                top: `${box.height / 4 * 3 - heightOffset}px`,
                left: `${box.width}px`,
                width: connectionSpacing,
                height: "2px",
              }}
            />

            <div
              className={`absolute ${connectionColor} h-[${connectionThickness}]`}
              style={{
                top: `${box.height / 2 + 5}px`,
                left: `${box.width + 48}px`,
                width: connectionSpacing,
                height: "2px",
              }}
            />
          </div>
        )}
      </div>
      <MatchupElement
        match={bracket.rounds[roundIndex].matches[matchIndex]}
        viewType={viewType}
        newPlayer={newPlayer}
        tournament={tournament}
        onClose={onClose}
      />
    </div>
  );
};

const TournamentBracket = ({ 
  bracket,
  viewType = "single",
  newPlayer = null,
  tournament = null,
  onClose = null,
}: { 
  bracket: Bracket;
  viewType?: "single" | "add-player";
  newPlayer?: BracketPlayer | null;
  tournament?: Tournament | null;
  onClose?: (() => void) | null;
}) => {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return <div className="flex justify-center items-center h-full">No tournament data available</div>;
  }

  const containerClass = viewType === "single" 
    ? "mt-12 ml-[8%] h-[89vh] overflow-auto pb-16" 
    : "mt-[50px] ml-[8%] h-[89vh]";

  return (
    <div className={containerClass}>
      <BracketCreator
        roundIndex={bracket.rounds.length - 1}
        matchIndex={0}
        bracket={bracket}
        viewType={viewType}
        newPlayer={newPlayer}
        tournament={tournament}
        onClose={onClose}
      />
    </div>
  );
};

export default TournamentBracket;