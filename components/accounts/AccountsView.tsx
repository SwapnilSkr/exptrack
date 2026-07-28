"use client";

import { useState } from "react";
import { CreditCard, Landmark, PiggyBank, Wallet, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface AccountsViewProps {
  accounts: any[];
  totalBalance: number;
  onRefresh: () => void;
  onSeedData?: () => void;
}

export default function AccountsView({ accounts, totalBalance, onRefresh, onSeedData }: AccountsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          balance: Number(balance) || 0,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add account");

      setShowAddModal(false);
      setName("");
      setBalance("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case "savings":
        return PiggyBank;
      case "credit":
        return CreditCard;
      case "cash":
        return Wallet;
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Wallets & Accounts</h1>
          <p className="text-xs text-zinc-400">Manage checking, savings, credit cards, and cash wallets</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Wallet
        </button>
      </div>

      {/* Net Balance Header Card */}
      <div className="ui-card p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Combined Total Balance</span>
          <h3 className="text-2xl font-bold font-mono text-zinc-100 mt-0.5">{formatCurrency(totalBalance)}</h3>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);

          return (
            <div key={acc._id} className="ui-card p-4 flex flex-col justify-between space-y-3 ui-card-interactive">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{acc.name}</h3>
                    <span className="text-[10px] text-zinc-400 uppercase font-medium">{acc.type}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAccount(acc._id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400">Current Balance</span>
                <h4 className={`text-xl font-bold font-mono mt-0.5 ${acc.balance < 0 ? "text-rose-400" : "text-zinc-100"}`}>
                  {formatCurrency(acc.balance)}
                </h4>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No Wallets or Accounts Configured"
          description="Add bank accounts, credit cards, or cash wallets to start tracking your net worth and balances."
          actionLabel="+ Add Wallet"
          onAction={() => setShowAddModal(true)}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm ui-modal rounded-xl p-5 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Add New Wallet / Account</h3>

            {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="Chase Checking, Amex Gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="investment">Investment</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Initial Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs"
                  />
                </div>
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
                  {loading ? "Adding..." : "Add Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
