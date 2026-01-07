// dinow/frontend/src/lib/store/useColumn.ts
"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { Column, ColumnStore } from "@/types/board";

interface ColumnActions {
  fetchColumns: (boardId: number) => Promise<{ success: boolean; columns?: Column[]; message?: string }>;
  createColumn: (boardId: number, data: { title: string }) => Promise<{ success: boolean; column?: Column; message?: string }>;
  updateColumn: (boardId: number, columnId: number, data: { title?: string; order?: number }) => Promise<{ success: boolean; column?: Column; message?: string }>;
  moveColumn: (boardId: number, columnId: number, data: { order: number }) => Promise<{ success: boolean; column?: Column; message?: string }>;
  deleteColumn: (boardId: number, columnId: number) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  clearCurrentColumn: () => void;
}

const useColumn = create<ColumnStore & ColumnActions>((set, get) => ({
  columns: [],
  currentColumn: null,
  loading: false,
  error: null,

  // GET ALL columns untuk board tertentu
  fetchColumns: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/boards/${boardId}/columns`);
      set({ columns: res.data, loading: false });
      return { success: true, columns: res.data };
    } catch (error: any) {
      console.error("Failed to fetch columns:", error);
      const errorMsg = error.response?.data?.error || "Failed to fetch columns";
      set({ 
        error: errorMsg,
        loading: false 
      });
      return { success: false, message: errorMsg };
    }
  },

  // CREATE column
  createColumn: async (boardId, data) => {
    try {
      const res = await api.post(`/boards/${boardId}/columns`, data);
      const newColumn = res.data.column || res.data;
      
      set((state) => ({
        columns: [...state.columns, newColumn],
        error: null
      }));
      return { success: true, column: newColumn };
    } catch (error: any) {
      console.error("Failed to create column:", error);
      const errorMsg = error.response?.data?.error || "Failed to create column";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // UPDATE column
  updateColumn: async (boardId, columnId, data) => {
    try {
      const res = await api.patch(`/boards/${boardId}/columns/${columnId}`, data);
      const updatedColumn = res.data.column || res.data;
      
      set((state) => ({
        columns: state.columns.map((c) =>
          c.id === columnId ? { ...c, ...updatedColumn } : c
        ),
        error: null
      }));
      return { success: true, column: updatedColumn };
    } catch (error: any) {
      console.error("Failed to update column:", error);
      const errorMsg = error.response?.data?.error || "Failed to update column";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // MOVE column dengan drag & drop
  moveColumn: async (boardId, columnId, data) => {
    try {
      const response = await api.put(`/boards/${boardId}/columns/${columnId}/move`, data);
      const movedColumn = response.data.column || response.data;
      
      // Update column di store dengan data terbaru
      set((state) => ({
        columns: state.columns.map((c) =>
          c.id === columnId ? { ...c, ...movedColumn } : c
        ),
        error: null
      }));
      
      return { success: true, column: movedColumn };
    } catch (error: any) {
      console.error("Failed to move column:", error);
      const errorMsg = error.response?.data?.error || "Failed to move column";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // DELETE column
  deleteColumn: async (boardId, columnId) => {
    try {
      await api.delete(`/boards/${boardId}/columns/${columnId}`);
      set((state) => ({
        columns: state.columns.filter((c) => c.id !== columnId),
        error: null
      }));
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete column:", error);
      const errorMsg = error.response?.data?.error || "Failed to delete column";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentColumn: () => set({ currentColumn: null }),
}));

export default useColumn;