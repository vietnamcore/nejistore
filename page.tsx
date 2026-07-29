"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Package, Filter } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (token && user?.role === "admin") fetchOrders();
  }, [token, user, filter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/orders${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string, action: "confirm" | "reject") => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (data.success) fetchOrders();
    } catch (error) {
      console.error("Confirm order error:", error);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <main className="aurora-bg min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-neutral-400">Không có quyền truy cập</p>
        </div>
        <Footer />
      </main>
    );
  }

  const filters = [
    { value: "all", label: "Tất cả" },
    { value: "awaiting_confirmation", label: "Chờ xác nhận" },
    { value: "active", label: "Đang thuê" },
    { value: "completed", label: "Hoàn thành" },
    { value: "expired", label: "Hết hạn" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  return (
    <main className="aurora-bg min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Quản Lý <span className="text-primary">Đơn Hàng</span>
          </h1>

          <div className="flex items-center gap-2 mb-6 mt-4 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.value ? "bg-primary/10 text-primary" : "text-neutral-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500">Không có đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{order.orderCode}</p>
                        <span className={`text-xs ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        {order.accountName || "Acc"} • {order.hours} giờ • {formatCurrency(order.price)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Khách: {order.userName || "N/A"} ({order.userEmail || "N/A"}) • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    {(order.status === "awaiting_confirmation" || order.status === "pending_payment") && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmOrder(order.id, "confirm")}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" /> Xác nhận
                        </button>
                        <button
                          onClick={() => handleConfirmOrder(order.id, "reject")}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                      </div>
                    )}
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
