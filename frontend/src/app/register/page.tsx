"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/dinow.png";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setMsg("");

      await api.post("/auth/register", data);

      setIsSuccess(true);
      setMsg("Account created! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (err: any) {
      setIsSuccess(false);
      setMsg(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Locked viewport, no-scroll
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 overflow-hidden">
      <div className="w-full max-w-[360px] flex flex-col animate-in fade-in zoom-in-95 duration-500">
        
        {/* COMPACT HEADER */}
        <div className="flex flex-col items-center mb-6">
          <Image 
            src={logo} 
            alt="Dinow Logo" 
            className="w-24 md:w-28 h-auto mb-4 dark:brightness-110" 
            priority
          />
          <div className="text-center">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
              Join Dinow Kanban System
            </p>
          </div>
        </div>

        {/* COMPACT STATUS ALERT */}
        {msg && (
          <div className={`mb-4 p-3 border rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 ${
            isSuccess 
              ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20" 
              : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <p className={`text-[10px] font-black uppercase tracking-tighter ${
              isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}>
              {msg}
            </p>
          </div>
        )}

        {/* COMPACT FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Username</label>
            <input
              {...register("username")}
              placeholder="Your username"
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email</label>
            <input
              {...register("email")}
              placeholder="name@company.com"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Password</label>
            <input
              {...register("password")}
              placeholder="••••••••"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
            Already have an account? 
            <a href="/login" className="text-blue-600 dark:text-blue-400 font-bold ml-1 hover:underline underline-offset-4">
              Sign In
            </a>
          </p>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <a
              href="/"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ← Back to Landing
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}