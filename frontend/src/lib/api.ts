import axios from "axios";
import { socketService } from "./socket";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
});

// Auto attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Attach socket ID untuk exclude dari broadcast
    const socketId = socketService.getSocketId();
    if (socketId) {
      config.headers['Socket-Id'] = socketId;
    }
  }
  return config;
});

// Tambahkan error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Upload image function
export const uploadCardImage = async (boardId: string, cardId: number, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post(`/boards/${boardId}/cards/${cardId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Delete image function
export const deleteCardImage = async (boardId: string, cardId: number) => {
  const response = await api.delete(`/boards/${boardId}/cards/${cardId}/image`);
  return response.data;
};