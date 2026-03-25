"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Settings,
  LogOut,
  ShieldCheck,
  BarChart3,
  BellRing,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function getAlertCount() {
      // Fetching fresh visa data to update the badge dynamically
      const { data } = await supabase
        .from("visa_records")
        .select("expiry_date");

      if (data) {
        const today = new Date();
        const count = data.filter((v) => {
          if (!v.expiry_date) return true; // Flag as alert if date is missing
          const expiry = new Date(v.expiry_date);
          const diff =
            (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 90; // Flag if expired or expiring within 3 months
        }).length;
        setAlertCount(count);
      }
    }
    getAlertCount();
  }, [pathname]);

  // Hide sidebar on the login screen
  if (pathname === "/login") return null;

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    {
      name: "Alerts Center",
      href: "/alerts",
      icon: BellRing,
      badge: alertCount,
    },
    { name: "Student Directory", href: "/students", icon: UserCircle }, // Updated path to match new route
    { name: "Statistics", href: "/statistics", icon: BarChart3 }, // Updated path to match new route
    { name: "Bulk Import", href: "/upload", icon: Upload },
    { name: "System Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-blue-950 text-white min-h-screen flex flex-col p-6 fixed left-0 top-0 print:hidden border-r border-blue-900 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase">
          SPIRO<span className="text-blue-400">Hub</span>
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1"
                  : "text-blue-300/70 hover:bg-blue-900/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} strokeWidth={isActive ? 3 : 2} />
                {item.name}
              </div>

              {/* Status Badge with pulse animation for visibility */}
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-blue-900/50">
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-black uppercase text-[10px] tracking-widest w-full group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Sign Out
        </button>
      </div>
    </div>
  );
}
