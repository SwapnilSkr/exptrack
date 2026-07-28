"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TransactionsViewProps {
  transactions: any[];
  accounts: any[];
  onOpenAddModal: (tx?: any) => void;
  onDeleteTransaction: (id: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSeedData?: () => void;
}

export default function TransactionsView({
  transactions,
  accounts,
  onOpenAddModal,
  onDeleteTransaction,
  timeframe,
  setTimeframe,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  searchQuery,
  setSearchQuery,
  onSeedData,
}: TransactionsViewProps) {
  // Confirm dialog state for transaction deletion
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ["Title", "Type", "Amount", "Category", "Account", "Date", "PaymentMethod", "Tags", "Notes"];
    const rows = transactions.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.amount,
      t.category,
      `"${t.accountId?.name || ""}"`,
      new Date(t.date).toISOString().split("T")[0],
      t.paymentMethod || "Card",
      `"${(t.tags || []).join(",")}"`,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ExpTrack_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmExecuteDelete = async () => {
    if (!deleteTxId) return;
    setActionLoading(true);
    try {
      await onDeleteTransaction(deleteTxId);
      setDeleteTxId(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Transactions</h2>
          <p className="text-xs text-zinc-400">Complete historical financial ledger</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => onOpenAddModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ui-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ui-input pl-9 pr-3 py-1.5 text-xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Timeframe selector */}
          <div className="flex bg-zinc-900 p-0.5 rounded border border-zinc-800">
            {["daily", "monthly", "yearly", "all"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                  timeframe === tf ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Type dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="ui-input px-2.5 py-1 text-xs cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="transfer">Transfers</option>
          </select>

          {/* Category dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="ui-input px-2.5 py-1 text-xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 font-medium border-b border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Transaction</th>
                <th className="p-3">Category</th>
                <th className="p-3">Account</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                          tx.type === "income"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : tx.type === "expense"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : tx.type === "expense" ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{tx.title}</p>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {tx.tags.map((tag: string, i: number) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-zinc-300 font-medium">{tx.category}</td>

                  <td className="p-3 text-zinc-400">{tx.accountId?.name || "Wallet"}</td>

                  <td className="p-3 text-zinc-400">{formatDate(tx.date)}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === "income"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : tx.type === "expense"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <span
                      className={`font-semibold font-mono ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : tx.type === "expense"
                          ? "text-rose-400"
                          : "text-blue-400"
                      }`}
                    >
                      {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                      {formatCurrency(tx.amount, tx.currency || tx.accountId?.currency || "INR")}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onOpenAddModal(tx)}
                        className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTxId(tx._id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No Transactions Found"
          description="Log income, expenses, or transfers to build your financial ledger history."
          actionLabel="+ Add Transaction"
          onAction={() => onOpenAddModal()}
          onSecondaryAction={onSeedData}
        />
      )}

      {/* Delete Transaction Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTxId)}
        onClose={() => setDeleteTxId(null)}
        onConfirm={confirmExecuteDelete}
        title="Delete Transaction Entry?"
        description="Are you sure you want to delete this transaction entry? This will revert its effect on your wallet balance."
        confirmLabel="Delete Transaction"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
