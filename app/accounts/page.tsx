"use client";

import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/accounts/AccountsView";

export default function AccountsPage() {
  return (
    <AppShell>
      {({ accounts, totalAccountBalance, fetchData, onSeedData, userCurrency }) => (
        <AccountsView
          accounts={accounts}
          totalBalance={totalAccountBalance}
          onRefresh={fetchData}
          onSeedData={onSeedData}
          userCurrency={userCurrency}
          onCurrencyChange={async (newCurrency) => {
            await fetch("/api/user/currency", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currency: newCurrency }),
            });
            fetchData();
          }}
        />
      )}
    </AppShell>
  );
}
