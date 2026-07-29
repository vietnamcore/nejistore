"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, Clock, Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { formatCurrency, getStatusLabel, getTimeRemaining } from "@/lib/utils";

interface AccountWithPricing {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  level: string | null;
  rank: string | null;
  currentExpiresAt: string | null;
  pricing: { hours: number; price: number }[];
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Fetch accounts error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="aurora-bg min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tài Khoản <span className="text-primary">Free Fire</span>
          </h1>
          <p className="text-neutral-400">Chọn tài khoản phù hợp với bạn</p>
        </motion.div>

        <div className="flex justify-end mb-6">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6">
                <div className="skeleton h-6 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/2 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-2/3 mb-6" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500">Chưa có tài khoản nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, i) => (
              <AccountCard key={account.id} account={account} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function AccountCard({ account, index }: { account: AccountWithPricing; index: number }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(account.currentExpiresAt || ""));

  useEffect(() => {
    if (account.status !== "rented" || !account.currentExpiresAt) return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(account.currentExpiresAt || ""));
    }, 1000);

    return () => clearInterval(interval);
  }, [account.status, account.currentExpiresAt]);

  const isAvailable = account.status === "available";
  const minPrice = account.pricing.length > 0 ? Math.min(...account.pricing.map((p) => p.price)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="glass rounded-2xl p-6 hover:glow-green transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Gamepad2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{account.name}</h3>
            {account.rank && <p className="text-xs text-neutral-500">Rank: {account.rank}</p>}
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            account.status === "available"
              ? "bg-green-400/10 text-green-400 border-green-400/20"
              : account.status === "rented"
              ? "bg-red-400/10 text-red-400 border-red-400/20"
              : account.status === "pending_payment"
              ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
              : "bg-gray-400/10 text-gray-400 border-gray-400/20"
          }`}
        >
          {getStatusLabel(account.status)}
        </span>
      </div>

      {account.description && (
        <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{account.description}</p>
      )}

      {account.status === "rented" && !timeRemaining.isExpired && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs text-red-400 mb-1">🔴 Đang được thuê</p>
          <div className="flex items-center gap-2 text-sm text-white font-mono">
            <Clock className="w-4 h-4 text-red-400" />
            Còn: {String(timeRemaining.hours).padStart(2, "0")} giờ{" "}
            {String(timeRemaining.minutes).padStart(2, "0")} phút{" "}
            {String(timeRemaining.seconds).padStart(2, "0")} giây
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="mb-4">
        <p className="text-xs text-neutral-500 mb-2">Bảng giá:</p>
        <div className="grid grid-cols-2 gap-2">
          {account.pricing.map((p) => (
            <div
              key={p.hours}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 text-xs"
            >
              <span className="text-neutral-400">{p.hours} giờ</span>
              <span className="text-primary font-medium">{formatCurrency(p.price)}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href={isAvailable ? `/accounts/${account.id}` : "#"}>
        <motion.button
          whileHover={isAvailable ? { scale: 1.02 } : {}}
          whileTap={isAvailable ? { scale: 0.98 } : {}}
          disabled={!isAvailable}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
            isAvailable
              ? "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/20"
              : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
          }`}
        >
          {isAvailable ? "Thuê Ngay" : "Không sẵn sàng"}
        </motion.button>
      </Link>
    </motion.div>
  );
}
