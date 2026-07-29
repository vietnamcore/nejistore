"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Edit3, Save, Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, getStatusLabel } from "@/lib/utils";

export default function AdminAccountsPage() {
  const { user, token } = useAuthStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token && user?.role === "admin") fetchAccounts();
  }, [token, user]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAccounts(data.data);
    } catch (error) {
      console.error("Fetch accounts error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    setEditForm({
      name: account.name,
      description: account.description || "",
      gameEmail: account.gameEmail || "",
      gamePassword: account.gamePassword || "",
      status: account.status,
      level: account.level || "",
      rank: account.rank || "",
      isActive: account.isActive,
      pricing: account.pricing.map((p: any) => ({ hours: p.hours, price: p.price, id: p.id })),
    });
  };

  const handleSave = async (accountId: string) => {
    try {
      // Update account info
      await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountId, ...editForm }),
      });

      // Update pricing
      await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountId, pricingData: editForm.pricing }),
      });

      setMessage("Cập nhật thành công");
      setEditingId(null);
      fetchAccounts();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Cập nhật thất bại");
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

  return (
    <main className="aurora-bg min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Quản Lý <span className="text-primary">Tài Khoản</span>
            </h1>
            <button
              onClick={fetchAccounts}
              className="flex items-center gap-2 px-3 py-2 glass rounded-lg text-sm text-neutral-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">{message}</div>
          )}

          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{account.name}</h3>
                      <p className="text-xs text-neutral-500">
                        Status: {getStatusLabel(account.status)} • {account.pricing?.length || 0} gói giá
                      </p>
                    </div>
                  </div>
                  {editingId === account.id ? (
                    <button
                      onClick={() => handleSave(account.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"
                    >
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(account)}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-sm text-primary"
                    >
                      <Edit3 className="w-4 h-4" /> Sửa
                    </button>
                  )}
                </div>

                {editingId === account.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-neutral-500">Tên</label>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500">Trạng thái</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
                        >
                          <option value="available">Có sẵn</option>
                          <option value="rented">Đang thuê</option>
                          <option value="maintenance">Bảo trì</option>
                          <option value="locked">Tạm khóa</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500">Email game</label>
                        <input
                          value={editForm.gameEmail}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, gameEmail: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500">Mật khẩu game</label>
                        <input
                          value={editForm.gamePassword}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, gamePassword: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-500 mb-2 block">Bảng giá</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {editForm.pricing?.map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                            <span className="text-xs text-neutral-400">{p.hours}h:</span>
                            <input
                              type="number"
                              value={p.price}
                              onChange={(e) => {
                                const newPricing = [...editForm.pricing];
                                newPricing[i] = { ...newPricing[i], price: parseInt(e.target.value) || 0 };
                                setEditForm((prev: any) => ({ ...prev, pricing: newPricing }));
                              }}
                              className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none w-20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {account.pricing?.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 text-xs">
                        <span className="text-neutral-400">{p.hours} giờ</span>
                        <span className="text-primary font-medium">{formatCurrency(p.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
