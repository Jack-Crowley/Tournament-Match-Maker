"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useClient } from "@/context/clientContext";
import { User } from "@/types/userType";
import { SpinningLoader } from "@/components/loading";
import { Tournament } from "@/types/tournamentTypes";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faGamepad,
  faUser,
  faSignOutAlt,
  faCalendarAlt,
  faChevronRight,
  faCrown
} from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizingIndex, setOrganizingIndex] = useState<number>(4)
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

  const formatDate = (dateString: any) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#160A3A] to-[#2A1A5E] text-white">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <SpinningLoader />
        </div>
      ) : user ? (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-300">Account Dashboard</h1>
            <p className="text-purple-200/80 text-center text-lg">Manage your account and tournament activities</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User Profile */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-4 shadow-md">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{(user as any).name || "User"}</h2>
                  <p className="text-purple-200/80 mb-4">{(user as any).email || "No email"}</p>

                  <Link href="/api/auth/signout" prefetch={false}>
                    <button className="flex items-center gap-2 bg-red-600/80 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 shadow-md">
                      <FontAwesomeIcon icon={faSignOutAlt} /> Log Out
                    </button>
                  </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/50 flex items-center justify-center mb-2">
                        <FontAwesomeIcon icon={faGamepad} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Playing</h3>
                      <p className="text-2xl font-bold text-purple-300">{playingTournaments.length}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/50 flex items-center justify-center mb-2">
                        <FontAwesomeIcon icon={faTrophy} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Organizing</h3>
                      <p className="text-2xl font-bold text-purple-300">{organizingTournaments.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">Quick Actions</span>
                </h3>
                <div className="space-y-3">
                  <Link href="/tournaments/create">
                    <div className="flex items-center justify-between p-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg transition duration-200 cursor-pointer">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/50 flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faCrown} className="text-white" />
                        </div>
                        <span>Create Tournament</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="text-purple-300" />
                    </div>
                  </Link>

                  <Link href="/tournaments">
                    <div className="flex items-center justify-between p-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg transition duration-200 cursor-pointer">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/50 flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faGamepad} className="text-white" />
                        </div>
                        <span>Browse Tournaments</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="text-purple-300" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column - Tournaments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Playing Tournaments */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FontAwesomeIcon icon={faGamepad} className="text-purple-300 mr-3" />
                  <span>Playing Tournaments</span>
                </h3>

                {playingTournaments.length > 0 ? (
                  <div className="space-y-3">
                    {playingTournaments.map(tournament => (
                      <Link href={`/tournaments/${tournament.id}`} key={tournament.id}>
                        <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition duration-200 cursor-pointer border border-white/5">
                          <div>
                            <h4 className="font-semibold text-lg">{tournament.name}</h4>
                            <div className="flex items-center text-sm text-purple-200/70 mt-1">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                              <span>{formatDate((tournament as any).start_date)}</span>
                            </div>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-purple-300" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                    <p className="text-purple-200/80">You are not playing in any tournaments.</p>
                    <Link href="/tournaments">
                      <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                        Browse Tournaments
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Organizing Tournaments */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FontAwesomeIcon icon={faTrophy} className="text-purple-300 mr-3" />
                  <span>Organizing Tournaments</span>
                </h3>

                {organizingTournaments.length > 0 ? (
                  <div className="space-y-3">
                    {organizingTournaments.slice(0, organizingIndex).map(tournament => (
                      <Link href={`/tournaments/${tournament.id}/manage`} key={tournament.id}>
                        <div className="mb-4 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition duration-200 cursor-pointer border border-white/5">
                          <div>
                            <h4 className="font-semibold text-lg">{tournament.name}</h4>
                            <div className="flex items-center text-sm text-purple-200/70 mt-1">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                              <span>{formatDate((tournament as any).start_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-purple-200/70 text-sm">
                              {tournament.owner === client.session?.user.id && (
                                <span className="px-2 py-1 bg-indigo-600/30 rounded-md text-xs">Owner</span>
                              )}
                            </div>
                            <FontAwesomeIcon icon={faChevronRight} className="text-purple-300" />
                          </div>
                        </div>
                      </Link>
                    ))}

                    {organizingIndex < organizingTournaments.length && (
                      <div className="rounded-xl p-2 text-center">
                        <Link href="/tournaments">
                          <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                            Browse Tournaments
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                    <p className="text-purple-200/80">You are not organizing any tournaments.</p>
                    <Link href="/tournaments/create">
                      <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                        Create Tournament
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-600/50 flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-purple-200/80 mb-6">Please make sure you{"'"}re logged in to view your account details.</p>
            <Link href="/login">
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg transition duration-200">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}