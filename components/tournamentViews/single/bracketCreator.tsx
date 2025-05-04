"use client"

import { useEffect, useRef, useState } from "react";
import { Bracket, BracketPlayer } from "@/types/bracketTypes";
import { Tournament } from "@/types/tournamentTypes";
import { User } from "@/types/userType";

import { MovingPlayer, OnMovePlayer, BracketViewType } from "./bracketView";
import { MatchupElement } from "./matchupElement";

export const BracketCreator = ({
    roundIndex,
    matchIndex,
    bracket,
    viewType = BracketViewType.Normal,
    newPlayer = null,
    movingPlayer,
    tournament = null,
    onMovePlayer,
    onClose = null,
    user,
}: {
    roundIndex: number;
    matchIndex: number;
    bracket: Bracket;
    user: User;
    viewType: BracketViewType;
    movingPlayer: MovingPlayer | null;
    onMovePlayer: OnMovePlayer;
    newPlayer?: BracketPlayer | null;
    tournament?: Tournament | null;
    onClose?: (() => void) | null;
}) => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [box, setBox] = useState<DOMRect | null>(null);
    const heightOffset = (bracket.rounds.length - roundIndex - 1) * (viewType === BracketViewType.Normal ? 8 : 7);
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
                bracket={bracket}
                onMovePlayer={onMovePlayer}
                movingPlayer={movingPlayer}
                tournament={tournament}
                onClose={onClose}
                user={user}
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
                    movingPlayer={movingPlayer}
                    onMovePlayer={onMovePlayer}
                    onClose={onClose}
                    user={user}
                />
                <BracketCreator
                    matchIndex={matchIndex * 2 + 1}
                    roundIndex={roundIndex - 1}
                    bracket={bracket}
                    viewType={viewType}
                    newPlayer={newPlayer}
                    onClose={onClose}
                    tournament={tournament}
                    movingPlayer={movingPlayer}
                    onMovePlayer={onMovePlayer}
                    user={user}
                />
                {box && (
                    <div>
                        <div
                            className={`absolute ${connectionColor}`}
                            style={{
                                top: `${box.height / 4 - heightOffset}px`,
                                left: `${box.width + 48}px`,
                                height: `${box.height / 2 + 2}px`,
                                width: "2px",
                            }}
                        />

                        <div
                            className={`absolute ${connectionColor}`}
                            style={{
                                top: `${box.height / 4 - 1 - heightOffset}px`,
                                left: `${box.width}px`,
                                width: connectionSpacing,
                                height: "2px",
                            }}
                        />

                        <div
                            className={`absolute ${connectionColor}`}
                            style={{
                                top: `${box.height / 4 * 3 - heightOffset}px`,
                                left: `${box.width}px`,
                                width: connectionSpacing,
                                height: "2px",
                            }}
                        />

                        <div
                            className={`absolute ${connectionColor}`}
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
                bracket={bracket}
                onMovePlayer={onMovePlayer}
                movingPlayer={movingPlayer}
                onClose={onClose}
                user={user}
            />
        </div>
    );
};

export default BracketCreator;