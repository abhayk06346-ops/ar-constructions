"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/projects", label: "Projects", icon: "📁" },
  { href: "/inventory", label: "Inventory", icon: "📦" },
  { href: "/finance", label: "Finance", icon: "💰" },
  { href: "/labour", label: "Labour", icon: "👷" },
  { href: "/site-reports", label: "Site Reports", icon: "📸" },
  { href: "/vendors", label: "Vendors", icon: "🚛" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/equipment", label: "Equipment", icon: "🔧" },
  { href: "/documents", label: "Documents", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#15304f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e67e22] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            AR
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">AR Constructions</h1>
            <p className="text-blue-300 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? "bg-[#e67e22] text-white shadow-md"
                : "text-blue-200 hover:bg-[#15304f] hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#15304f]">
        <p className="text-blue-300 text-xs">© 2026 AR Constructions</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1e3a5f] z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-[#1e3a5f] z-40 flex items-center px-4 shadow-lg">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white text-2xl mr-3"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#e67e22] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AR
          </div>
          <h1 className="text-white font-bold text-sm">AR Constructions</h1>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#1e3a5f] z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
