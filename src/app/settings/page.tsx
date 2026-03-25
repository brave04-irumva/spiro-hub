"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/hooks/useRole";
import {
  Save,
  ArrowLeft,
  Plus,
  X,
  Database,
  BellRing,
  Coins,
  CheckSquare,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { isAdmin, loading: roleLoading } = useRole();
  const [penalty, setPenalty] = useState<number>(500);
  const [officeName, setOfficeName] = useState("");
  const [alertDays, setAlertDays] = useState(90);
  const [docs, setDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState("Checking...");

  useEffect(() => {
    setMounted(true);
    async function loadSettings() {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("*")
          .single();
        if (data) {
          setPenalty(data.penalty_per_day || 500);
          setDocs(data.default_docs || []);
          setOfficeName(data.office_name || "International Relations Office");
          setAlertDays(data.alert_threshold_days || 90);
        }
        const { error } = await supabase
          .from("students")
          .select("count", { count: "exact", head: true });
        setDbStatus(error ? "Disconnected" : "Healthy & Online");
      } catch (err) {
        setDbStatus("Error Connecting");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!isAdmin) return;
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      id: "config",
      penalty_per_day: penalty,
      default_docs: docs,
      office_name: officeName,
      alert_threshold_days: alertDays,
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else alert("System Configuration Synchronized.");
  };

  if (!mounted || roleLoading) return null;

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen pb-20">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-3 bg-white rounded-2xl shadow-sm hover:text-blue-600 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-blue-950">
              System Settings
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Core Configuration
            </p>
          </div>
        </div>

        {isAdmin ? (
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition shadow-xl shadow-blue-100 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            Save Changes
          </button>
        ) : (
          <div className="bg-amber-50 text-amber-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase border border-amber-100">
            Read-Only Mode
          </div>
        )}
      </header>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${!isAdmin && "opacity-60"}`}
      >
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-950 text-white p-8 rounded-[2.5rem] shadow-2xl border border-blue-900">
            <h3 className="font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2 text-blue-400">
              <Database size={14} /> System Health
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase mb-1">
                  Database
                </p>
                <p className="text-sm font-black flex items-center gap-2 text-green-400">
                  {dbStatus}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase mb-1">
                  Access Level
                </p>
                <p className="text-sm font-black uppercase text-blue-100">
                  {isAdmin ? "Administrator" : "Officer"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
              <BellRing size={14} className="text-orange-500" /> Alert Threshold
            </h3>
            <div className="flex items-center gap-4">
              <input
                type="number"
                disabled={!isAdmin}
                value={alertDays || 0}
                onChange={(e) => setAlertDays(parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-gray-50 rounded-2xl font-black text-blue-900 border-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span className="font-black text-[10px] text-gray-400 uppercase">
                Days
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2">
              <Coins size={16} className="text-yellow-500" /> Financial
              Governance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Daily Penalty (KES)
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={penalty || 0}
                  onChange={(e) => setPenalty(parseInt(e.target.value) || 0)}
                  className="w-full p-5 bg-gray-50 rounded-2xl font-black text-blue-950 border-none outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Office Label
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full p-5 bg-gray-50 rounded-2xl font-black text-blue-950 border-none outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2">
              <CheckSquare size={16} className="text-green-500" /> Document
              Checklist
            </h3>
            {isAdmin && (
              <div className="flex gap-3 mb-8">
                <input
                  type="text"
                  placeholder="New requirement..."
                  className="flex-1 p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (newDoc.trim()) {
                      setDocs([...docs, newDoc]);
                      setNewDoc("");
                    }
                  }}
                  className="bg-blue-900 text-white px-6 rounded-2xl hover:bg-black transition"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group"
                >
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">
                    {doc}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        setDocs(docs.filter((_, idx) => idx !== i))
                      }
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
