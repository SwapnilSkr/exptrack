"use client";

import AppShell from "@/components/layout/AppShell";
import SubscriptionsView from "@/components/subscriptions/SubscriptionsView";
import SubscriptionsSkeleton from "@/components/subscriptions/SubscriptionsSkeleton";

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
        dataLoading,
      }) => {
        if (dataLoading && subscriptions.length === 0) {
          return <SubscriptionsSkeleton />;
        }

        return (
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
        );
      }}
    </AppShell>
  );
}
