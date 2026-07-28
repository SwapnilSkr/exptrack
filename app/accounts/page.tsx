"use client";

import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/accounts/AccountsView";
import AccountsSkeleton from "@/components/accounts/AccountsSkeleton";

export default function AccountsPage() {
  return (
    <AppShell>
      {({ accounts, totalAccountBalance, fetchData, onSeedData, userCurrency, handleCurrencyChange, dataLoading }) => {
        if (dataLoading && accounts.length === 0) {
          return <AccountsSkeleton />;
        }

        return (
          <AccountsView
            accounts={accounts}
            totalBalance={totalAccountBalance}
            onRefresh={fetchData}
            onSeedData={onSeedData}
            userCurrency={userCurrency}
            onCurrencyChange={handleCurrencyChange}
          />
        );
      }}
    </AppShell>
  );
}
