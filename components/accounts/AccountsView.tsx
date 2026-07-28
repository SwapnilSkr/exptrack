"use client";

import { useState } from "react";
import { CreditCard, Landmark, PiggyBank, Wallet, Plus, Trash2, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface AccountsViewProps {
  accounts: any[];
  totalBalance: number;
  onRefresh: () => void;
  onSeedData?: () => void;
  userCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function AccountsView({
  accounts,
  totalBalance,
  onRefresh,
  onSeedData,
  userCurrency = "USD",
  onCurrencyChange,
}: AccountsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName("");
    setType("checking");
    setBalance("");
    setColor("#3b82f6");
    setCurrency(userCurrency);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setColor(acc.color || "#3b82f6");
    setCurrency(acc.currency || userCurrency);
    setError("");
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError("");

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount._id}` : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          balance: Number(balance) || 0,
          color,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save account");

      // Auto-sync global user currency preference when setting/editing account currency
      if (currency && currency !== userCurrency && onCurrencyChange) {
        await onCurrencyChange(currency);
      }

      setShowModal(false);
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
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Wallets & Accounts</h1>
          <p className="text-xs text-zinc-400">Manage checking, savings, credit cards, cash, and balances</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Wallet
        </button>
      </div>

      {/* Net Balance Header Card */}
      <div className="ui-card p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Combined Total Balance ({userCurrency})</span>
          <h3 className="text-2xl font-bold font-mono text-zinc-100 mt-0.5">{formatCurrency(totalBalance, userCurrency)}</h3>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);
          const accCurrency = acc.currency || userCurrency;

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

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                    title="Edit Wallet & Balance"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteAccount(acc._id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    title="Delete Wallet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400">Current Balance</span>
                <h4 className={`text-xl font-bold font-mono mt-0.5 ${acc.balance < 0 ? "text-rose-400" : "text-zinc-100"}`}>
                  {formatCurrency(acc.balance, accCurrency)}
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
          onAction={handleOpenAdd}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Add / Edit Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm ui-modal rounded-xl p-5 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              {editingAccount ? "Edit Wallet & Balance" : "Add New Wallet / Account"}
            </h3>

            {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

            <form onSubmit={handleSaveAccount} className="space-y-3">
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
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full ui-input px-3 py-1.5 text-xs"
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
                  className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
                >
                  {loading ? "Saving..." : editingAccount ? "Update Wallet" : "Add Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
