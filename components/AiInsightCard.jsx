"use client";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, SparklesIcon } from "lucide-react";

const trendConfig = {
  up: { icon: TrendingUpIcon, className: "bg-emerald-500/15 text-emerald-400" },
  down: { icon: TrendingDownIcon, className: "bg-red-500/15 text-red-400" },
  flat: { icon: MinusIcon, className: "bg-slate-500/15 text-slate-400" },
};

export default function AiInsightCard({ title, insight, loading }) {
  if (loading) {
    return <div className="bg-panel border border-white/10 rounded-2xl p-6 h-44 animate-pulse" />;
  }

  if (!insight) {
    return (
      <div className="bg-panel border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon size={18} className="text-accent" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-muted">
          No AI insight generated yet. Check back after the next weekly report.
        </p>
      </div>
    );
  }

  const { summary, trend, actions } = insight.content || {};
  const trendInfo = trendConfig[trend] || trendConfig.flat;
  const TrendIcon = trendInfo.icon;

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon size={18} className="text-accent" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${trendInfo.className}`}
          >
            <TrendIcon size={12} /> {trend}
          </span>
        )}
      </div>

      {summary && <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>}

      {actions?.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {actions.map((action, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-accent shrink-0">•</span>
              {action}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-slate-500 mt-4">
        Generated{" "}
        {new Date(insight.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
