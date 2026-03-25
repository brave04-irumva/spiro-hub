"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid credentials. Please contact SPIRO Admin.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* LOGO SECTION */}
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-blue-950 tracking-tighter">
            SPIRO<span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
            Secure Officer Terminal
          </p>
        </div>

        {/* LOGIN FORM */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">
                Staff Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <input
                  type="email"
                  required
                  placeholder="name@daystar.ac.ke"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-blue-950 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition shadow-xl shadow-blue-100 mt-4 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Authenticate Access{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          Authorized Daystar Personnel Only
        </p>
      </div>
    </div>
  );
}
