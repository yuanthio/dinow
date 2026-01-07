"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, isVisible, onClose }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setShouldRender(false);
          setTimeout(onClose, 500);
        }, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out ${
        isClosing || !isVisible 
          ? "translate-x-full opacity-0 scale-75 rotate-12 animate-out slide-out-to-right-full fade-out-0 zoom-out-75"
          : "translate-x-0 opacity-100 scale-100 rotate-0 animate-in slide-in-from-right-full fade-in-0 zoom-in-95"
      }`}
    >
      <div className={`bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-xl shadow-green-100/50 p-4 flex items-center gap-3 min-w-[320px] backdrop-blur-sm transition-all duration-300 ${
        isClosing ? "scale-95 opacity-75" : "scale-100 opacity-100 hover:shadow-2xl"
      }`}>
        <div className={`shrink-0 transition-all duration-300 ${isClosing ? "scale-0 rotate-180" : "scale-100 rotate-0"}`}>
          <CheckCircle className="w-5 h-5 text-green-600 animate-pulse" />
        </div>
        <p className={`text-green-800 text-sm font-medium flex-1 transition-all duration-300 ${isClosing ? "opacity-50 translate-x-2" : "opacity-100 translate-x-0"}`}>
          {message}
        </p>
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              setShouldRender(false);
              setTimeout(onClose, 500);
            }, 300);
          }}
          className="text-green-600 hover:text-green-800 hover:bg-green-100/50 rounded-full p-1 transition-all duration-200 transform hover:scale-110 active:scale-95"
        >
          <X className={`w-4 h-4 transition-all duration-300 ${isClosing ? "rotate-180 scale-75" : "rotate-0 scale-100"}`} />
        </button>
      </div>
    </div>
  );
}
