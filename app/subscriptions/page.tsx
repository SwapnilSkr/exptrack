"use client";

import AppShell from "@/components/layout/AppShell";
import SubscriptionsView from "@/components/subscriptions/SubscriptionsView";

export default function SubscriptionsPage() {
  return (
    <AppShell>
      {({
        subscriptions,
        subMetrics,
        accounts,
        onLogSubscription,
        onDeleteSubscription,
        fetchData,
        onSeedData,
        userCurrency,
      }) => (
        <SubscriptionsView
          subscriptions={subscriptions}
          metrics={subMetrics}
          accounts={accounts}
          onLogSubscription={onLogSubscription}
          onDeleteSubscription={onDeleteSubscription}
          onRefresh={fetchData}
          onSeedData={onSeedData}
          userCurrency={userCurrency}
        />
      )}
    </AppShell>
  );
}
