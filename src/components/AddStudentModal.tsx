"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { X, UserPlus, Phone, Loader2 } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onRefresh,
}: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    student_id_number: "",
    nationality: "",
    phone_number: "+254", // Set default for Kenya
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insert Student bio-data
      const { data: student, error: sError } = await supabase
        .from("students")
        .insert([formData])
        .select()
        .single();

      if (sError) throw sError;

      // 2. Initialize the Visa Record
      const { error: vError } = await supabase.from("visa_records").insert([
        {
          student_id: student.id,
          current_stage: "1. Documents Pending",
          missing_documents: [],
        },
      ]);

      if (vError) throw vError;

      // 3. Create initial Audit Trail
      await supabase.from("visa_history").insert({
        student_id: student.id,
        status: "Registered",
        notes: `Initial registration completed. SMS contact saved as ${formData.phone_number}.`,
      });

      onRefresh();
      onClose();
      setFormData({
        full_name: "",
        email: "",
        student_id_number: "",
        nationality: "",
        phone_number: "+254",
      });
    } catch (error: any) {
      toast("Registration Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border border-white animate-in fade-in zoom-in duration-300">
        {/* HEADER SECTION */}
        <div className="p-10 pb-2 relative">
          <button
            onClick={onClose}
            className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition"
          >
            <X />
          </button>
          <h2 className="text-4xl font-black text-blue-900 mb-2">
            Register Student
          </h2>
          <p className="text-gray-400 font-bold text-sm">
            Manually add an international student record.
          </p>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-4">
          <input
            required
            placeholder="Full Name"
            className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="Admission No."
              className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950"
              value={formData.student_id_number}
              onChange={(e) =>
                setFormData({ ...formData, student_id_number: e.target.value })
              }
            />
            <input
              required
              placeholder="Nationality"
              className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950"
              value={formData.nationality}
              onChange={(e) =>
                setFormData({ ...formData, nationality: e.target.value })
              }
            />
          </div>

          <input
            required
            type="email"
            placeholder="Student Email"
            className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          {/* ADDED PHONE NUMBER FIELD HERE */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 uppercase ml-3">
              SMS Alert Contact
            </label>
            <input
              required
              type="text"
              placeholder="+254..."
              className="w-full p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-100 outline-none focus:ring-2 focus:ring-blue-600 font-black text-blue-900"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black shadow-xl shadow-blue-200 mt-6 hover:bg-blue-700 transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Confirm Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
