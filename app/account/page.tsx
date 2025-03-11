"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useClient } from "@/context/clientContext";
import { User } from "@/types/userType";
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faGamepad, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingTournaments, setPlayingTournaments] = useState<Tournament[]>([]);
  const [organizingTournaments, setOrganizingTournaments] = useState<Tournament[]>([]);
  const client = useClient();
  const supabase = createClient();
 
  useEffect(() => {
    async function fetchUserDetails() {
      setLoading(true);
      const userUUID = client.session?.user.id;

      if (!userUUID) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("uuid", userUUID)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      setUser(data);
      await loadTournamentData(userUUID);
      setLoading(false);
    }

    async function loadTournamentData(id: any) {
      const { data: organizingTournamentsOwner } = await supabase
        .from('tournaments')
        .select('*')
        .eq('owner', id);

      const owningIds = organizingTournamentsOwner?.map(record => record.id) || [];
      setOrganizingTournaments(organizingTournamentsOwner || []);

      const { data: playingData } = await supabase
        .from('tournament_players')
        .select('tournament_id')
        .eq('member_uuid', id);

      const { data: organizingTournaments } = await supabase
        .from('tournament_organizers')
        .select('*')
        .eq('member_uuid', id);

      const nonOwnerTournamentIds = organizingTournaments
        ?.map(record => record.tournament_id)
        .filter(tournament_id => !owningIds.includes(tournament_id));

      if (nonOwnerTournamentIds?.length) {
        const { data: nonOwnerTournaments } = await supabase
          .from('tournaments')
          .select('*')
          .in('id', nonOwnerTournamentIds);

        if (nonOwnerTournaments) {
          setOrganizingTournaments(prev => [
            ...prev,
            ...nonOwnerTournaments
          ]);
        }
      }

      const tournamentIds = [...new Set((playingData as any).map((record: any) => record.tournament_id))];
      const tournamentDetails = [];
      for (const tournamentId of tournamentIds) {
        if (owningIds.includes(tournamentId)) continue;

        const { data: tournament } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();

        if (tournament) tournamentDetails.push(tournament);
      }
      setPlayingTournaments(tournamentDetails);
    }

    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.session?.user.id]);

  return (
    <div className="min-h-screen bg-[#160A3A] text-white">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <SpinningLoader />
        </div>
      ) : user ? (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-center sm:text-left mb-2">Account Dashboard</h1>
            <p className="text-gray-300 text-center sm:text-left">Manage your account and tournament activities</p>
          </div>

          {/* User Details Section */}
          <div className="bg-gradient-to-r from-[#2a1a66] to-[#3f2c84] rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-highlight flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{(user as any).name}</h2>
                <p className="text-gray-300">{(user as any).email}</p>
              </div>
              <div className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                <Link href="/api/auth/signout" className="" prefetch={false}><FontAwesomeIcon icon={faSignOutAlt} /> Log Out</Link>
              </div>
            </div>
          </div>

          {/* Tournament Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-gradient-to-r from-[#2a1a66] to-[#3f2c84] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Playing Tournaments</h3>
                  <p className="text-3xl font-bold">{playingTournaments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-highlight flex items-center justify-center">
                  <FontAwesomeIcon icon={faGamepad} className="text-xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2a1a66] to-[#3f2c84] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Organizing Tournaments</h3>
                  <p className="text-3xl font-bold">{organizingTournaments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-highlight flex items-center justify-center">
                  <FontAwesomeIcon icon={faTrophy} className="text-xl text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Lists */}
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-[#2a1a66] to-[#3f2c84] rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Playing Tournaments</h3>
              {playingTournaments.length > 0 ? (
                <ul className="space-y-2">
                  {playingTournaments.slice(0, 5).map(tournament => (
                    <li key={tournament.id} className="text-gray-200">
                      {tournament.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300">You are not playing in any tournaments.</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-[#2a1a66] to-[#3f2c84] rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Organizing Tournaments</h3>
              {organizingTournaments.length > 0 ? (
                <ul className="space-y-2">
                  {organizingTournaments.slice(0, 5).map(tournament => (
                    <li key={tournament.id} className="text-gray-200">
                      {tournament.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300">You are not organizing any tournaments.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-[#2a1a66] rounded-lg max-w-md mx-auto mt-20">
          <h2 className="text-xl font-medium text-gray-300">User Not Found</h2>
          <p className="mt-2 text-gray-400">Please make sure you{"'"}re logged in to view your account details.</p>
        </div>
      )}
    </div>
  );
}