"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

interface AppShellProps {
  children: (props: {
    user: any;
    analytics: any;
    transactions: any[];
    subscriptions: any[];
    subMetrics: any;
    budgets: any[];
    accounts: any[];
    totalAccountBalance: number;
    timeframe: string;
    setTimeframe: (tf: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    filterCategory: string;
    setFilterCategory: (cat: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onOpenAddModal: (tx?: any) => void;
    onDeleteTransaction: (id: string) => void;
    onLogSubscription: (subId: string) => void;
    onDeleteSubscription: (id: string) => void;
    onSeedData: () => void;
    onClearData: () => void;
    fetchData: () => void;
    userCurrency: string;
    handleCurrencyChange: (newCurrency: string) => Promise<void>;
    dataLoading: boolean;
  }) => ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [timeframe, setTimeframe] = useState("monthly");
  const [dataLoading, setDataLoading] = useState(true);

  // Data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subMetrics, setSubMetrics] = useState<any>({ totalMonthly: 0, totalYearly: 0, activeCount: 0 });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);

  // Transaction Filters
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal controls
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editTxData, setEditTxData] = useState<any>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);

    try {
      const [resAnalytics, resTx, resSub, resBudget, resAccounts] = await Promise.all([
        fetch(`/api/analytics?timeframe=${timeframe}`),
        fetch(`/api/transactions?timeframe=${timeframe}${filterType !== "all" ? `&type=${filterType}` : ""}${filterCategory !== "all" ? `&category=${filterCategory}` : ""}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`),
        fetch("/api/subscriptions"),
        fetch("/api/budgets"),
        fetch("/api/accounts"),
      ]);

      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resTx.ok) {
        const dTx = await resTx.json();
        setTransactions(dTx.transactions || []);
      }
      if (resSub.ok) {
        const dSub = await resSub.json();
        setSubscriptions(dSub.subscriptions || []);
        setSubMetrics(dSub.metrics || { totalMonthly: 0, totalYearly: 0, activeCount: 0 });
      }
      if (resBudget.ok) {
        const dBudget = await resBudget.json();
        setBudgets(dBudget.budgets || []);
      }
      if (resAccounts.ok) {
        const dAcc = await resAccounts.json();
        setAccounts(dAcc.accounts || []);
        setTotalAccountBalance(dAcc.totalBalance || 0);
      }
    } catch (err) {
      console.error("Error loading financial data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user, timeframe, filterType, filterCategory, searchQuery]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      setUser((prev: any) => (prev ? { ...prev, currency: newCurrency } : prev));
      const res = await fetch("/api/user/currency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = (tx?: any) => {
    setEditTxData(tx || null);
    setIsAddTxOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction entry?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogSubscription = async (subId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/log`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || "Failed to log subscription expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Delete this recurring subscription?")) return;
    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Do you want to purge all sample & test data for your account?")) return;
    try {
      const res = await fetch("/api/clear-sample?mode=all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onSuccess={checkAuth} />;
  }

  const userCurrency = user.currency || "USD";

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        netWorth={analytics?.metrics?.netWorth || totalAccountBalance}
        onOpenAddModal={() => handleOpenAddModal()}
        onSeedData={handleSeedData}
        onClearData={handleClearData}
        onLogout={handleLogout}
        onCurrencyChange={handleCurrencyChange}
      />

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children({
          user,
          analytics,
          transactions,
          subscriptions,
          subMetrics,
          budgets,
          accounts,
          totalAccountBalance,
          timeframe,
          setTimeframe,
          filterType,
          setFilterType,
          filterCategory,
          setFilterCategory,
          searchQuery,
          setSearchQuery,
          onOpenAddModal: handleOpenAddModal,
          onDeleteTransaction: handleDeleteTransaction,
          onLogSubscription: handleLogSubscription,
          onDeleteSubscription: handleDeleteSubscription,
          onSeedData: handleSeedData,
          onClearData: handleClearData,
          fetchData,
          userCurrency,
          handleCurrencyChange,
          dataLoading,
        })}
      </main>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={fetchData}
        editTransaction={editTxData}
        accounts={accounts}
      />
    </div>
  );
}
