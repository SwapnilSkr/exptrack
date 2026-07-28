"use client";

import AppShell from "@/components/layout/AppShell";
import TransactionsView from "@/components/transactions/TransactionsView";

export default function TransactionsPage() {
  return (
    <AppShell>
      {({
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
      }) => (
        <TransactionsView
          transactions={transactions}
          accounts={accounts}
          onOpenAddModal={onOpenAddModal}
          onDeleteTransaction={onDeleteTransaction}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSeedData={onSeedData}
        />
      )}
    </AppShell>
  );
}
