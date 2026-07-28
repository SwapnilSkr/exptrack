"use client";

import { useState } from "react";
import { Repeat, Plus, Zap, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface SubscriptionsViewProps {
  subscriptions: any[];
  metrics: { totalMonthly: number; totalYearly: number; activeCount: number };
  accounts: any[];
  onLogSubscription: (id: string) => void;
  onDeleteSubscription: (id: string) => void;
  onRefresh: () => void;
  onSeedData?: () => void;
}

export default function SubscriptionsView({
  subscriptions,
  metrics,
  accounts,
  onLogSubscription,
  onDeleteSubscription,
  onRefresh,
  onSeedData,
}: SubscriptionsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [category, setCategory] = useState("Subscriptions");
  const [accountId, setAccountId] = useState(accounts.length > 0 ? accounts[0]._id : "");
  const [nextBillingDate, setNextBillingDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !accountId) {
      setError("Please fill in name, amount, and payment account.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: Number(amount),
          billingCycle,
          category,
          accountId,
          nextBillingDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subscription");

      setShowAddModal(false);
      setName("");
      setAmount("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Subscriptions & Recurring</h1>
          <p className="text-xs text-zinc-400">Track recurring software, services, membership renewals & alerts</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Subscription
        </button>
      </div>

      {/* Summary Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="ui-card p-4">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Monthly Commitment</span>
          <h3 className="text-xl font-bold font-mono text-zinc-100 mt-1">{formatCurrency(metrics.totalMonthly || 0)}</h3>
        </div>

        <div className="ui-card p-4">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Annual Commitment</span>
          <h3 className="text-xl font-bold font-mono text-zinc-100 mt-1">{formatCurrency(metrics.totalYearly || 0)}</h3>
        </div>

        <div className="ui-card p-4">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active Services</span>
          <h3 className="text-xl font-bold text-zinc-100 mt-1">{metrics.activeCount || 0} Active</h3>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {subscriptions.map((sub) => {
          const daysLeft = Math.ceil(
            (new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );

          return (
            <div key={sub._id} className="ui-card p-4 flex flex-col justify-between space-y-3 ui-card-interactive">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 uppercase font-semibold">
                      {sub.billingCycle}
                    </span>
                    <span className="text-xs text-zinc-400">{sub.category}</span>
                  </div>
                </div>

                <span className="text-sm font-bold font-mono text-zinc-100">{formatCurrency(sub.amount)}</span>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Next Billing:</span>
                  <span className="text-zinc-200 font-medium">{formatDate(sub.nextBillingDate)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Payment Account:</span>
                  <span className="text-zinc-200 font-medium">{sub.accountId?.name || "Card"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    daysLeft <= 3
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : daysLeft <= 7
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {daysLeft <= 0 ? "Due Today" : `${daysLeft} Days Left`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onLogSubscription(sub._id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Log Expense
                  </button>

                  <button
                    onClick={() => onDeleteSubscription(sub._id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {subscriptions.length === 0 && (
        <EmptyState
          icon={Repeat}
          title="No Active Subscriptions Tracked"
          description="Keep track of your monthly software services, streaming memberships, and recurring billing renewals."
          actionLabel="+ Add Subscription"
          onAction={() => setShowAddModal(true)}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md ui-modal rounded-xl p-5 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Add Subscription</h3>

            {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

            <form onSubmit={handleAddSubscription} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Spotify"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="19.99"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Next Billing Date</label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
                >
                  {loading ? "Adding..." : "Add Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
