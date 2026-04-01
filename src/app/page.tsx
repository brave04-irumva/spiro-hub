"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateVisaStatus } from "@/lib/visa-logic";
import AddStudentModal from "@/components/AddStudentModal"; // Import the correct modal
import {
  Search,
  Users,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Globe,
} from "lucide-react";

export default function Dashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [penaltyRate, setPenaltyRate] = useState(500);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    const { data: settings } = await supabase
      .from("app_settings")
      .select("penalty_per_day")
      .single();
    if (settings) setPenaltyRate(settings.penalty_per_day);

    const { data } = await supabase
      .from("students")
      .select(`*, visa_records(*)`)
      .is("deleted_at", null);
    setStudents(data || []);
    setFilteredStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let results = students.filter((s) => {
      const name = s.full_name || "";
      const idNum = s.student_id_number || "";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idNum.includes(searchTerm);

      const visa = s.visa_records?.[0];
      const info = visa?.expiry_date
        ? calculateVisaStatus(visa.expiry_date, penaltyRate)
        : null;
      const matchesStatus =
        statusFilter === "All" || info?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
    setFilteredStudents(results);
  }, [searchTerm, statusFilter, students, penaltyRate]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-bold text-blue-900 bg-gray-50">
        Syncing SPIRO Hub...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-blue-900 flex items-center gap-3">
            <ShieldCheck size={36} className="text-blue-600" /> SPIRO Tracker
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Student Placement, International Relations Office
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
          >
            <UserPlus size={18} /> Add Student
          </button>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-black hover:bg-gray-50 transition text-gray-700 text-sm"
          >
            Bulk Import
          </Link>
        </div>
      </header>

      {/* STATS & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 px-8">
          <Users className="text-blue-600" size={24} />
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
              Total
            </p>
            <p className="text-xl font-black text-blue-900">
              {filteredStudents.length}
            </p>
          </div>
        </div>
        <div className="flex-1 relative">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
            size={20}
          />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-16 pr-6 py-5 rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-8 rounded-3xl border-none shadow-sm bg-white font-black text-blue-950 text-sm cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
            <tr>
              <th className="p-8">Student Name</th>
              <th className="p-8">Nationality</th>
              <th className="p-8">Admission Number</th>
              <th className="p-8">Visa Expiry</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">Penalty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStudents.map((s) => {
              const visa = s.visa_records?.[0];
              const info = visa?.expiry_date
                ? calculateVisaStatus(visa.expiry_date, penaltyRate)
                : null;
              return (
                <tr key={s.id} className="hover:bg-blue-50/20 transition group">
                  <td className="p-8">
                    <Link
                      href={`/student/${s.id}`}
                      className="font-black text-blue-900 text-lg hover:text-blue-600 transition block"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-gray-300" />
                      <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">
                        {s.nationality}
                      </span>
                    </div>
                  </td>
                  <td className="p-8 text-gray-500 font-mono font-bold text-sm tracking-tighter">
                    {s.student_id_number}
                  </td>
                  <td className="p-8 font-black text-gray-900">
                    {visa?.expiry_date
                      ? new Date(visa.expiry_date).toLocaleDateString("en-GB")
                      : "---"}
                  </td>
                  <td className="p-8">
                    {visa?.expiry_date ? (
                      <span
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${info?.status === "Expired" ? "bg-red-100 text-red-600" : info?.status === "Expiring Soon" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}
                      >
                        {info?.status}
                      </span>
                    ) : (
                      <span className="text-gray-300 font-bold italic text-xs">
                        Record Missing
                      </span>
                    )}
                  </td>
                  <td className="p-8 text-right font-mono font-black text-red-600">
                    {info?.penalty
                      ? `KES ${info.penalty.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CALL THE EXTERNAL MODAL HERE */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
