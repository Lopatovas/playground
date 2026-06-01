import { useEffect, useState } from 'react';
import { entitiesApi, sourcesApi } from '../api/client';

interface CompetitorRelation {
  id: string;
  muted: boolean;
  competitorEntityId: string;
  competitor: { id: string; name: string; domain?: string };
}

interface Entity {
  id: string;
  name: string;
  normalizedName: string;
  domain?: string;
  competitors: CompetitorRelation[];
  _count: { sources: number; signals: number; documents?: number };
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityDomain, setNewEntityDomain] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [competitorName, setCompetitorName] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [discovering, setDiscovering] = useState<string | null>(null);

  const load = () => {
    entitiesApi.list().then((r) => {
      setEntities(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    await entitiesApi.create({ name: newEntityName, domain: newEntityDomain || undefined });
    setNewEntityName('');
    setNewEntityDomain('');
    setShowCreateForm(false);
    load();
  };

  const handleAddCompetitor = async (e: React.FormEvent, entityId: string) => {
    e.preventDefault();
    await entitiesApi.addCompetitor(entityId, {
      name: competitorName,
      domain: competitorDomain || undefined,
    });
    setCompetitorName('');
    setCompetitorDomain('');
    setSelectedEntity(null);
    load();
  };

  const handleDiscover = async (entityId: string) => {
    setDiscovering(entityId);
    try {
      await sourcesApi.discover(entityId);
    } finally {
      setDiscovering(null);
      load();
    }
  };

  const handleToggleMute = async (entityId: string, competitorId: string) => {
    await entitiesApi.toggleMute(entityId, competitorId);
    load();
  };

  const handleRemoveCompetitor = async (entityId: string, competitorId: string) => {
    await entitiesApi.removeCompetitor(entityId, competitorId);
    load();
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (confirm('Delete this entity and all its data?')) {
      await entitiesApi.delete(entityId);
      load();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Entities</h1>
          <p className="text-gray-400 mt-1">Manage your company and competitors</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          + Add Entity
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateEntity} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-200">New Entity</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Company name"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="text"
              value={newEntityDomain}
              onChange={(e) => setNewEntityDomain(e.target.value)}
              placeholder="Domain (optional)"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">
              Create
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {entities.map((entity) => (
          <div key={entity.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-100 text-lg">{entity.name}</h3>
                {entity.domain && <span className="text-sm text-gray-400">{entity.domain}</span>}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{entity._count.sources} sources</span>
                  <span>{entity._count.signals} signals</span>
                </div>
                <button
                  onClick={() => handleDiscover(entity.id)}
                  disabled={discovering === entity.id}
                  className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {discovering === entity.id ? 'Discovering...' : 'Discover Sources'}
                </button>
                <button
                  onClick={() => handleDeleteEntity(entity.id)}
                  className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {entity.competitors.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Competitors</h4>
                <div className="flex flex-wrap gap-2">
                  {entity.competitors.map((c) => (
                    <div key={c.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                      c.muted ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-800 border-gray-700 text-gray-200'
                    }`}>
                      <span>{c.competitor.name}</span>
                      <button
                        onClick={() => handleToggleMute(entity.id, c.competitorEntityId)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                        title={c.muted ? 'Unmute' : 'Mute'}
                      >
                        {c.muted ? '🔇' : '🔊'}
                      </button>
                      <button
                        onClick={() => handleRemoveCompetitor(entity.id, c.competitorEntityId)}
                        className="text-xs text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEntity === entity.id ? (
              <form onSubmit={(e) => handleAddCompetitor(e, entity.id)} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="Competitor name"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  placeholder="Domain (optional)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">
                  Add
                </button>
                <button type="button" onClick={() => setSelectedEntity(null)} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm">
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSelectedEntity(entity.id)}
                className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
              >
                + Add Competitor
              </button>
            )}
          </div>
        ))}

        {entities.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
            No entities yet. Click "Add Entity" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
