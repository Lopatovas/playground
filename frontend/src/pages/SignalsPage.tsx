import { useEffect, useState } from 'react';
import { signalsApi, entitiesApi } from '../api/client';
import SignalCard from '../components/SignalCard';

const signalTypes = [
  { value: '', label: 'All Types' },
  { value: 'PRICING_CHANGE', label: 'Pricing Changes' },
  { value: 'FEATURE_LAUNCH', label: 'Feature Launches' },
  { value: 'POSITIONING_CHANGE', label: 'Positioning Shifts' },
  { value: 'HIRING_SPIKE', label: 'Hiring Spikes' },
];

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityId, setEntityId] = useState('');
  const [type, setType] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    entitiesApi.list().then((r) => setEntities(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    signalsApi
      .list({
        entityId: entityId || undefined,
        type: type || undefined,
        limit: 50,
      })
      .then((r) => {
        setSignals(r.data.signals);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [entityId, type]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      await signalsApi.extract(entityId || undefined);
      const r = await signalsApi.list({
        entityId: entityId || undefined,
        type: type || undefined,
        limit: 50,
      });
      setSignals(r.data.signals);
      setTotal(r.data.total);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Signals</h1>
          <p className="text-gray-400 mt-1">All extracted competitive signals</p>
        </div>
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {extracting ? 'Extracting...' : 'Extract New Signals'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Entities</option>
          {entities.map((e: any) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
        >
          {signalTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} signals</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : signals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {signals.map((s: any) => (
            <SignalCard
              key={s.id}
              signal={{
                id: s.id,
                entityName: s.entity.name,
                entityDomain: s.entity.domain,
                type: s.type,
                summary: s.summary,
                confidence: s.confidence,
                evidence: s.evidence,
                detectedAt: s.detectedAt,
                feedbackCount: {
                  relevant: s.feedback?.filter((f: any) => f.relevant).length || 0,
                  irrelevant: s.feedback?.filter((f: any) => !f.relevant).length || 0,
                },
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          No signals found. Try extracting signals from ingested documents.
        </div>
      )}
    </div>
  );
}
