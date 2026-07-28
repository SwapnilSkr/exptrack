"use client";

import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/accounts/AccountsView";

export default function AccountsPage() {
  return (
    <AppShell>
      {({ accounts, totalAccountBalance, fetchData, onSeedData }) => (
        <AccountsView
          accounts={accounts}
          totalBalance={totalAccountBalance}
          onRefresh={fetchData}
          onSeedData={onSeedData}
        />
      )}
    </AppShell>
  );
}
