"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { Board, BoardDetails, BoardStore } from "@/types/board";

interface BoardActions {
  fetchBoards: (filters?: {
    category?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  fetchBoardById: (id: number) => Promise<{ success: boolean; board?: BoardDetails; message?: string }>;
  createBoard: (data: any) => Promise<{ success: boolean; board?: Board; message?: string }>;
  deleteBoard: (id: number) => Promise<{ success: boolean; message?: string }>;
  updateBoard: (id: number, data: any) => Promise<{ success: boolean; board?: Board; message?: string }>;
  clearError: () => void;
  clearCurrentBoard: () => void;
}

const useBoard = create<BoardStore & BoardActions>((set, get) => ({
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,

  // GET ALL boards untuk user yang sedang login
  fetchBoards: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/boards/my-boards?${queryString}` : "/boards/my-boards";
      
      const res = await api.get(url);
      set({ boards: res.data, loading: false });
    } catch (error: any) {
      console.error("Failed to fetch boards:", error);
      set({ 
        error: error.response?.data?.error || "Failed to fetch boards",
        loading: false 
      });
    }
  },

  // GET SINGLE board by ID
  fetchBoardById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/boards/${id}`);
      const boardData: BoardDetails = {
        ...res.data,
        columns: res.data.columns || [],
        members: res.data.members || []
      };
      set({ currentBoard: boardData, loading: false });
      return { success: true, board: boardData };
    } catch (error: any) {
      console.error("Failed to fetch board:", error);
      const errorMsg = error.response?.data?.error || "Failed to fetch board";
      set({ 
        error: errorMsg,
        loading: false 
      });
      return { success: false, message: errorMsg };
    }
  },

  // CREATE new board
  createBoard: async (data) => {
    try {
      const res = await api.post("/boards", data);
      const newBoard = res.data.board || res.data;
      
      set((state) => ({
        boards: [...state.boards, newBoard],
        error: null
      }));
      return { success: true, board: newBoard };
    } catch (error: any) {
      console.error("Failed to create board:", error);
      const errorMsg = error.response?.data?.error || "Failed to create board";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // DELETE board
  deleteBoard: async (id) => {
    try {
      await api.delete(`/boards/${id}`);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== id),
        error: null
      }));
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete board:", error);
      const errorMsg = error.response?.data?.error || "Failed to delete board";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // UPDATE board
  updateBoard: async (id, data) => {
    try {
      const res = await api.patch(`/boards/${id}`, data);
      const updatedBoard = res.data.board || res.data;
      
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === id ? { ...b, ...updatedBoard } : b
        ),
        error: null
      }));
      return { success: true, board: updatedBoard };
    } catch (error: any) {
      console.error("Failed to update board:", error);
      const errorMsg = error.response?.data?.error || "Failed to update board";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentBoard: () => set({ currentBoard: null }),
}));

export default useBoard;
