import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FF Rent - Cho Thuê Tài Khoản Free Fire Theo Giờ",
    template: "%s | FF Rent",
  },
  description:
    "Cho thuê tài khoản Free Fire theo giờ - Uy tín, Nhanh chóng, An toàn. Giá từ 20.000đ/giờ với nhiều tài khoản xịn, rank cao, skin hiếm.",
  keywords: [
    "cho thuê tài khoản free fire",
    "thuê acc free fire",
    "free fire rent",
    "thuê acc ff theo giờ",
    "acc free fire giá rẻ",
  ],
  authors: [{ name: "FF Rent" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "FF Rent",
    title: "FF Rent - Cho Thuê Tài Khoản Free Fire Theo Giờ",
    description:
      "Cho thuê tài khoản Free Fire theo giờ - Uy tín, Nhanh chóng, An toàn.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FF Rent - Cho Thuê Tài Khoản Free Fire Theo Giờ",
    description:
      "Cho thuê tài khoản Free Fire theo giờ - Uy tín, Nhanh chóng, An toàn.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <a href="#main-content" className="skip-nav">
          Chuyển đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
