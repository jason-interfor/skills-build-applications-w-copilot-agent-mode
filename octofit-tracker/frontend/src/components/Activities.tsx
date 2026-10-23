import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getJson<{ activities: Activity[] }>('/api/activities');
        if (!ignore) {
          setActivities(data.activities ?? []);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load activities.');
          setActivities([]);
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
    <CapabilityCard title="Activities" description="Track student activity minutes and points." isLoading={isLoading} error={error} emptyMessage="No activities">
      {activities.length > 0 ? (
        <ul>
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`}>{activity.type} — {activity.minutes} minutes</li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
