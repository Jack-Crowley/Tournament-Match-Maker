'use client';

import { useState, useEffect } from 'react';
import { BracketPlayer } from "@/types/bracketTypes";

function seedPlayers(playersToSeed: BracketPlayer[]) {
    return [...playersToSeed].sort((a, b) => {
        for (let i = 0; i < Math.min(a.skills?.length || 0, b.skills?.length || 0); i++) {
            const [aSkillName, aSkillValue] = a.skills?.[i] || ['', 0];
            const [bSkillName, bSkillValue] = b.skills?.[i] || ['', 0];
            
            if (aSkillValue !== bSkillValue) {
                return bSkillValue - aSkillValue;
            }
        }
        
        return 0;
    });
}

export default function SeedingTest() {
    const [sortedPlayers, setSortedPlayers] = useState<BracketPlayer[]>([]);

    const testPlayers: BracketPlayer[] = [
        {
            uuid: '1',
            name: 'Alice',
            email: 'alice@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 8],
                ['reflexes', 7],
                ['teamwork', 6]
            ]
        },
        {
            uuid: '2',
            name: 'Bob',
            email: 'bob@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 8],
                ['reflexes', 8],
                ['teamwork', 5]
            ]
        },
        {
            uuid: '3',
            name: 'Charlie',
            email: 'charlie@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 9],
                ['reflexes', 7],
                ['teamwork', 6]
            ]
        },
        {
            uuid: '4',
            name: 'Dave',
            email: 'dave@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 8],
                ['reflexes', 7],
                ['teamwork', 7]
            ]
        }
        // ... other players from previous example
    ];

    useEffect(() => {
        const sorted = seedPlayers(testPlayers);
        setSortedPlayers(sorted);
        
        // Explicit checks
        console.assert(sorted[0].name === 'Charlie', "First player should be Charlie");
        console.assert(sorted[1].name === 'Bob', "Second player should be Bob");
        console.assert(sorted[2].name === 'Dave', "Third player should be Dave");
        console.assert(sorted[3].name === 'Alice', "Last player should be Alice");
    
        // Detailed logging of skills for verification
        sorted.forEach(player => {
            console.log(`${player.name} skills:`, player.skills);
        });
    }, []);

    const edgeCasePlayers: BracketPlayer[] = [
        // Completely equal skills
        {
            uuid: '5',
            name: 'Equal1',
            email: 'equal1@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 8],
                ['reflexes', 7],
                ['teamwork', 6]
            ]
        },
        {
            uuid: '6',
            name: 'Equal2',
            email: 'equal2@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 8],
                ['reflexes', 7],
                ['teamwork', 6]
            ]
        },
        // Different number of skills
        {
            uuid: '7',
            name: 'PartialSkills1',
            email: 'partial1@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 9],
                ['reflexes', 8]
            ]
        },
        {
            uuid: '8',
            name: 'PartialSkills2',
            email: 'partial2@example.com',
            account_type: 'logged_in',
            skills: [
                ['strategy', 9],
                ['reflexes', 8],
                ['teamwork', 7]
            ]
        },
        // Empty skills
        {
            uuid: '9',
            name: 'NoSkills',
            email: 'noskills@example.com',
            account_type: 'logged_in',
            skills: []
        }
    ];
    
    // Add to useEffect for testing
    useEffect(() => {
        const mixedSorted = seedPlayers([...testPlayers, ...edgeCasePlayers]);
        
        // Log mixed case sorted players
        console.log("Mixed Case Sorted Players:", mixedSorted.map(p => p.name));
        
        // Additional assertions for edge cases
        console.assert(
            mixedSorted.findIndex(p => p.name === 'PartialSkills1') < 
            mixedSorted.findIndex(p => p.name === 'PartialSkills2'), 
            "Partial skills player with higher first skill should be ranked higher"
        );
    }, []);

    return (
        <div>
            <h1>Seeding Test</h1>
            <ul>
                {sortedPlayers.map(player => (
                    <li key={player.uuid}>{player.name}</li>
                ))}
            </ul>
        </div>
    );
}