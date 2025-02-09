'use client'
import { useState } from "react";
import Link from "next/link";
import { addTeam } from "../../../lib/teamsService";
import { useRouter } from "next/navigation";

export default function CreateTeam() {
    const [teamName, setTeamName] = useState("");
    const [description, setDescription] = useState("");
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = "";
        // Upload profile picture if available
        if (profilePicture) {
            const fileExt = profilePicture.name.split('.').pop();
            const fileName = `${teamName}-${Date.now()}.${fileExt}`;
            // const { data, error: uploadError } = await supabase.storage
            //     .from('team-profile-pictures')
            //     .upload(fileName, profilePicture);


            // if (uploadError){
            //     console.error("Error uploading profile picture:", uploadError);
            //     throw uploadError;
            // } 

            // const { data: publicUrlData } = supabase
            //     .storage
            //     .from('team-profile-pictures')
            //     .getPublicUrl(fileName);
            // imageUrl = publicUrlData.publicUrl;
            imageUrl = fileName;
        }

        // Create new team using addTeam function
        const newTeam = {
            id: new Date().getTime(),
            name: teamName,
            image: imageUrl,
            created_at: new Date().toISOString(),
            membersCount: 0,
            tournamentsJoined: 0,
            tournamentsWon: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            description: description
        };

        try {
            await addTeam(newTeam);
        }
        catch (error) {
            console.error("Error creating team:", error);
            alert("Error creating team. Please try again.");
            setLoading(false);
            return;
        }
        finally {
            setLoading(false);
        }

        router.push("/teams");
        
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center z-1">
            <div className="w-[90%] max-w-[600px] bg-[#381d68] bg-opacity-90 rounded-lg shadow-2xl p-8 border border-[#604BAC]/30">
                <h1 className="text-3xl font-bold text-center mb-6 text-[#C2A8F0]">Create a New Team</h1>
                <form onSubmit={handleSubmit}>
                    {/* Team Name Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="teamName">Team Name</label>
                        <input
                            type="text"
                            id="teamName"
                            name="teamName"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-[#36225a] border-2 border-[#604BAC] rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                            placeholder="Enter your team name"
                            required
                        />
                    </div>

                    {/* Description Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-[#36225a] border-2 border-[#604BAC] rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                            placeholder="Enter a description for your team"
                            rows={4}
                        ></textarea>
                    </div>

                    {/* Profile Picture Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="profilePicture">Profile Picture</label>
                        <input
                            type="file"
                            id="profilePicture"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files) {
                                    setProfilePicture(e.target.files[0]);
                                }
                            }}
                            className="w-full text-[#C2A8F0] bg-[#36225a] border border-[#604BAC] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" className="px-6 py-2 rounded-md bg-gray-500 bg-opacity-70 text-white font-semibold hover:bg-gray-600">
                            <Link href="/teams">Cancel</Link>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-md bg-[#604BAC] text-white font-semibold hover:bg-[#503992]"
                        >
                            {loading ? "Creating..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
