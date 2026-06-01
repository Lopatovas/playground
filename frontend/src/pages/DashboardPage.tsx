import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entitiesApi, feedApi } from '../api/client';
import SignalCard from '../components/SignalCard';

export default function DashboardPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entitiesApi.list().then((r) => setEntities(r.data)),
      feedApi.dailyBrief().then((r) => setBrief(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalCompetitors = entities.reduce(
    (sum, e) => sum + (e.competitors?.length || 0),
    0,
  );
  const totalSources = entities.reduce(
    (sum, e) => sum + (e._count?.sources || 0),
    0,
  );
  const totalSignals = entities.reduce(
    (sum, e) => sum + (e._count?.signals || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your competitive intelligence overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Entities', value: entities.length, color: 'text-indigo-400' },
          { label: 'Competitors', value: totalCompetitors, color: 'text-amber-400' },
          { label: 'Sources', value: totalSources, color: 'text-emerald-400' },
          { label: 'Signals', value: totalSignals, color: 'text-sky-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {entities.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Get Started</h3>
          <p className="text-gray-400 mb-4">
            Add your company and competitors to start receiving intelligence.
          </p>
          <Link
            to="/entities"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Add Your First Entity
          </Link>
        </div>
      ) : (
        <>
          {brief && brief.sections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-100 mb-4">
                Daily Brief — {brief.date}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {brief.sections.flatMap((section: any) =>
                  section.items.map((item: any) => (
                    <SignalCard key={item.id} signal={item} />
                  )),
                )}
              </div>
            </div>
          )}

          {brief && brief.sections.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-400">
                No signals detected today. Check back later or{' '}
                <Link to="/entities" className="text-indigo-400 hover:text-indigo-300">
                  add more competitors
                </Link>
                .
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
