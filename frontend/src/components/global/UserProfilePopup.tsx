"use client";

import { useState, useEffect } from "react";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { removeToken } from "@/lib/auth";

interface UserProfilePopupProps {
  username?: string;
  email?: string | null;
}

export default function UserProfilePopup({
  username: propUsername,
  email: propEmail,
}: UserProfilePopupProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string | null }>({
    username: propUsername || "User",
    email: propEmail || null,
  });
  const router = useRouter();

  useEffect(() => {
    // Fetch user data from API if not provided via props
    if (!propUsername || !propEmail) {
      fetchUserData();
    }
  }, [propUsername, propEmail]);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data) {
        setUser({
          username: response.data.username || "User",
          email: response.data.email || null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Keep default values if API fails
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      removeToken();
      router.push("/login");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:shadow-md transition-shadow"
      >
        <span className="text-white font-bold">
          {getInitials(user.username)}
        </span>
      </button>

      {/* Popup */}
      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popup Content */}
          <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {getInitials(user.username)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.username}
                  </h3>
                  {user.email && (
                    <p className="text-sm text-gray-500">{user.email}</p>
                  )}
                </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {loading ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
