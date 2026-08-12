import type { Metadata } from "next";
import { Zilla_Slab } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-zilla",
});

export const metadata: Metadata = {
  title: "Bountiful Support Plus Admin",
  description: "Support Care Management, admin portal",
  icons: { icon: "/bountiful-favicon-32.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={zillaSlab.variable}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}