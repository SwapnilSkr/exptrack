"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Plus,
  Sparkles,
  Trash2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
  LayoutDashboard,
  Receipt,
  Repeat,
  Target,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HeaderProps {
  user: { name: string; username: string; currency?: string } | null;
  netWorth: number;
  onOpenAddModal: () => void;
  onSeedData: () => void;
  onClearData: () => void;
  onLogout: () => void;
  onCurrencyChange?: (currency: string) => void;
}

export default function Header({
  user,
  netWorth,
  onOpenAddModal,
  onSeedData,
  onClearData,
  onLogout,
  onCurrencyChange,
}: HeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedCurrency = user?.currency || "INR";
  const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
    { href: "/budgets", label: "Budgets", icon: Target },
    { href: "/accounts", label: "Accounts", icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-zinc-950 font-bold text-xs">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">ExpTrack</span>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      isActive
                        ? "bg-zinc-800/90 text-white font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Currency Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCurrencyMenu(!showCurrencyMenu);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-900 text-zinc-300 text-xs font-mono font-medium border border-zinc-800 cursor-pointer"
                title="Change Primary Currency"
              >
                <Globe className="w-3 h-3 text-zinc-400" />
                <span>{selectedCurrency}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {showCurrencyMenu && (
                <div className="absolute right-0 mt-1.5 w-32 ui-modal rounded-md border border-zinc-800 py-1 z-50 shadow-xl">
                  <div className="px-3 py-1 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-400">
                    Select Currency
                  </div>
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setShowCurrencyMenu(false);
                        if (onCurrencyChange) onCurrencyChange(curr);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between cursor-pointer ${
                        selectedCurrency === curr ? "bg-zinc-800 text-white font-bold" : "text-zinc-300 hover:bg-zinc-800/60"
                      }`}
                    >
                      <span>{curr}</span>
                      {selectedCurrency === curr && <span className="text-emerald-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Net Worth Ticker */}
            <div className="hidden lg:flex items-center gap-1 text-xs">
              <span className="text-zinc-500 text-[11px]">Net Worth</span>
              <span className="font-semibold text-zinc-100 font-mono text-xs">{formatCurrency(netWorth, selectedCurrency)}</span>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Add Expense"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expense</span>
            </button>

            {/* User Profile Avatar Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowCurrencyMenu(false);
                }}
                className="flex items-center gap-1 p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title={user?.name || "Account Settings"}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-semibold text-[10px] border border-zinc-700">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-500 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-48 ui-modal rounded-md border border-zinc-800 py-1 z-50 shadow-xl">
                  <div className="px-3 py-1.5 border-b border-zinc-800">
                    <p className="text-xs font-medium text-white">{user?.name}</p>
                    <p className="text-[10px] text-zinc-500">@{user?.username}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSeedData();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Load Demo Data
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onClearData();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    Clear All Data
                  </button>

                  <div className="border-t border-zinc-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded border border-zinc-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800 space-y-1 animate-in fade-in duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon className="w-4 h-4 text-zinc-400" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between px-3 text-xs text-zinc-400">
              <span>Net Worth</span>
              <span className="font-semibold text-zinc-100 font-mono">{formatCurrency(netWorth, selectedCurrency)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
