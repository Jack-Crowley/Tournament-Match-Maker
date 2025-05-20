import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faMapMarkerAlt, faCalendarAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Tournament } from "@/types/tournamentTypes";

interface TournamentInfoProps {
    tournament: Tournament;
}

export function TournamentInfo({ tournament }: TournamentInfoProps) {
    const formatDateTime = (date: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - new Date().getTimezoneOffset());
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (!tournament.location && !tournament.start_time && !tournament.end_time && !tournament.max_players) {
        return null;
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="text-purple-300 mr-3" />
                <span>Tournament Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournament.location && (
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-200" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-200/70">Location</p>
                            <p className="text-white">{tournament.location}</p>
                        </div>
                    </div>
                )}

                {tournament.start_time && (
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-200" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-200/70">Start Time</p>
                            <p className="text-white">{formatDateTime(tournament.start_time)}</p>
                        </div>
                    </div>
                )}

                {tournament.end_time && (
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-200" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-200/70">End Time</p>
                            <p className="text-white">{formatDateTime(tournament.end_time)}</p>
                        </div>
                    </div>
                )}

                {tournament.max_players && (
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faUsers} className="text-purple-200" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-200/70">Player Limit</p>
                            <p className="text-white">{tournament.max_players} players</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 