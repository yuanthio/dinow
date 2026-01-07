"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import logo from "@/assets/dinow.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import SearchComponent from "./SearchComponent";
import FilterSortBy from "./FilterSortBy";
import UserProfilePopup from "./UserProfilePopup";

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Filter state management
  const [filters, setFilters] = useState<{
    category?: string;
    priority?: string;
    sortBy: string;
    sortOrder: string;
  }>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleFilterChange = (newFilters: {
    category?: string;
    priority?: string;
    sortBy: string;
    sortOrder: string;
  }) => {
    setFilters(newFilters);
    // This will trigger dashboard to refetch with new filters
    // The dashboard component will need to be updated to receive these filters
    // For now, we'll store them in localStorage so dashboard can access them
    localStorage.setItem('boardFilters', JSON.stringify(newFilters));
    
    // Trigger storage event for dashboard to detect changes
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'boardFilters',
      newValue: JSON.stringify(newFilters)
    }));
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* TOP NAV ROW */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo Section */}
            <div 
              className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push("/dashboard")}
            >
              <Image 
                src={logo} 
                className="w-24 md:w-28 h-auto dark:brightness-110" 
                alt="Dinow" 
                priority
              />
            </div>

            {/* SEARCH BAR & FILTER (CENTER - Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-8">
              <div className="w-full flex items-center gap-2">
                <div className="flex-1">
                  <SearchComponent />
                </div>
                <FilterSortBy 
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                />
              </div>
            </div>

            {/* RIGHT SIDE (DESKTOP) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2" /> {/* Divider visual */}
              <UserProfilePopup />
            </div>

            {/* MOBILE HAMBURGER */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU - Dengan Backdrop Blur & Border */}
        {open && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-4 px-4 py-6">
              {/* Mobile Search */}
              <div className="w-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Search Boards</p>
                <SearchComponent />
              </div>
              
              <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

              {/* Mobile User Profile */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Settings</span>
                <UserProfilePopup />
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer agar konten di bawah tidak tertutup nav fixed */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navigation;