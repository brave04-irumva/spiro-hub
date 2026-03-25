"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateStats } from "@/lib/stats-logic";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Globe2,
  AlertCircle,
  CheckCircle2,
  Coins,
} from "lucide-react";

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      const { data: students } = await supabase
        .from("students")
        .select(`*, visa_records(*)`);
      const { data: settings } = await supabase
        .from("app_settings")
        .select("penalty_per_day")
        .single();
      if (students) {
        setStats(calculateStats(students, settings?.penalty_per_day || 500));
      }
      setLoading(false);
    }
    getStats();
  }, []);

  if (loading || !stats)
    return (
      <div className="h-screen flex items-center justify-center font-black text-blue-900 uppercase tracking-widest animate-pulse">
        Analyzing University Compliance...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-20">
      <header>
        <h1 className="text-4xl font-black text-blue-900 flex items-center gap-3">
          <BarChart3 size={36} className="text-blue-600" /> SPIRO Analytics
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">
          Institutional Compliance Report
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Compliance Rate"
          value={`${stats.complianceRate}%`}
          icon={<TrendingUp className="text-green-500" />}
          color="bg-green-50"
        />
        <StatCard
          title="Expired Visas"
          value={stats.expiredCount}
          icon={<AlertCircle className="text-red-500" />}
          color="bg-red-50"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoonCount}
          icon={<PieChart className="text-orange-500" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Est. Penalties"
          value={`KES ${stats.totalPenalties.toLocaleString()}`}
          icon={<Coins className="text-yellow-500" />}
          color="bg-yellow-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="font-black text-blue-950 mb-8 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Globe2 size={18} className="text-blue-600" /> Nationality
            Distribution
          </h3>
          <div className="space-y-4">
            {stats.nationalities.map((n: any) => (
              <div key={n.name} className="flex items-center gap-4">
                <span className="text-[10px] font-black text-gray-400 w-24 uppercase truncate">
                  {n.name}
                </span>
                <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(n.count / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-black text-blue-900">
                  {n.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-950 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center text-center items-center">
          <CheckCircle2 size={64} className="text-blue-400 mb-6" />
          <h2 className="text-3xl font-black mb-2">Institutional Health</h2>
          <p className="text-blue-200 text-sm font-medium leading-relaxed max-w-sm">
            Monitoring {stats.total} international files. Data integrity is
            verified against Daystar SPIRO policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div
      className={`${color} p-8 rounded-[2.5rem] border border-white/50 shadow-sm transition-transform hover:scale-105`}
    >
      <div className="mb-4">{icon}</div>
      <p className="text-2xl font-black text-blue-950">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {title}
      </p>
    </div>
  );
}
