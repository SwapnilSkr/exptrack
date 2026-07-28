"use client";

import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/accounts/AccountsView";

export default function AccountsPage() {
  return (
    <AppShell>
      {({ accounts, totalAccountBalance, fetchData, onSeedData, userCurrency, handleCurrencyChange }) => (
        <AccountsView
          accounts={accounts}
          totalBalance={totalAccountBalance}
          onRefresh={fetchData}
          onSeedData={onSeedData}
          userCurrency={userCurrency}
          onCurrencyChange={handleCurrencyChange}
        />
      )}
    </AppShell>
  );
}
