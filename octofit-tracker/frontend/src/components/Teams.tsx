import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getJson<{ teams: Team[] }>('/api/teams');
        if (!ignore) {
          setTeams(data.teams ?? []);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load teams.');
          setTeams([]);
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
    <CapabilityCard title="Teams" description="Manage teams and members." isLoading={isLoading} error={error} emptyMessage="No teams">
      {teams.length > 0 ? (
        <ul>
          {teams.map((team, index) => (
            <li key={`${team.name}-${index}`}>{team.name} — {team.members.length} members</li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
