"use client";

import { LucideIcon, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel = "Load Sample Data",
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="ui-card p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 space-y-4">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            {actionLabel}
          </button>
        )}

        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
