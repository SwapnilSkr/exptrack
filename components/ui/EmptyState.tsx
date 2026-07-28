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
  secondaryActionLabel = "Load Demo Data",
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="w-full py-16 px-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
          >
            {actionLabel}
          </button>
        )}

        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
