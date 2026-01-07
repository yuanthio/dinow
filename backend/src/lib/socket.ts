import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import prisma from "./prisma";
import { AccessRole } from "@prisma/client";
import { RoleHierarchy } from "./constan";

interface SocketUser {
  userId: number;
  boards: Set<number>; // Boards yang sedang diakses
}

class SocketManager {
  private io: Server | null = null;
  private users: Map<string, SocketUser> = new Map(); // socketId -> User

  initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:4000",
        credentials: true,
      },
    });

    this.setupEvents();
    console.log("✅ WebSocket server initialized");
  }

  private setupEvents() {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log(`🔗 New connection: ${socket.id}`);

      // Auth middleware
      socket.use(async (packet, next) => {
        try {
          const token = socket.handshake.auth.token;
          if (!token) {
            return next(new Error("Authentication required"));
          }

          // Verifikasi token (gunakan fungsi auth yang sama)
          const jwt = require("jsonwebtoken");
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
          
          // Simpan user info
          socket.data.userId = decoded.userId;
          next();
        } catch (error) {
          next(new Error("Invalid token"));
        }
      });

      // Event: Join board room
      socket.on("join-board", async (boardId: number) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Cek akses user ke board
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId,
              },
            },
          });

          if (!access) {
            socket.emit("error", "Access denied to board");
            return;
          }

          // Join room board
          socket.join(`board:${boardId}`);
          
          // Track user boards
          if (!this.users.has(socket.id)) {
            this.users.set(socket.id, { userId, boards: new Set() });
          }
          this.users.get(socket.id)!.boards.add(boardId);

          console.log(`👤 User ${userId} joined board:${boardId}`);
        } catch (error) {
          console.error("Error joining board:", error);
        }
      });

      // Event: Leave board room
      socket.on("leave-board", (boardId: number) => {
        socket.leave(`board:${boardId}`);
        
        if (this.users.has(socket.id)) {
          this.users.get(socket.id)!.boards.delete(boardId);
        }
      });

      // Event: Card moved
      socket.on("card-moved", async (data: {
        boardId: number;
        cardId: number;
        fromColumnId: number;
        toColumnId: number;
        newOrder: number;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("card-updated", {
            type: "MOVED",
            cardId: data.cardId,
            fromColumnId: data.fromColumnId,
            toColumnId: data.toColumnId,
            newOrder: data.newOrder,
            movedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting card move:", error);
        }
      });

      // Event: Column moved
      socket.on("column-moved", async (data: {
        boardId: number;
        columnId: number;
        newOrder: number;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("column-updated", {
            type: "MOVED",
            columnId: data.columnId,
            newOrder: data.newOrder,
            movedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting column move:", error);
        }
      });

      // Event: Card created/updated/deleted
      socket.on("card-change", async (data: {
        boardId: number;
        type: "CREATED" | "UPDATED" | "DELETED";
        cardId?: number;
        card?: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Broadcast ke semua user di board
          socket.to(`board:${data.boardId}`).emit("card-updated", {
            ...data,
            changedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting card change:", error);
        }
      });

      // Event: Column created/updated/deleted
      socket.on("column-change", async (data: {
        boardId: number;
        type: "CREATED" | "UPDATED" | "DELETED";
        columnId?: number;
        column?: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Broadcast ke semua user di board
          socket.to(`board:${data.boardId}`).emit("column-updated", {
            ...data,
            changedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting column change:", error);
        }
      });

      // ==================== CHECKLIST EVENTS ====================
      
      // Event: Checklist updated
      socket.on("checklist-updated", async (data: {
        boardId: number;
        type: "ITEM_CREATED" | "ITEM_UPDATED" | "ITEM_TOGGLED" | "ITEM_DELETED" | "ITEMS_REORDERED";
        cardId: number;
        columnId: number;
        itemId?: number;
        item?: any;
        progress?: any;
        items?: any[];
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            ...data,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist update:", error);
        }
      });

      // Event: Checklist item created (alternatif untuk frontend yang menggunakan emit langsung)
      socket.on("checklist-item-created", async (data: {
        boardId: number;
        cardId: number;
        columnId: number;
        item: any;
        progress: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            type: "ITEM_CREATED",
            boardId: data.boardId,
            cardId: data.cardId,
            columnId: data.columnId,
            item: data.item,
            progress: data.progress,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist item creation:", error);
        }
      });

      // Event: Checklist item toggled (completed status changed)
      socket.on("checklist-item-toggled", async (data: {
        boardId: number;
        cardId: number;
        columnId: number;
        itemId: number;
        item: any;
        progress: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            type: "ITEM_TOGGLED",
            boardId: data.boardId,
            cardId: data.cardId,
            columnId: data.columnId,
            itemId: data.itemId,
            item: data.item,
            progress: data.progress,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist item toggle:", error);
        }
      });

      // Event: Checklist item updated (text changed)
      socket.on("checklist-item-updated", async (data: {
        boardId: number;
        cardId: number;
        columnId: number;
        itemId: number;
        item: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            type: "ITEM_UPDATED",
            boardId: data.boardId,
            cardId: data.cardId,
            columnId: data.columnId,
            itemId: data.itemId,
            item: data.item,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist item update:", error);
        }
      });

      // Event: Checklist item deleted
      socket.on("checklist-item-deleted", async (data: {
        boardId: number;
        cardId: number;
        columnId: number;
        itemId: number;
        progress: any;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            type: "ITEM_DELETED",
            boardId: data.boardId,
            cardId: data.cardId,
            columnId: data.columnId,
            itemId: data.itemId,
            progress: data.progress,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist item deletion:", error);
        }
      });

      // Event: Checklist items reordered
      socket.on("checklist-items-reordered", async (data: {
        boardId: number;
        cardId: number;
        columnId: number;
        items: any[];
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Verifikasi akses user
          const access = await prisma.boardAccess.findUnique({
            where: {
              userId_boardId: {
                userId,
                boardId: data.boardId,
              },
            },
          });

          if (!access || (access.role !== AccessRole.OWNER && access.role !== AccessRole.EDITOR)) {
            socket.emit("error", "Insufficient permissions");
            return;
          }

          // Broadcast ke semua user di board kecuali sender
          socket.to(`board:${data.boardId}`).emit("checklist-updated", {
            type: "ITEMS_REORDERED",
            boardId: data.boardId,
            cardId: data.cardId,
            columnId: data.columnId,
            items: data.items,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("Error broadcasting checklist reorder:", error);
        }
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 Disconnected: ${socket.id}`);
        this.users.delete(socket.id);
      });
    });
  }

  // Helper untuk broadcast ke semua di board
  broadcastToBoard(boardId: number, event: string, data: any, excludeSocketId?: string) {
    if (!this.io) return;
    
    if (excludeSocketId) {
      this.io.to(`board:${boardId}`).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(`board:${boardId}`).emit(event, data);
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;