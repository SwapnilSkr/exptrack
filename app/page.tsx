"use client";

import AppShell from "@/components/layout/AppShell";
import DashboardView from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <AppShell>
      {({
        analytics,
        transactions,
        subscriptions,
        timeframe,
        setTimeframe,
        onOpenAddModal,
        onLogSubscription,
      }) => (
        <DashboardView
          analytics={analytics}
          transactions={transactions}
          subscriptions={subscriptions}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          onOpenAddModal={onOpenAddModal}
          onLogSubscription={onLogSubscription}
        />
      )}
    </AppShell>
  );
}
