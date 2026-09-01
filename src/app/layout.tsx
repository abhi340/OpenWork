import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { MobileNavbar } from "@/components/ui/MobileNavbar";
import { FloatingAICopilot } from "@/components/ui/FloatingAICopilot";
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
            {/* Desktop Sidebar (visible on screens >= 1024px) */}
            <div className="hidden lg:flex h-full">
              <Sidebar />
            </div>

            {/* Mobile Header (< 1024px) */}
            <MobileNavbar />

            {/* Main scrollable content area */}
            <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 min-w-0 relative">
              {children}

              {/* Floating AI Execution Copilot (Local Ollama / BYO-Key) */}
              <FloatingAICopilot />
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
