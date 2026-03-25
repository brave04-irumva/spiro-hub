"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async (results) => {
        try {
          let count = 0;
          for (const row of results.data as any) {
            // Match the headers in your CSV file
            if (!row.student_id || !row.name) continue;

            // 1. Create/Update Student
            const { data: sData, error: sErr } = await supabase
              .from("students")
              .upsert(
                {
                  student_id_number: row.student_id,
                  full_name: row.name,
                  email: row.email || "",
                  nationality: row.nationality || "Unknown",
                },
                { onConflict: "student_id_number" },
              )
              .select()
              .single();

            if (sErr) throw sErr;

            // 2. Create/Update linked Visa Record
            const expiry =
              row.expiry_date ||
              new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split("T")[0];

            const { error: vErr } = await supabase.from("visa_records").upsert(
              {
                student_id: sData.id, // Using the new UUID
                expiry_date: expiry,
                status: "Active",
              },
              { onConflict: "student_id" },
            );

            if (vErr) throw vErr;
            count++;
          }
          setStatus({
            type: "success",
            msg: `Successfully synced ${count} students to the SPIRO system!`,
          });
        } catch (err: any) {
          console.error(err);
          setStatus({ type: "error", msg: `Error: ${err.message}` });
        } finally {
          setUploading(false);
        }
      },
    });
  };

  return (
    <div className="p-12 max-w-xl mx-auto min-h-screen">
      <Link
        href="/"
        className="flex items-center gap-2 text-gray-400 mb-8 hover:text-blue-600 transition font-bold"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100">
        <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="text-blue-600" size={40} />
        </div>
        <h2 className="text-2xl font-black text-blue-900 mb-2">
          Bulk CSV Import
        </h2>
        <p className="text-gray-400 text-sm mb-10">
          Upload your student manifest to auto-sync visa statuses.
        </p>

        <label
          className={`border-2 border-dashed rounded-3xl p-12 block cursor-pointer transition ${uploading ? "bg-gray-50 border-gray-200" : "border-blue-200 hover:bg-blue-50"}`}
        >
          {uploading ? (
            <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
          ) : (
            <Upload className="mx-auto text-blue-400 mb-2" size={32} />
          )}
          <span className="font-black text-gray-700 block uppercase text-xs tracking-widest">
            {uploading ? "Processing Data..." : "Drop CSV file here"}
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>

        {status && (
          <div
            className={`mt-8 p-5 rounded-2xl flex items-center gap-3 text-left ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {status.type === "success" ? (
              <CheckCircle size={24} />
            ) : (
              <AlertCircle size={24} />
            )}
            <div>
              <p className="text-sm font-black uppercase tracking-tight">
                {status.type === "success" ? "Success" : "Upload Failed"}
              </p>
              <p className="text-xs font-medium opacity-80">{status.msg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
