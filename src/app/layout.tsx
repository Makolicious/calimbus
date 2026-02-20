import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/Auth/SessionProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UndoProvider } from "@/contexts/UndoContext";
import { ShortcutsProvider } from "@/contexts/ShortcutsContext";
import { ServiceWorkerRegistration } from "@/components/PWA/ServiceWorkerRegistration";
import { UndoToast } from "@/components/UI/UndoToast";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calimbus",
  description: "Organize your Google Calendar events and tasks in a Kanban board",
  manifest: "/manifest.json",
  themeColor: "#f97316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calimbus",
  },
  icons: {
    icon: [
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Calimbus",
    description: "Organize your Google Calendar events and tasks in a Kanban board",
    url: "https://calimbus.vercel.app",
    siteName: "Calimbus",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calimbus",
    description: "Organize your Google Calendar events and tasks in a Kanban board",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <ShortcutsProvider>
              <UndoProvider>
                {children}
                <UndoToast />
                <ServiceWorkerRegistration />
              </UndoProvider>
            </ShortcutsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
