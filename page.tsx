"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { user, token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === "admin") fetchUsers();
  }, [token, user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Toggle user error:", error);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            Quản Lý <span className="text-primary">Người Dùng</span>
          </h1>

          {isLoading ? (
            <div className="skeleton h-60 rounded-xl" />
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-3 text-neutral-400 font-medium">Người dùng</th>
                      <th className="text-left p-3 text-neutral-400 font-medium">Email</th>
                      <th className="text-left p-3 text-neutral-400 font-medium">Vai trò</th>
                      <th className="text-left p-3 text-neutral-400 font-medium">Xác thực</th>
                      <th className="text-left p-3 text-neutral-400 font-medium">Ngày tạo</th>
                      <th className="text-left p-3 text-neutral-400 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/3 hover:bg-white/2">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {u.fullName?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.fullName}</p>
                              <p className="text-xs text-neutral-500">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-neutral-300">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            u.role === "admin" ? "bg-primary/10 text-primary" : "bg-blue-400/10 text-blue-400"
                          }`}>
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.emailVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </td>
                        <td className="p-3 text-neutral-400">{formatDate(u.createdAt)}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              u.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {u.isActive ? "Hoạt động" : "Vô hiệu"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
