import type { Metadata } from "next";
import { Zilla_Slab } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import ChatWidget from "@/components/ChatWidget";

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-zilla",
});

export const metadata: Metadata = {
  title: "Bountiful Support Plus Client",
  description: "Support Care Management, client portal",
  icons: { icon: "/new_favicon_32.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={zillaSlab.variable}>
        <ToastProvider>
          {children}
          <ChatWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
