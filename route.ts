import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rentalOrders } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { hashPassword, verifyPassword, deleteAllUserSessions } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

// Get profile
export async function GET(request: Request) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user stats
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalSpent: sql<number>`coalesce(sum(${rentalOrders.price}), 0)::int`,
        activeOrders: sql<number>`count(*) filter (where ${rentalOrders.status} = 'active')::int`,
      })
      .from(rentalOrders)
      .where(eq(rentalOrders.userId, user.id));

    const nearestExpiry = await db
      .select({ expiresAt: rentalOrders.expiresAt })
      .from(rentalOrders)
      .where(
        and(
          eq(rentalOrders.userId, user.id),
          eq(rentalOrders.status, "active"),
          sql`${rentalOrders.expiresAt} > NOW()`
        )
      )
      .orderBy(sql`${rentalOrders.expiresAt} ASC`)
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        isActive: user.isActive,
        createdAt: user.createdAt,
        stats: {
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
          activeOrders: orderStats[0]?.activeOrders || 0,
          nearestExpiry: nearestExpiry[0]?.expiresAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}

// Update profile
export async function PUT(request: Request) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }

    const { fullName, username, phone } = validated.data;

    // Check if username is taken by another user
    if (username !== user.username) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, username), sql`${users.id} != ${user.id}`))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: "Username đã được sử dụng" }, { status: 409 });
      }
    }

    await db
      .update(users)
      .set({ fullName, username, phone, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: "Cập nhật hồ sơ thành công" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}

// Change password
export async function PATCH(request: Request) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = changePasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }

    const { currentPassword, newPassword } = validated.data;

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Delete all other sessions
    const cookieHeader = request.headers.get("cookie");
    let currentToken: string | null = null;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => { const [key, ...v] = c.split("="); return [key, v.join("=")]; })
      );
      currentToken = cookies["auth_token"] || null;
    }
    await deleteAllUserSessions(user.id, currentToken || undefined);

    return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công. Bạn đã được đăng xuất khỏi các thiết bị khác." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}
