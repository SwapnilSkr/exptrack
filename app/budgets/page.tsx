"use client";

import AppShell from "@/components/layout/AppShell";
import BudgetsView from "@/components/budgets/BudgetsView";

export default function BudgetsPage() {
  return (
    <AppShell>
      {({ budgets, fetchData, onSeedData, userCurrency }) => (
        <BudgetsView budgets={budgets} onRefresh={fetchData} onSeedData={onSeedData} userCurrency={userCurrency} />
      )}
    </AppShell>
  );
}
