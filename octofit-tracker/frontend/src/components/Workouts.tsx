import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const email = 'mona@example.com';
        const data = await getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
        if (!ignore) {
          setSuggestions(data.suggestions ?? []);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load workout suggestions.');
          setSuggestions([]);
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
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." isLoading={isLoading} error={error} emptyMessage="No workout suggestions">
      {suggestions.length > 0 ? (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`}>{suggestion.title}{suggestion.reason ? ` — ${suggestion.reason}` : ''}</li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
