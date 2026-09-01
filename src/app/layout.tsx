import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { MobileNavbar } from "@/components/ui/MobileNavbar";
import { FloatingAICopilot } from "@/components/ui/FloatingAICopilot";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenWork — Personal Execution Workspace",
  description: "High-speed modular execution cockpit for individual workers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark antialiased`} suppressHydrationWarning>
      <body className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
