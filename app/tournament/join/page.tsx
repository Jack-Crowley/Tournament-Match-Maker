"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const { triggerMessage } = useMessage();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      triggerMessage("Please enter a join code", "red");
      return;
    }

    setChecking(true);

    // Check if the tournament exists
    const { data, error } = await supabase
      .from("tournaments")
      .select("id")
      .eq("join_code", joinCode.trim())
      .single();

    setChecking(false);

    if (error || !data) {
      triggerMessage("Invalid join code", "red");
    } else {
        triggerMessage("Joining tournament!", "green");
      router.push(`/tournament/join/${joinCode.trim()}`);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="bg-[#2d2158] p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-[#7458da] font-bold text-2xl mb-6 text-center">Enter Join Code</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-white block text-sm mb-2">Join Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter tournament join code"
              className="w-full p-3 bg-[#1E1E1E] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
          >
            {checking ? "Checking..." : "Join Tournament"}
          </button>
        </form>
      </div>
    </div>
  );
}
