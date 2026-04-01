"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateVisaStatus } from "@/lib/visa-logic";
import { useRole } from "@/hooks/useRole";
import {
  Bell,
  Mail,
  AlertTriangle,
  Search,
  FileWarning,
  X,
  Send,
  User,
  MessageSquare,
  RefreshCw,
  Phone,
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [smsSending, setSmsSending] = useState(false);
  const { isAdmin } = useRole();

  const loadAlerts = async () => {
    setLoading(true);
    const { data: students } = await supabase
      .from("students")
      .select(`*, visa_records(*)`);
    const { data: settings } = await supabase
      .from("app_settings")
      .select("penalty_per_day, alert_threshold_days")
      .single();
    const rate = settings?.penalty_per_day || 500;
    const threshold = settings?.alert_threshold_days || 90;

    if (students) {
      const actionable = students
        .map((s) => {
          const visa = s.visa_records?.[0];
          const statusInfo = visa?.expiry_date
            ? calculateVisaStatus(visa.expiry_date, rate, threshold)
            : null;
          const isExpired = statusInfo?.status === "Expired";
          const isExpiringSoon = statusInfo?.status === "Expiring Soon";
          const missingDocs = visa?.missing_documents || [];

          let alertType = "INFO";
          let reason = "Incomplete Profile";
          if (isExpired) {
            alertType = "CRITICAL";
            reason = "Visa Expired";
          } else if (isExpiringSoon) {
            alertType = "WARNING";
            reason = `Expires in ${statusInfo?.diffDays} days`;
          } else if (missingDocs.length > 0) {
            alertType = "DOCS";
            reason = "Missing Documents";
          }

          return { ...s, visa, statusInfo, alertType, reason, missingDocs };
        })
        .filter((s) => s.alertType !== "INFO" || !s.visa?.expiry_date);

      setAlerts(
        actionable.sort((a, b) => (a.alertType === "CRITICAL" ? -1 : 1)),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const triggerOutlook = (student: any) => {
    const subject = `URGENT: Daystar SPIRO Requirement - ${student.full_name}`;
    const missingList =
      student.missingDocs.length > 0
        ? `\n\nREQUIRED ITEMS MISSING:\n${student.missingDocs.map((d: string) => `• ${d}`).join("\n")}`
        : "";

    const body =
      `Dear ${student.full_name},\n\n` +
      `This is the Daystar University SPIRO Office. We have detected a compliance issue with your file.\n\n` +
      `Status: ${student.reason}\n` +
      `Current Record: ${student.statusInfo?.status || "Pending Verification"}` +
      missingList +
      `\n\nPlease report to the SPIRO office immediately to resolve this.\n\n` +
      `Regards,\n` +
      `International Relations Office\n` +
      `Daystar University`;

    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSelectedStudent(null);
  };

  const triggerSMS = async (student: any) => {
    if (!student.phone_number) {
      alert("Error: No phone number recorded for this student.");
      return;
    }

    setSmsSending(true);
    const message = `Dear ${student.full_name}, Daystar SPIRO Office here. Your status: ${student.reason}. Please report to the office immediately to resolve this.`;

    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: student.phone_number,
          message: message,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("SMS successfully sent via Africa's Talking!");
        setSelectedStudent(null);
      } else {
        alert(`SMS Failed: ${result.error}. Ensure number is in +254 format.`);
      }
    } catch (error) {
      alert("Network Error: Could not connect to SMS Gateway.");
    } finally {
      setSmsSending(false);
    }
  };

  const filtered = alerts.filter((a) =>
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="p-20 text-center font-black text-blue-950 uppercase tracking-widest">
        Scanning University Compliance...
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen relative bg-gray-50/20">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-blue-900 flex items-center gap-3">
          <Bell className="text-red-500" /> Alerts Center
        </h1>
        <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-3 shadow-sm">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
            Critical Alerts:
          </span>
          <span className="text-2xl font-black text-red-600">
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="relative mb-10">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by student name..."
          className="w-full pl-16 pr-6 py-6 rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className={`bg-white p-7 rounded-[2.5rem] border-l-[16px] shadow-sm flex items-center justify-between transition-transform hover:scale-[1.01] ${
              s.alertType === "CRITICAL"
                ? "border-red-500"
                : "border-orange-400"
            }`}
          >
            <div className="flex items-center gap-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  s.alertType === "CRITICAL"
                    ? "bg-red-50 text-red-500"
                    : "bg-orange-50 text-orange-500"
                }`}
              >
                {s.alertType === "CRITICAL" ? (
                  <AlertTriangle size={28} />
                ) : (
                  <FileWarning size={28} />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-blue-950 leading-none mb-2">
                  {s.full_name}
                </h3>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {s.student_id_number} •{" "}
                  <span className="text-red-500">{s.reason}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(s)}
              className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition flex items-center gap-2 shadow-lg shadow-blue-900/10"
            >
              <Send size={14} /> Dispatch Alert
            </button>
          </div>
        ))}
      </div>

      {/* DISPATCH CONSOLE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white">
            <div className="bg-blue-900 p-10 text-white relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-8 right-8 text-blue-300 hover:text-white transition"
              >
                <X />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-800 p-3 rounded-2xl">
                  <User size={30} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Communications Hub
                  </h2>
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
                    Compliance Intervention
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Current Compliance Status:
                </p>
                <div className="flex items-center gap-3 text-red-600 font-black text-sm uppercase">
                  <AlertTriangle size={18} /> {selectedStudent.reason}
                </div>
                <p className="text-xs font-medium text-gray-500 leading-relaxed italic border-t border-gray-200 pt-3">
                  "Dear {selectedStudent.full_name}, Daystar SPIRO Office has
                  flagged your record for {selectedStudent.reason.toLowerCase()}
                  . Please visit the office."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => triggerOutlook(selectedStudent)}
                  className="bg-white text-blue-900 py-5 rounded-2xl font-black border-2 border-blue-50 flex items-center justify-center gap-3 hover:bg-blue-50 transition uppercase text-[10px] tracking-widest"
                >
                  <Mail size={18} /> Send Email
                </button>
                <button
                  onClick={() => triggerSMS(selectedStudent)}
                  disabled={smsSending}
                  className="bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  {smsSending ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <>
                      <MessageSquare size={18} /> Send SMS
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-400 uppercase">
                <Phone size={12} />{" "}
                {selectedStudent.phone_number || "NO PHONE NUMBER LINKED"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
