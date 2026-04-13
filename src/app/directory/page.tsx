"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateVisaStatus } from "@/lib/visa-logic";
import { useRole } from "@/hooks/useRole";
import { toast } from "@/lib/toast";
import {
  Search,
  UserCircle,
  Phone,
  Mail,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function DirectoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useRole();

  const loadData = async () => {
    setLoading(true);
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
      const compiled = students.map((s) => {
        const visa = s.visa_records?.[0];
        const statusInfo = visa?.expiry_date
          ? calculateVisaStatus(visa.expiry_date, rate)
          : null;
        return { ...s, visa, statusInfo };
      });
      setData(compiled);
      setFiltered(compiled);
    }
    setLoading(false);
  };

  // --- CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    const headers = [
      "Full Name",
      "Admission No",
      "Email",
      "Phone",
      "Nationality",
      "Visa Type",
      "Current Status",
      "Expiry Date",
      "Penalty (KES)",
    ];

    const rows = filtered.map((s) => [
      `"${s.full_name}"`,
      `"${s.student_id_number}"`,
      `"${s.email}"`,
      `"${s.phone_number || "N/A"}"`,
      `"${s.nationality}"`,
      `"${s.visa?.visa_type || "N/A"}"`,
      `"${s.statusInfo?.status || "N/A"}"`,
      `"${s.visa?.expiry_date || "N/A"}"`,
      s.statusInfo?.penalty || 0,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `SPIRO_Master_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (
      !confirm(
        "Archive this student? Their record will be hidden from the system but retained for audit purposes.",
      )
    )
      return;

    const { error } = await supabase
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      toast("Student record archived successfully.", "success");
      loadData();
    } else {
      toast("Error archiving record: " + error.message, "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const results = data.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id_number?.includes(searchTerm),
    );
    setFiltered(results);
  }, [searchTerm, data]);

  if (loading)
    return (
      <div className="p-20 text-center font-black text-blue-900 uppercase tracking-widest animate-pulse">
        Compiling Master Directory...
      </div>
    );

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-900 flex items-center gap-3">
            <UserCircle size={40} className="text-blue-600" /> Master Directory
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Database Access:{" "}
            <span className={isAdmin ? "text-blue-600" : "text-amber-600"}>
              {isAdmin ? "Administrator" : "Officer (Restricted)"}
            </span>
          </p>
        </div>

        {/* THE EXPORT BUTTON */}
        <button
          onClick={exportToCSV}
          className="flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition shadow-xl shadow-green-100 group"
        >
          <FileSpreadsheet
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
          Export Master List (.CSV)
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        {/* SEARCH BAR SECTION */}
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
              size={20}
            />
            <input
              type="text"
              placeholder="Filter by name or admission number..."
              className="w-full pl-16 pr-6 py-5 rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={loadData}
            className="p-5 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-blue-600 transition shadow-sm"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
              <tr>
                <th className="p-7">Full Details</th>
                <th className="p-7">Contact Information</th>
                <th className="p-7">Admission Info</th>
                <th className="p-7">Visa Status</th>
                <th className="p-7">Compliance</th>
                <th className="p-7 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/10 transition group">
                  <td className="p-7">
                    <p className="font-black text-blue-900 text-lg leading-tight">
                      {s.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-gray-400">
                      <Globe size={12} />
                      <span className="text-[10px] font-black uppercase">
                        {s.nationality}
                      </span>
                    </div>
                  </td>
                  <td className="p-7 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Mail size={14} className="text-blue-400" /> {s.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Phone size={14} className="text-green-400" />{" "}
                      {s.phone_number || "No Phone"}
                    </div>
                  </td>
                  <td className="p-7">
                    <p className="text-xs font-black text-gray-900">
                      {s.student_id_number}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      ID Number
                    </p>
                  </td>
                  <td className="p-7">
                    <p className="text-xs font-black text-gray-900">
                      {s.visa?.expiry_date
                        ? new Date(s.visa.expiry_date).toLocaleDateString(
                            "en-GB",
                          )
                        : "---"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {s.visa?.visa_type || "N/A"}
                    </p>
                  </td>
                  <td className="p-7">
                    <span
                      className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${
                        s.statusInfo?.status === "Expired"
                          ? "bg-red-100 text-red-600"
                          : s.statusInfo?.status === "Expiring Soon"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {s.statusInfo?.status || "PENDING"}
                    </span>
                  </td>
                  <td className="p-7 text-right flex gap-2 justify-end">
                    <Link
                      href={`/student/${s.id}`}
                      className="bg-gray-100 p-3 rounded-xl inline-block hover:bg-blue-600 hover:text-white transition shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
