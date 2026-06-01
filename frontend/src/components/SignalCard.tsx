import { feedbackApi } from '../api/client';
import { useState } from 'react';

interface Signal {
  id: string;
  entityName: string;
  entityDomain?: string | null;
  type: string;
  summary: string;
  confidence: number;
  evidence: any;
  detectedAt: string;
  relevanceScore?: number;
  feedbackCount?: { relevant: number; irrelevant: number };
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  PRICING_CHANGE: { label: 'Pricing Change', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: '$' },
  FEATURE_LAUNCH: { label: 'Feature Launch', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: '★' },
  POSITIONING_CHANGE: { label: 'Positioning Shift', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: '⟳' },
  HIRING_SPIKE: { label: 'Hiring Spike', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30', icon: '⬆' },
};

export default function SignalCard({ signal }: { signal: Signal }) {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const config = typeConfig[signal.type] || { label: signal.type, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: '•' };

  const handleFeedback = async (relevant: boolean) => {
    try {
      await feedbackApi.submit({ signalId: signal.id, relevant });
      setFeedbackGiven(relevant);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </span>
          {signal.relevanceScore !== undefined && (
            <span className="text-xs text-gray-500">
              {Math.round(signal.relevanceScore * 100)}% relevant
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(signal.detectedAt).toLocaleDateString()}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-gray-100 mb-1">
        {signal.entityName}
        {signal.entityDomain && (
          <span className="text-gray-500 font-normal ml-1.5">({signal.entityDomain})</span>
        )}
      </h3>
      <p className="text-sm text-gray-300 mb-3">{signal.summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-16 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${signal.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {Math.round(signal.confidence * 100)}% confidence
          </span>
        </div>

        <div className="flex items-center gap-2">
          {signal.feedbackCount && (
            <span className="text-xs text-gray-500">
              +{signal.feedbackCount.relevant} -{signal.feedbackCount.irrelevant}
            </span>
          )}
          <button
            onClick={() => handleFeedback(true)}
            className={`p-1 rounded transition-colors ${
              feedbackGiven === true
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-gray-500 hover:text-emerald-400'
            }`}
            title="Relevant"
          >
            ▲
          </button>
          <button
            onClick={() => handleFeedback(false)}
            className={`p-1 rounded transition-colors ${
              feedbackGiven === false
                ? 'text-red-400 bg-red-400/10'
                : 'text-gray-500 hover:text-red-400'
            }`}
            title="Not relevant"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
