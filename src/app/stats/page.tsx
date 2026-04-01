"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateVisaStatus } from "@/lib/visa-logic";
import {
  PieChart,
  Globe2,
  AlertCircle,
  TrendingUp,
  Users,
  RefreshCw,
} from "lucide-react";

export default function StatsPage() {
  const [data, setData] = useState<any>({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    nationalities: {},
    totalPenalty: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      const { data: students } = await supabase
        .from("students")
        .select(`*, visa_records(*)`)
        .is("deleted_at", null);
      const { data: settings } = await supabase
        .from("app_settings")
        .select("penalty_per_day")
        .single();
      const rate = settings?.penalty_per_day || 500;

      if (students) {
        let stats = {
          total: students.length,
          expired: 0,
          expiringSoon: 0,
          nationalities: {} as any,
          totalPenalty: 0,
        };

        students.forEach((s) => {
          // Nationality Count
          const nat = s.nationality || "Unknown";
          stats.nationalities[nat] = (stats.nationalities[nat] || 0) + 1;

          // Visa Status Logic with Null Checks
          const visa = s.visa_records?.[0];
          if (visa?.expiry_date) {
            const info = calculateVisaStatus(visa.expiry_date, rate);

            // This 'if (info)' block fixes your build error
            if (info) {
              if (info.status === "Expired") stats.expired++;
              if (info.status === "Expiring Soon") stats.expiringSoon++;
              stats.totalPenalty += info.penalty;
            }
          }
        });
        setData(stats);
      }
      setLoading(false);
    }
    getStats();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <RefreshCw className="animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-bold uppercase text-xs">
          Generating SPIRO Analytics...
        </p>
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-blue-900 mb-8">
        Executive Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Students"
          value={data.total}
          icon={<Users />}
          color="bg-blue-600"
        />
        <StatCard
          title="Expired Visas"
          value={data.expired}
          icon={<AlertCircle />}
          color="bg-red-600"
        />
        <StatCard
          title="Expiring Soon"
          value={data.expiringSoon}
          icon={<TrendingUp />}
          color="bg-orange-500"
        />
        <StatCard
          title="Accrued Penalties"
          value={`KES ${data.totalPenalty.toLocaleString()}`}
          icon={<PieChart />}
          color="bg-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Globe2 className="text-blue-600" />
            <h2 className="text-xl font-bold text-blue-900">
              Nationality Distribution
            </h2>
          </div>
          <div className="space-y-4">
            {Object.entries(data.nationalities).map(([name, count]: any) => (
              <div key={name}>
                <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-wider">
                  <span>{name}</span>
                  <span>{count} Students</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${(count / (data.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl font-black text-blue-900">
              {data.total > 0
                ? Math.round(((data.total - data.expired) / data.total) * 100)
                : 100}
              %
            </p>
            <p className="text-gray-400 font-bold uppercase text-xs mt-4 tracking-widest">
              Legal Compliance Rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div
        className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4`}
      >
        {icon}
      </div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-2xl font-black text-blue-950">{value}</p>
    </div>
  );
}
