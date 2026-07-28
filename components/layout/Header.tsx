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
  LayoutDashboard,
  Receipt,
  Repeat,
  Target,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HeaderProps {
  user: { name: string; username: string } | null;
  netWorth: number;
  onOpenAddModal: () => void;
  onSeedData: () => void;
  onClearData: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  netWorth,
  onOpenAddModal,
  onSeedData,
  onClearData,
  onLogout,
}: HeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
    { href: "/budgets", label: "Budgets", icon: Target },
    { href: "/accounts", label: "Accounts", icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-13">
          {/* Left Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-zinc-400 hover:text-white rounded border border-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-zinc-950 font-bold text-xs">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">ExpTrack</span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Net Worth Ticker */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-400 text-[11px]">Net Worth</span>
              <span className="font-semibold text-zinc-100 font-mono">{formatCurrency(netWorth)}</span>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-1 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* User Profile / Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-semibold text-[10px]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="font-medium text-xs hidden md:inline text-zinc-300">{user?.name}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-48 ui-modal rounded-md border border-zinc-800 py-1 z-50">
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
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-zinc-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
