"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Save,
  Mail,
  CheckCircle,
  Clock,
  Calendar,
  History as HistoryIcon,
  ShieldAlert,
  Loader2,
  User,
  FileText,
  Upload,
  Paperclip,
  FileCheck,
  XCircle,
  Phone,
} from "lucide-react";

const OFFICIAL_REQUIREMENTS = [
  "Copy of Passport (Bio-data page)",
  "Current Visa / Pupil Pass page",
  "High School Certificate / Previous Transcripts",
  "Police Clearance (Certificate of Good Conduct)",
  "Copy of Parent/Guardian ID or Passport",
  "Commitment Letter from Parent/Guardian",
  "Two (2) Passport size photos",
  "Processing Fees (Receipt/Payment Proof)",
];

const STAGES = [
  "1. Documents Pending",
  "2. Payment Made",
  "3. Submitted to EFNS",
  "4. Awaiting Collection",
  "5. Collected & Active",
];

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [docRecords, setDocRecords] = useState<any[]>([]);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [expiry, setExpiry] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // NEW PHONE STATE
  const [stage, setStage] = useState(STAGES[0]);

  const loadData = async () => {
    setLoading(true);
    const { data: s } = await supabase
      .from("students")
      .select(`*, visa_records(*)`)
      .eq("id", id)
      .single();
    const { data: h } = await supabase
      .from("visa_history")
      .select("*")
      .eq("student_id", id)
      .order("created_at", { ascending: false });
    const { data: d } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", id);
    const { data: files } = await supabase.storage
      .from("student-docs")
      .list(id as string);

    if (s) {
      setStudent(s);
      setName(s.full_name);
      setEmail(s.email);
      setPhone(s.phone_number || ""); // FETCH PHONE
      setDocRecords(d || []);
      setHistory(h || []);
      setAttachments(files || []);

      const visa = s.visa_records?.[0];
      setExpiry(visa?.expiry_date || "");
      setStage(visa?.current_stage || STAGES[0]);
      setMissingDocs(visa?.missing_documents || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDocUpdate = async (docName: string, date: string) => {
    await supabase.from("student_documents").upsert({
      student_id: id,
      document_name: docName,
      expiry_date: date,
      status: "Verified",
    });
    const { data: d } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", id);
    setDocRecords(d || []);
  };

  const handleUpdate = async () => {
    setSaving(true);

    // 1. Update Student Table (Including Phone)
    await supabase
      .from("students")
      .update({
        full_name: name,
        email: email,
        phone_number: phone, // SAVE PHONE
      })
      .eq("id", id);

    // 2. Update Visa Records
    await supabase
      .from("visa_records")
      .update({
        expiry_date: expiry,
        current_stage: stage,
        missing_documents: missingDocs,
      })
      .eq("student_id", id);

    // 3. Create Audit Log
    await supabase.from("visa_history").insert({
      student_id: id,
      status: stage,
      notes: `Manual Update: Contact info refreshed and stage set to ${stage}.`,
    });

    setSaving(false);
    alert("SPIRO Records & Audit Trail Synchronized.");
    loadData();
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    await supabase.storage
      .from("student-docs")
      .upload(`${id}/${file.name}`, file);
    loadData();
    setUploading(false);
  };

  if (loading)
    return (
      <div className="p-20 text-center font-black text-blue-900 bg-gray-50 h-screen uppercase tracking-widest">
        Verifying Identity...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-20 bg-gray-50/30">
      <header className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-400 font-black hover:text-blue-600 transition uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-700 transition shadow-xl shadow-blue-100"
        >
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Save size={20} /> Update & Log Action
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-blue-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                <User size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-blue-950 leading-none mb-2">
                  {student.full_name}
                </h1>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                  {student.nationality} • {student.student_id_number}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    Full Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    Contact Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254..."
                    className="w-full p-5 bg-blue-50/30 rounded-2xl border-2 border-blue-50 font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-50 flex flex-col justify-center">
                <label className="block text-[10px] font-black text-blue-400 uppercase mb-4 flex items-center gap-2">
                  <Calendar size={14} /> Current Visa Expiry
                </label>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full p-5 bg-white rounded-2xl shadow-sm font-black text-blue-900 border-none outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-blue-950 uppercase mb-10 flex items-center gap-3">
              <FileCheck size={22} className="text-blue-600" /> Compliance
              Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {OFFICIAL_REQUIREMENTS.map((item) => {
                const record = docRecords.find((r) => r.document_name === item);
                const isExpired =
                  record?.expiry_date &&
                  new Date(record.expiry_date) < new Date();
                return (
                  <div
                    key={item}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all ${isExpired ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}
                  >
                    <p className="text-[10px] font-black text-blue-900 uppercase mb-4">
                      {item}
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                        Document Expiry
                      </label>
                      <input
                        type="date"
                        value={record?.expiry_date || ""}
                        onChange={(e) => handleDocUpdate(item, e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none text-[10px] font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-blue-950 text-white p-10 rounded-[3rem] shadow-2xl">
            <h3 className="font-black text-xl mb-8 flex items-center gap-3">
              <HistoryIcon className="text-blue-400" /> Audit Trail
            </h3>
            <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="border-l-2 border-blue-800 pl-4 py-1"
                >
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    {new Date(log.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] font-bold text-gray-200">
                    {log.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
