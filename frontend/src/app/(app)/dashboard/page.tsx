"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useBoard from "@/lib/store/useBoard";
import BoardDialog from "@/components/global/BoardDialog";
import { ArrowRight, ListTodo, Box, Calendar, Layout, Plus } from "lucide-react";
import { Board } from "@/types/board";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton shadcn

export default function DashboardPage() {
  const { boards, fetchBoards, deleteBoard } = useBoard();
  const router = useRouter();
  
  // Local loading state
  const [isLoading, setIsLoading] = useState(true);

  // State for filters - initialize from localStorage if available
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('boardFilters');
      if (savedFilters) {
        try {
          return JSON.parse(savedFilters);
        } catch {
          return {
            category: undefined,
            priority: undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
          };
        }
      }
    }
    return {
      category: undefined,
      priority: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
  });

  // Listen for filter changes from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'boardFilters' && e.newValue) {
        try {
          const newFilters = JSON.parse(e.newValue);
          setFilters(newFilters);
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Fetch Data with Loading State
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchBoards(filters); 
      } catch (error) {
        console.error("Failed to load boards", error);
      } finally {
        // Kasih sedikit delay biar skeleton gak kedip cepet banget kalau koneksi ngebut (opsional, biar smooth aja)
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    loadData();
  }, [filters]);

  // Logika untuk menentukan tipe board secara visual
  const getBoardType = (board: Board) => {
    if (board.columns && Array.isArray(board.columns)) {
      if (board.columns.length === 3) {
        const columnTitles = board.columns.map((col) => col.title).join(',');
        if (columnTitles.includes('To Do') && columnTitles.includes('Doing') && columnTitles.includes('Done')) {
          return 'template';
        }
      }
      if (board.columns.length > 0) return 'custom';
    }
    return 'custom';
  };

  return (
    <div className="min-h-screen pt-5 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Your Boards
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your projects and personal tasks.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
             {/* Kalau loading, tampilin skeleton text kecil */}
             {isLoading ? (
                <Skeleton className="h-5 w-24 ml-auto bg-gray-200 dark:bg-gray-800" />
             ) : (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Array.isArray(boards) ? boards.length : 0} Total Boards
                </p>
             )}
          </div>
          <BoardDialog mode="create">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
              <Plus className="w-5 h-5" />
              <span>New Board</span>
            </button>
          </BoardDialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          /* --- SKELETON LOADING STATE --- */
          /* Grid yang sama persis dengan konten asli */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm h-[200px]">
                {/* Header Skeleton */}
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                            <Skeleton className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                        </div>
                        <Skeleton className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
                
                {/* Badges Skeleton */}
                <div className="flex gap-2 mb-6">
                    <Skeleton className="h-6 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-6 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-6 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Footer Skeleton */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <Skeleton className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-10 rounded bg-gray-200 dark:bg-gray-800" />
                        <Skeleton className="h-6 w-10 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(boards) || boards.length === 0 ? (
          /* --- EMPTY STATE --- */
          <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white/50 dark:bg-gray-900/50 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Layout className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No boards found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mb-8">
              Start organizing your workflow by creating your very first board.
            </p>
            <BoardDialog mode="create">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                Create First Board
              </button>
            </BoardDialog>
          </div>
        ) : (
          /* --- REAL DATA GRID --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {boards.map((board) => {
              const boardType = getBoardType(board);
              const totalCards = board.columns?.reduce((acc, col) => acc + (col.cards?.length || 0), 0) || 0;

              return (
                <div
                  key={board.id}
                  className="group relative flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer h-full"
                  onClick={() => router.push(`/board/${board.id}`)}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {boardType === 'template' ? (
                          <ListTodo className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Box className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {board.category || "General"}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                        {board.name}
                      </h2>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      board.priority === 'HIGH' 
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                        : board.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    }`}>
                      {board.priority}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400 rounded-md">
                      {board.columns?.length || 0} Columns
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400 rounded-md">
                      {totalCards} Cards
                    </span>
                  </div>

                  {/* Footer Meta */}
                  <div className="mt-auto space-y-3">
                    {board.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Due {new Date(board.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex gap-1">
                        {/* Edit Button - Stop propagation supaya ga trigger router.push card */}
                        <BoardDialog 
                          mode="edit"
                          boardId={board.id}
                          boardData={{
                            name: board.name,
                            priority: board.priority,
                            category: board.category,
                            deadline: board.deadline || ""
                          }}
                        >
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          >
                            <span className="text-xs font-bold">Edit</span>
                          </button>
                        </BoardDialog>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this board?')) deleteBoard(board.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <span className="text-xs font-bold">Delete</span>
                        </button>
                      </div>
                      
                      <button className="text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Board
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}