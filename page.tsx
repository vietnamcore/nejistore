"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, Clock, ArrowLeft, Loader2, ShieldCheck, CreditCard } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { formatCurrency, getStatusLabel } from "@/lib/utils";
import { BANK_INFO, HOLD_DURATION_MINUTES, SUPPORT_PHONE, SUPPORT_ZALO } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

interface AccountDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  level: string | null;
  rank: string | null;
  pricing: { id: string; hours: number; price: number }[];
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderCode: string;
    receiveCode: string;
    price: number;
    holdExpiresAt: string;
    paymentContent: string;
  } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchAccount();
  }, [id]);

  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/accounts/${id}`);
      const data = await res.json();
      if (data.success) {
        setAccount(data.data);
        if (data.data.pricing.length > 0) {
          setSelectedHours(data.data.pricing[0].hours);
        }
      }
    } catch (error) {
      console.error("Fetch account error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPricing = account?.pricing.find((p) => p.hours === selectedHours);

  const handleRent = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!selectedHours || !account) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id, hours: selectedHours }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Tạo đơn hàng thất bại");
        return;
      }

      setOrderData({
        orderCode: data.data.orderCode,
        receiveCode: data.data.receiveCode,
        price: data.data.price,
        holdExpiresAt: data.data.holdExpiresAt,
        paymentContent: data.data.paymentContent,
      });
      setShowPayment(true);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderData) return;

    try {
      const res = await fetch(`/api/orders/${orderData.orderCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Xác nhận thất bại");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  if (isLoading) {
    return (
      <main className="aurora-bg min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
          <div className="skeleton h-8 w-48 mb-8" />
          <div className="glass rounded-2xl p-8">
            <div className="skeleton h-10 w-3/4 mb-6" />
            <div className="skeleton h-6 w-1/2 mb-4" />
            <div className="skeleton h-40 w-full mb-6" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!account) {
    return (
      <main className="aurora-bg min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-28 pb-20 text-center">
          <Gamepad2 className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">Không tìm thấy tài khoản</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="aurora-bg min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-8"
        >
          {!showPayment ? (
            <>
              {/* Account Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{account.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {account.rank && <span className="text-sm text-neutral-400">Rank: {account.rank}</span>}
                    {account.level && <span className="text-sm text-neutral-400">Level: {account.level}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      account.status === "available"
                        ? "bg-green-400/10 text-green-400"
                        : "bg-red-400/10 text-red-400"
                    }`}>
                      {getStatusLabel(account.status)}
                    </span>
                  </div>
                </div>
              </div>

              {account.description && (
                <p className="text-neutral-400 mb-8 leading-relaxed">{account.description}</p>
              )}

              {/* Select Hours */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Chọn thời gian thuê</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {account.pricing.map((p) => (
                    <motion.button
                      key={p.hours}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedHours(p.hours)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedHours === p.hours
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/3 text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      <p className="text-lg font-bold">{p.hours} giờ</p>
                      <p className="text-sm mt-1">{formatCurrency(p.price)}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedPricing && (
                <div className="mb-8 p-4 rounded-xl bg-white/3 border border-white/5">
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">Tóm tắt đơn hàng</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Tài khoản</span>
                      <span className="text-white">{account.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Thời gian thuê</span>
                      <span className="text-white">{selectedPricing.hours} giờ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Tổng tiền</span>
                      <span className="text-primary font-bold text-lg">{formatCurrency(selectedPricing.price)}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRent}
                disabled={isCreating || !selectedHours || account.status !== "available"}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo đơn hàng...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Xác nhận thuê - {selectedPricing ? formatCurrency(selectedPricing.price) : ""}</>
                )}
              </motion.button>
            </>
          ) : (
            <>
              {/* Payment Info */}
              <div className="text-center mb-8">
                <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Thanh toán</h1>
                <p className="text-neutral-400">Vui lòng chuyển khoản theo thông tin bên dưới</p>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <p className="text-sm text-yellow-400">
                  ⏰ Bạn có <strong>{HOLD_DURATION_MINUTES} phút</strong> để hoàn thành thanh toán. Sau đó đơn hàng sẽ tự động hủy.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Ngân hàng</span>
                  <span className="text-white font-medium">{BANK_INFO.bankName}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Số tài khoản</span>
                  <span className="text-white font-medium">{BANK_INFO.accountNumber}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Chủ tài khoản</span>
                  <span className="text-white font-medium">{BANK_INFO.accountName}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Số tiền</span>
                  <span className="text-primary font-bold text-lg">{orderData ? formatCurrency(orderData.price) : ""}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Nội dung CK</span>
                  <span className="text-white font-medium font-mono">{orderData?.paymentContent}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-neutral-400">Mã đơn hàng</span>
                  <span className="text-white font-medium font-mono">{orderData?.orderCode}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmPayment}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Tôi đã thanh toán
              </motion.button>

              <p className="text-center text-xs text-neutral-600 mt-4">
                Sau khi bấm xác nhận, Admin sẽ kiểm tra và xác nhận thanh toán của bạn.
              </p>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
