"use client";

import { useState } from "react";
import { Plus, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface BudgetsViewProps {
  budgets: any[];
  onRefresh: () => void;
  onSeedData?: () => void;
}

export default function BudgetsView({ budgets, onRefresh, onSeedData }: BudgetsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("Food");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Housing",
    "Food",
    "Transport",
    "Tech",
    "Utilities",
    "Entertainment",
    "Health",
    "Shopping",
    "Subscriptions",
    "General",
  ];

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !monthlyLimit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthlyLimit: Number(monthlyLimit) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save budget");

      setShowModal(false);
      setMonthlyLimit("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Category Budgets</h2>
          <p className="text-xs text-zinc-400">Monthly category spending caps & threshold progress</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Set Category Limit
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {budgets.map((b) => {
          const isOver = b.spent > b.monthlyLimit;
          const isWarning = b.percentage >= 80 && !isOver;

          return (
            <div key={b._id} className="ui-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{b.category}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Limit: {formatCurrency(b.monthlyLimit)} / month</p>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isOver
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : isWarning
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isOver ? (
                    <>
                      <AlertTriangle className="w-3 h-3" /> Over Limit
                    </>
                  ) : isWarning ? (
                    <>
                      <AlertTriangle className="w-3 h-3" /> 80%+ Used
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> On Track
                    </>
                  )}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300">Spent: {formatCurrency(b.spent)}</span>
                  <span className="text-zinc-400">{b.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5">
                <span>Remaining: {formatCurrency(b.remaining)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <EmptyState
          icon={Target}
          title="No Category Budgets Configured"
          description="Set monthly spending limits for categories like Food, Housing, Tech, and Entertainment to control your budget."
          actionLabel="+ Set Category Limit"
          onAction={() => setShowModal(true)}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Set Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm ui-modal rounded-xl p-5 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Set Category Monthly Budget</h3>

            {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="500"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 rounded-md text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                >
                  {loading ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
