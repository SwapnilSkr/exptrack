"use client";

import { useState, useEffect, useCallback } from "react";
import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import DashboardView from "@/components/dashboard/DashboardView";
import TransactionsView from "@/components/transactions/TransactionsView";
import SubscriptionsView from "@/components/subscriptions/SubscriptionsView";
import BudgetsView from "@/components/budgets/BudgetsView";
import AccountsView from "@/components/accounts/AccountsView";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeframe, setTimeframe] = useState("monthly");

  // State for data
  const [analytics, setAnalytics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subMetrics, setSubMetrics] = useState<any>({ totalMonthly: 0, totalYearly: 0, activeCount: 0 });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);

  // Filters for Transactions View
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal controls
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editTxData, setEditTxData] = useState<any>(null);

  // Fetch Session
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

  // Fetch Application Data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Analytics
      const resAnalytics = await fetch(`/api/analytics?timeframe=${timeframe}`);
      const dataAnalytics = await resAnalytics.json();
      if (resAnalytics.ok) setAnalytics(dataAnalytics);

      // 2. Transactions
      let txUrl = `/api/transactions?timeframe=${timeframe}`;
      if (filterType !== "all") txUrl += `&type=${filterType}`;
      if (filterCategory !== "all") txUrl += `&category=${filterCategory}`;
      if (searchQuery) txUrl += `&search=${encodeURIComponent(searchQuery)}`;

      const resTx = await fetch(txUrl);
      const dataTx = await resTx.json();
      if (resTx.ok) setTransactions(dataTx.transactions || []);

      // 3. Subscriptions
      const resSub = await fetch("/api/subscriptions");
      const dataSub = await resSub.json();
      if (resSub.ok) {
        setSubscriptions(dataSub.subscriptions || []);
        setSubMetrics(dataSub.metrics || { totalMonthly: 0, totalYearly: 0, activeCount: 0 });
      }

      // 4. Budgets
      const resBudget = await fetch("/api/budgets");
      const dataBudget = await resBudget.json();
      if (resBudget.ok) setBudgets(dataBudget.budgets || []);

      // 5. Accounts
      const resAccounts = await fetch("/api/accounts");
      const dataAccounts = await resAccounts.json();
      if (resAccounts.ok) {
        setAccounts(dataAccounts.accounts || []);
        setTotalAccountBalance(dataAccounts.totalBalance || 0);
      }
    } catch (err) {
      console.error("Error loading financial data:", err);
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

  // Handlers
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
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onSuccess={checkAuth} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        netWorth={analytics?.metrics?.netWorth || totalAccountBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
        onSeedData={handleSeedData}
        onClearData={handleClearData}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <DashboardView
            analytics={analytics}
            transactions={transactions}
            subscriptions={subscriptions}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            onOpenAddModal={() => handleOpenAddModal()}
            onLogSubscription={handleLogSubscription}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            onOpenAddModal={handleOpenAddModal}
            onDeleteTransaction={handleDeleteTransaction}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            filterType={filterType}
            setFilterType={setFilterType}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionsView
            subscriptions={subscriptions}
            metrics={subMetrics}
            accounts={accounts}
            onLogSubscription={handleLogSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "budgets" && <BudgetsView budgets={budgets} onRefresh={fetchData} />}

        {activeTab === "accounts" && (
          <AccountsView accounts={accounts} totalBalance={totalAccountBalance} onRefresh={fetchData} />
        )}
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
