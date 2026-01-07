// dinow/frontend/src/landing/Navigation.tsx
"use client";

import { useState } from "react";
import { Lock, UserPlus, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import logo from "@/assets/dinow.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="mx-auto px-6 w-full">
        <div className="flex items-center justify-between h-20">
          <a href="#hero-section">
            <div className="cursor-pointer">
              <Image src={logo} className="w-30 h-auto" alt="Dinow" />
            </div>
          </a>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#features">
              <Button variant="ghost" className="px-6 py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition cursor-pointer">
                Features
              </Button>
            </a>

            <a href="#preview">
              <Button variant="ghost" className="px-6 py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition cursor-pointer">
                Preview
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="px-6 py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition border-blue-200 cursor-pointer"
            >
              <Lock className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            <Button
              onClick={() => router.push("/register")}
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-emerald-700 transition shadow-lg hover:shadow-xl cursor-pointer"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-50"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {open && (
          <div className="md:hidden flex flex-col space-y-3 pb-6 mt-4">
            <a href="#features" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full px-6 py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition justify-start cursor-pointer">
                Features
              </Button>
            </a>

            <a href="#preview" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full px-6 py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition justify-start cursor-pointer">
                Preview
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={() => {
                router.push("/login");
                setOpen(false);
              }}
              className="w-full px-6 py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-xl border-blue-200 flex items-center justify-center cursor-pointer"
            >
              <Lock className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            <Button
              onClick={() => {
                router.push("/register");
                setOpen(false);
              }}
              className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center cursor-pointer"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
