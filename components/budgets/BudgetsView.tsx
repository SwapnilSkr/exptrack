"use client";

import { useState } from "react";
import { Plus, AlertTriangle, CheckCircle2, Target, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import Dialog from "@/components/ui/Dialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface BudgetsViewProps {
  budgets: any[];
  onRefresh: () => void;
  onSeedData?: () => void;
  userCurrency?: string;
}

export default function BudgetsView({
  budgets,
  onRefresh,
  onSeedData,
  userCurrency = "INR",
}: BudgetsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // Confirm dialog state for budget deletion
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [category, setCategory] = useState("Food");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [currency, setCurrency] = useState(userCurrency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];
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

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategory("Food");
    setMonthlyLimit("");
    setCurrency(userCurrency);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBudget(b);
    setCategory(b.category);
    setMonthlyLimit(b.monthlyLimit.toString());
    setCurrency(b.currency || userCurrency);
    setError("");
    setShowModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !monthlyLimit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          monthlyLimit: Number(monthlyLimit),
          currency,
        }),
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

  const confirmExecuteDelete = async () => {
    if (!deleteBudgetId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/budgets?id=${deleteBudgetId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteBudgetId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Category Budgets</h1>
          <p className="text-xs text-zinc-400">Monthly category spending caps & threshold progress tracking</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Set Category Limit
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {budgets.map((b) => {
          const isOver = b.spent > b.monthlyLimit;
          const isWarning = b.percentage >= 80 && !isOver;
          const bCurrency = b.currency || userCurrency;

          return (
            <div key={b._id} className="ui-card p-4 space-y-3 ui-card-interactive">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{b.category}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    Limit: {formatCurrency(b.monthlyLimit, bCurrency)} / month
                  </p>
                </div>

                <div className="flex items-center gap-2">
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

                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                    title="Edit Budget Limit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteBudgetId(b._id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 font-mono">Spent: {formatCurrency(b.spent, bCurrency)}</span>
                  <span className="text-zinc-400 font-mono">{b.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-white"
                    }`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5 font-mono">
                <span>Remaining: {formatCurrency(b.remaining, bCurrency)}</span>
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
          onAction={handleOpenAdd}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Add / Edit Budget Modal using Shadcn Dialog */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBudget ? "Edit Category Budget Limit" : "Set Category Spending Limit"}
        description="Set a monthly cap for category expenditures."
      >
        {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs mb-3">{error}</div>}

        <form onSubmit={handleSaveBudget} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer font-mono font-medium"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Monthly Limit</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="500.00"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
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
              className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer"
            >
              {loading ? "Saving..." : editingBudget ? "Update Limit" : "Save Limit"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Budget Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteBudgetId)}
        onClose={() => setDeleteBudgetId(null)}
        onConfirm={confirmExecuteDelete}
        title="Delete Category Budget?"
        description="Are you sure you want to remove this monthly category budget limit?"
        confirmLabel="Delete Limit"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
