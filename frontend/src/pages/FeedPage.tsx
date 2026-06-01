import { useEffect, useState } from 'react';
import { feedApi } from '../api/client';
import SignalCard from '../components/SignalCard';

const signalTypes = [
  { value: '', label: 'All Types' },
  { value: 'PRICING_CHANGE', label: 'Pricing Changes' },
  { value: 'FEATURE_LAUNCH', label: 'Feature Launches' },
  { value: 'POSITIONING_CHANGE', label: 'Positioning Shifts' },
  { value: 'HIRING_SPIKE', label: 'Hiring Spikes' },
];

export default function FeedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    feedApi
      .get({
        type: type || undefined,
        days,
        limit: 50,
      })
      .then((r) => {
        setItems(r.data.items);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [type, days]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Intelligence Feed</h1>
        <p className="text-gray-400 mt-1">Ranked competitive signals across all your entities</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
        >
          {signalTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
        >
          <option value={1}>Last 24h</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
        <span className="text-sm text-gray-500">{total} signals found</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <SignalCard key={item.id} signal={item} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          No signals found for the selected filters.
        </div>
      )}
    </div>
  );
}
