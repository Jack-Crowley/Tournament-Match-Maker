import { BracketPlayer } from "./bracketTypes";

export interface RoundRobinRankedPlayer {
    player : BracketPlayer, 
    wins : BracketPlayer[],
    losses: BracketPlayer[],
    ties: BracketPlayer[],
    byes: number
}