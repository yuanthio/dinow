"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/dinow.png";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setMsg("");

      const res = await api.post("/auth/login", data);
      const token = res.data.token;

      localStorage.setItem("token", token);
      router.push("/dashboard");

    } catch (err: any) {
      setMsg(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative overflow-hidden font-sans">
      
      {/* Back Button (Floating top left) */}
      <button 
        onClick={() => router.push("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Main Container - Tanpa Card, Max Width Sempit biar Fokus */}
      <div className="w-full max-w-[350px] flex flex-col animate-in fade-in zoom-in-95 duration-500">
        
        {/* LOGO SECTION */}
        <div className="flex flex-col items-center text-center">
          {/* LOGO BESAR TAPI BERJARAK */}

            <Image 
              src={logo} 
              alt="Dinow Logo" 
              className="w-32 object-contain drop-shadow-sm" 
              priority
            />


          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
            Please sign in to continue
          </p>
        </div>

        {/* ERROR ALERT */}
        {msg && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-xs font-bold text-red-600 dark:text-red-400">
              {msg}
            </p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1">
              Email
            </label>
            <input
              {...register("email")}
              placeholder="name@company.com"
              type="email"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white text-sm font-semibold shadow-sm placeholder:font-normal"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Password
                </label>
            </div>
            <input
              {...register("password")}
              placeholder="••••••••"
              type="password"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white text-sm font-semibold shadow-sm placeholder:font-normal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* FOOTER TEXT */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Don't have an account? 
            <a href="/register" className="text-blue-600 dark:text-blue-400 font-bold ml-1 hover:underline decoration-2 underline-offset-4">
              Sign Up
            </a>
          </p>
        </div>

      </div>
      
      {/* Copyright Footer
      <div className="absolute bottom-6 text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-700">
        © 2025 Dinow Software
      </div> */}
    </div>
  );
}