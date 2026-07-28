"use client";

import { useState } from "react";
import { Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  onSuccess: () => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { username, password } : { username, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "demo", password: "demopassword123" }),
      });

      if (!res.ok) {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "demo", password: "demopassword123", name: "Demo User" }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Demo login failed");
      }

      await fetch("/api/seed", { method: "POST" });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 overflow-y-auto">
      <div className="w-full max-w-sm ui-modal rounded-xl p-5 sm:p-6 border border-zinc-800 shadow-2xl my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white text-zinc-950 font-bold mb-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">ExpTrack</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Personal Financial Control & Intelligence</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-zinc-900 p-1 rounded-lg mb-5 border border-zinc-800">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              isLogin ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              !isLogin ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full ui-input pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full ui-input pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full ui-input pl-9 pr-9 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative px-2 bg-[#121215] text-zinc-500 text-[10px] uppercase font-semibold">
            Or Demo Evaluation
          </span>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          1-Click Demo Account (With Sample Data)
        </button>
      </div>
    </div>
  );
}
