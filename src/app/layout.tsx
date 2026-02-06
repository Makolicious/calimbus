import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/Auth/SessionProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calimbus",
  description: "Organize your Google Calendar events and tasks in a Kanban board",
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
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
