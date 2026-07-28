"use client";

import { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: any;
  accounts: any[];
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  editTransaction,
  accounts,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [notes, setNotes] = useState("");
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
    "Salary",
    "Freelance",
    "General",
  ];

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || "expense");
      setTitle(editTransaction.title || "");
      setAmount(editTransaction.amount?.toString() || "");
      setCategory(editTransaction.category || "General");
      setAccountId(editTransaction.accountId?._id || editTransaction.accountId || "");
      setToAccountId(editTransaction.toAccountId?._id || editTransaction.toAccountId || "");
      setDate(
        editTransaction.date
          ? new Date(editTransaction.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setTags(Array.isArray(editTransaction.tags) ? editTransaction.tags.join(", ") : "");
      setPaymentMethod(editTransaction.paymentMethod || "Card");
      setNotes(editTransaction.notes || "");
    } else {
      setType("expense");
      setTitle("");
      setAmount("");
      setCategory("General");
      if (accounts && accounts.length > 0) {
        setAccountId(accounts[0]._id);
        if (accounts.length > 1) setToAccountId(accounts[1]._id);
      }
      setDate(new Date().toISOString().split("T")[0]);
      setTags("");
      setPaymentMethod("Card");
      setNotes("");
    }
  }, [editTransaction, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId) {
      setError("Please fill in title, amount, and account.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = editTransaction ? `/api/transactions/${editTransaction._id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          type,
          category,
          accountId,
          toAccountId: type === "transfer" ? toAccountId : undefined,
          date,
          tags,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save transaction");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-md ui-modal rounded-xl p-5 border border-zinc-800 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">
            {editTransaction ? "Edit Transaction" : "Add Transaction"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {/* Type selector */}
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  type === t
                    ? t === "expense"
                      ? "bg-rose-600 text-white"
                      : t === "income"
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="Grocery Run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Amount ($)</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full ui-input pl-7 pr-3 py-1.5 rounded-md text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {type === "transfer" ? "From Account" : "Account"}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} (${acc.balance})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {type === "transfer" && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">To Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} (${acc.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full ui-input px-3 py-1.5 rounded-md text-xs cursor-pointer"
              >
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Apple Pay">Apple / Google Pay</option>
                <option value="Crypto">Crypto Wallet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              placeholder="Vacation, Work"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full ui-input px-3 py-1.5 rounded-md text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Additional detail..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full ui-input px-3 py-1.5 rounded-md text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving..." : editTransaction ? "Update Entry" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
