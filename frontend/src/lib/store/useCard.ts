"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { Card, CardStore } from "@/types/board";

interface CardActions {
  fetchCards: (boardId: number) => Promise<{ success: boolean; cards?: Card[]; message?: string }>;
  createCard: (boardId: number, data: { columnId: number; title: string; description?: string }) => Promise<{ success: boolean; card?: Card; message?: string }>;
  updateCard: (boardId: number, cardId: number, data: any) => Promise<{ success: boolean; card?: Card; message?: string }>;
  deleteCard: (boardId: number, cardId: number) => Promise<{ success: boolean; message?: string }>;
  moveCard: (boardId: number, cardId: number, data: { columnId?: number; order?: number }) => Promise<{ success: boolean; card?: Card; message?: string }>;
  clearError: () => void;
  clearCurrentCard: () => void;
}

const useCard = create<CardStore & CardActions>((set, get) => ({
  cards: [],
  currentCard: null,
  loading: false,
  error: null,

  // GET ALL cards untuk board tertentu
  fetchCards: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/boards/${boardId}/cards`);
      set({ cards: res.data, loading: false });
      return { success: true, cards: res.data };
    } catch (error: any) {
      console.error("Failed to fetch cards:", error);
      const errorMsg = error.response?.data?.error || "Failed to fetch cards";
      set({ 
        error: errorMsg,
        loading: false 
      });
      return { success: false, message: errorMsg };
    }
  },

  // CREATE card
  createCard: async (boardId, data) => {
    try {
      const res = await api.post(`/boards/${boardId}/cards`, data);
      const newCard = res.data.card || res.data;
      
      set((state) => ({
        cards: [...state.cards, newCard],
        error: null
      }));
      return { success: true, card: newCard };
    } catch (error: any) {
      console.error("Failed to create card:", error);
      const errorMsg = error.response?.data?.error || "Failed to create card";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // UPDATE card metadata (title, description)
  updateCard: async (boardId, cardId, data) => {
    try {
      const res = await api.patch(`/boards/${boardId}/cards/${cardId}`, data);
      const updatedCard = res.data.card || res.data;
      
      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...updatedCard } : c
        ),
        error: null
      }));
      return { success: true, card: updatedCard };
    } catch (error: any) {
      console.error("Failed to update card:", error);
      const errorMsg = error.response?.data?.error || "Failed to update card";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // DELETE card
  deleteCard: async (boardId, cardId) => {
    try {
      await api.delete(`/boards/${boardId}/cards/${cardId}`);
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== cardId),
        error: null
      }));
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete card:", error);
      const errorMsg = error.response?.data?.error || "Failed to delete card";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  // MOVE card dengan order yang benar
  moveCard: async (boardId, cardId, data) => {
    try {
      const response = await api.put(`/boards/${boardId}/cards/${cardId}/move`, data);
      const movedCard = response.data.card || response.data;
      
      // Update card di store dengan data terbaru dari backend
      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...movedCard } : c
        ),
        error: null
      }));
      
      return { success: true, card: movedCard };
    } catch (error: any) {
      console.error("Failed to move card:", error);
      const errorMsg = error.response?.data?.error || "Failed to move card";
      set({ error: errorMsg });
      return { success: false, message: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentCard: () => set({ currentCard: null }),
}));

export default useCard;