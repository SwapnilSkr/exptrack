"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Zap,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

interface DashboardViewProps {
  analytics: any;
  transactions: any[];
  subscriptions: any[];
  timeframe: string;
  setTimeframe: (tf: string) => void;
  onOpenAddModal: () => void;
  onLogSubscription: (subId: string) => void;
}

export default function DashboardView({
  analytics,
  transactions,
  subscriptions,
  timeframe,
  setTimeframe,
  onOpenAddModal,
  onLogSubscription,
}: DashboardViewProps) {
  const metrics = analytics?.metrics || {
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    savingsRate: 0,
    monthlySubscriptionCost: 0,
  };

  const trendData = analytics?.trendData || [];
  const categoryData = analytics?.categoryData || [];

  const upcomingSubscriptions = (subscriptions || []).filter((sub) => sub.status === "active").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Net Worth */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Net Worth</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{formatCurrency(metrics.netWorth)}</h3>
            <p className="text-[11px] text-zinc-500 mt-1">Combined balance across accounts</p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Monthly Income</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">{formatCurrency(metrics.monthlyIncome)}</h3>
            <p className="text-[11px] text-emerald-500/90 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3 h-3" /> Incoming cash flow
            </p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Monthly Expenses</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-rose-400 tracking-tight">{formatCurrency(metrics.monthlyExpense)}</h3>
            <p className="text-[11px] text-rose-500/90 mt-1 flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3 h-3" /> Outflow tracking
            </p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Savings Rate</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-blue-400 tracking-tight">{metrics.savingsRate}%</h3>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.savingsRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Subscriptions</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-purple-400 tracking-tight">{formatCurrency(metrics.monthlySubscriptionCost)}</h3>
            <p className="text-[11px] text-zinc-500 mt-1">Est. monthly recurring</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expense Chart */}
        <div className="lg:col-span-2 ui-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Cash Flow Breakdown
              </h3>
              <p className="text-xs text-zinc-400">Income & Expense trend</p>
            </div>

            {/* Timeframe Selector */}
            <div className="flex bg-zinc-900 p-0.5 rounded-md border border-zinc-800 self-start sm:self-auto">
              {["daily", "monthly", "yearly"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                    timeframe === tf ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "0.5rem",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="ui-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              Category Breakdown
            </h3>
            <p className="text-xs text-zinc-400">Spending by category</p>
          </div>

          {categoryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "0.5rem",
                      color: "#f4f4f5",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "Spent"]}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-zinc-500 text-xs">
              <p>No expense data logged</p>
              <button
                onClick={onOpenAddModal}
                className="mt-3 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                + Add Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Subscriptions Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 ui-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Recent Transactions
            </h3>
            <button
              onClick={onOpenAddModal}
              className="text-xs font-medium text-blue-400 hover:underline cursor-pointer"
            >
              + Quick Add
            </button>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx._id}
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : tx.type === "expense"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "↔"}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{tx.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      tx.type === "income"
                        ? "text-emerald-400"
                        : tx.type === "expense"
                        ? "text-zinc-100"
                        : "text-blue-400"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </span>
                  {tx.accountId && (
                    <p className="text-[10px] text-zinc-500">{tx.accountId.name || "Wallet"}</p>
                  )}
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No recent transactions. Click "Load Sample Data" or "+ Add Transaction" to start!
              </div>
            )}
          </div>
        </div>

        {/* Subscriptions Watchlist */}
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-purple-400" />
              Upcoming Renewals
            </h3>
          </div>

          <div className="space-y-2.5">
            {upcomingSubscriptions.map((sub) => (
              <div
                key={sub._id}
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{sub.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Due: {formatDate(sub.nextBillingDate)} ({sub.billingCycle})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-300">{formatCurrency(sub.amount)}</span>
                  <button
                    onClick={() => onLogSubscription(sub._id)}
                    title="1-Click Log Expense Now"
                    className="p-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {upcomingSubscriptions.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">No active subscriptions configured</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
