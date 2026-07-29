"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Package } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";

export default function PaymentHistoryPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.filter((o: any) => o.paymentStatus !== "pending" || o.status !== "pending_payment"));
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="aurora-bg min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Lịch Sử <span className="text-primary">Thanh Toán</span>
          </h1>
          <p className="text-neutral-400 mb-8">Xem lịch sử thanh toán của bạn</p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <CreditCard className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500">Chưa có lịch sử thanh toán</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{order.accountName || "Tài khoản"}</p>
                      <p className="text-xs text-neutral-500">
                        {order.orderCode} • {order.hours} giờ • {formatDate(order.createdAt)}
                      </p>
                      {order.paymentContent && (
                        <p className="text-xs text-neutral-600 mt-1">Nội dung CK: {order.paymentContent}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{formatCurrency(order.price)}</p>
                      <p className={`text-xs ${getStatusColor(order.paymentStatus)}`}>
                        {getStatusLabel(order.paymentStatus)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
