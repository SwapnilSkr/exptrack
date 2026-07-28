"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("General");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Credit / Debit Card");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];
  const categories = [
    "General",
    "Food",
    "Housing",
    "Tech",
    "Entertainment",
    "Transport",
    "Subscriptions",
    "Health",
    "Shopping",
    "Salary",
    "Freelance",
    "Investment",
  ];

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || "expense");
      setTitle(editTransaction.title || "");
      setAmount(editTransaction.amount ? editTransaction.amount.toString() : "");
      setCurrency(editTransaction.currency || "USD");
      setCategory(editTransaction.category || "General");
      setAccountId(editTransaction.accountId?._id || editTransaction.accountId || "");
      setToAccountId(editTransaction.toAccountId?._id || editTransaction.toAccountId || "");
      setDate(
        editTransaction.date
          ? new Date(editTransaction.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setPaymentMethod(editTransaction.paymentMethod || "Credit / Debit Card");
      setTags(editTransaction.tags ? editTransaction.tags.join(", ") : "");
      setNotes(editTransaction.notes || "");
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]);

  // When selected account changes, auto-sync input currency to matching account currency
  useEffect(() => {
    if (accountId && accounts.length > 0) {
      const selectedAcc = accounts.find((a) => a._id === accountId);
      if (selectedAcc && selectedAcc.currency) {
        setCurrency(selectedAcc.currency);
      }
    } else if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0]._id);
      if (accounts[0].currency) {
        setCurrency(accounts[0].currency);
      }
    }
  }, [accountId, accounts]);

  const resetForm = () => {
    setType("expense");
    setTitle("");
    setAmount("");
    const defaultAcc = accounts.length > 0 ? accounts[0] : null;
    setAccountId(defaultAcc ? defaultAcc._id : "");
    setCurrency(defaultAcc && defaultAcc.currency ? defaultAcc.currency : "USD");
    setToAccountId(accounts.length > 1 ? accounts[1]._id : "");
    setCategory("General");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Credit / Debit Card");
    setTags("");
    setNotes("");
    setError("");
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId) {
      setError("Please fill in transaction title, amount, and account.");
      return;
    }

    if (type === "transfer" && !toAccountId) {
      setError("Destination account required for transfer.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = editTransaction ? `/api/transactions/${editTransaction._id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          amount: Number(amount),
          currency,
          category,
          accountId,
          toAccountId: type === "transfer" ? toAccountId : undefined,
          date,
          paymentMethod,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
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

  const currencySymbolMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
  };

  const currentSymbol = currencySymbolMap[currency] || "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
      <div className="w-full max-w-md ui-modal rounded-xl p-5 border border-zinc-800 space-y-4 my-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {editTransaction ? "Edit Transaction" : "Add Transaction"}
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Type Selector Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                type === t
                  ? t === "expense"
                    ? "bg-rose-500 text-white"
                    : t === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="Grocery Run, Salary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer font-mono font-medium"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c} ({currencySymbolMap[c]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Amount ({currentSymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono font-bold text-zinc-400">
                {currentSymbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full ui-input pl-7 pr-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {type === "transfer" ? "From Account" : "Account"}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({formatCurrency(acc.balance, acc.currency || "USD")})
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
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({formatCurrency(acc.balance, acc.currency || "USD")})
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
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full ui-input px-3 py-1.5 text-xs cursor-pointer"
              >
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI / Direct Transfer">UPI / Direct Transfer</option>
                <option value="Auto-Pay">Auto-Pay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              placeholder="Groceries, Vacation, Work"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full ui-input px-3 py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full ui-input px-3 py-1.5 text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer"
            >
              {loading ? "Saving..." : editTransaction ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
