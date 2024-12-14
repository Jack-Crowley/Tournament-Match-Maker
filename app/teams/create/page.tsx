import Link from "next/link";

export default function CreateTeam() {
    return (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center z-1">
            <div className="w-[90%] max-w-[600px] bg-[#381d68] bg-opacity-90 rounded-lg shadow-2xl p-8 border border-[#604BAC]/30">
                <h1 className="text-3xl font-bold text-center mb-6 text-[#C2A8F0]">Create a New Team</h1>
                <form>
                    {/* Team Name Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="teamName">
                            Team Name
                        </label>
                        <input
                            type="text"
                            id="teamName"
                            name="teamName"
                            className="w-full bg-[#36225a] border-2 border-[#604BAC] rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                            placeholder="Enter your team name"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="w-full bg-[#36225a] border-2 border-[#604BAC] rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                            placeholder="Enter a description for your team"
                            rows={4}
                        ></textarea>
                    </div>

                    {/* Profile Picture Input */}
                    <div className="mb-4">
                        <label className="block text-[#C2A8F0] font-semibold mb-2" htmlFor="profilePicture">
                            Profile Picture
                        </label>
                        <input
                            type="file"
                            id="profilePicture"
                            name="profilePicture"
                            className="w-full text-[#C2A8F0] bg-[#36225a] border border-[#604BAC] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#604BAC]"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            className="px-6 py-2 rounded-md bg-gray-500 bg-opacity-70 text-white font-semibold hover:bg-gray-600"
                        >
                            <Link href="/teams">Cancel</Link>
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-md bg-[#604BAC] text-white font-semibold hover:bg-[#503992]"
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
