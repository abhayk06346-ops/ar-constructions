import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import GuidedTour from "@/components/GuidedTour";

export const metadata: Metadata = {
  title: "AR Constructions - Management System",
  description: "Complete construction management solution for AR Constructions",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1e3a5f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen antialiased">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <GuidedTour />
      </body>
    </html>
  );
}
