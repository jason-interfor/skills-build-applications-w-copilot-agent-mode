import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!ignore) {
          setLeaderboard(data.leaderboard ?? []);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load leaderboard.');
          setLeaderboard([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." isLoading={isLoading} error={error} emptyMessage="No leaderboard">
      {leaderboard.length > 0 ? (
        <ul>
          {leaderboard.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`}>{entry.teamName}: {entry.totalPoints} points</li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
