import { io, Socket } from "socket.io-client";
import { getToken } from "./auth";

// Update tipe untuk callback termasuk checklist
type BoardCallback = (type: "card" | "column" | "checklist", data: any) => void;

// Tipe untuk checklist update data
interface ChecklistUpdateData {
  boardId: number;
  type: "ITEM_CREATED" | "ITEM_UPDATED" | "ITEM_TOGGLED" | "ITEM_DELETED" | "ITEMS_REORDERED";
  cardId: number;
  columnId: number;
  itemId?: number;
  item?: any;
  progress?: any;
  items?: any[];
  updatedBy?: number;
  timestamp?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private boardCallbacks: Map<number, Set<BoardCallback>> = new Map();
  private connected = false;

  connect() {
    if (this.socket?.connected) return;

    const token = getToken();
    if (!token) {
      console.error("No token found for socket connection");
      return;
    }

    this.socket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.connected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Listen for card updates
    this.socket.on("card-updated", (data) => {
      console.log("📨 Received card update:", data);
      const boardId = data.boardId || data.card?.boardId;
      if (boardId) {
        this.notifyBoardListeners(boardId, "card", data);
      }
    });

    // Listen for column updates
    this.socket.on("column-updated", (data) => {
      console.log("📨 Received column update:", data);
      const boardId = data.boardId || data.column?.boardId;
      if (boardId) {
        this.notifyBoardListeners(boardId, "column", data);
      }
    });

    // Listen for checklist updates
    this.socket.on("checklist-updated", (data) => {
      console.log("📨 Received checklist update:", data);
      const boardId = data.boardId || data.card?.boardId;
      if (boardId) {
        this.notifyBoardListeners(boardId, "checklist", data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinBoard(boardId: number) {
    if (!this.socket?.connected) {
      this.connect();
    }

    setTimeout(() => {
      if (this.socket?.connected) {
        this.socket.emit("join-board", boardId);
        console.log(`🔗 Joined board room: ${boardId}`);
      }
    }, 100);
  }

  leaveBoard(boardId: number) {
    if (this.socket?.connected) {
      this.socket.emit("leave-board", boardId);
      console.log(`🔗 Left board room: ${boardId}`);
    }
  }

  emitCardMoved(data: {
    boardId: number;
    cardId: number;
    fromColumnId: number;
    toColumnId: number;
    newOrder: number;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("card-moved", data);
    }
  }

  emitColumnMoved(data: {
    boardId: number;
    columnId: number;
    newOrder: number;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("column-moved", data);
    }
  }

  emitCardChange(data: {
    boardId: number;
    type: "CREATED" | "UPDATED" | "DELETED";
    cardId?: number;
    card?: any;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("card-change", data);
    }
  }

  emitColumnChange(data: {
    boardId: number;
    type: "CREATED" | "UPDATED" | "DELETED";
    columnId?: number;
    column?: any;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("column-change", data);
    }
  }

  // Method untuk emit checklist events
  emitChecklistUpdate(data: ChecklistUpdateData) {
    if (this.socket?.connected) {
      this.socket.emit("checklist-updated", data);
    }
  }

  // Subscribe to board updates
  subscribeToBoard(boardId: number, callback: BoardCallback) {
    if (!this.boardCallbacks.has(boardId)) {
      this.boardCallbacks.set(boardId, new Set());
    }
    this.boardCallbacks.get(boardId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.boardCallbacks.get(boardId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.boardCallbacks.delete(boardId);
        }
      }
    };
  }

  private notifyBoardListeners(boardId: number, type: "card" | "column" | "checklist", data: any) {
    const callbacks = this.boardCallbacks.get(boardId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(type, data);
        } catch (error) {
          console.error("Error in board callback:", error);
        }
      });
    }
  }

  isConnected() {
    return this.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export type { ChecklistUpdateData };