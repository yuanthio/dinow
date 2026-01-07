import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { AccessRole } from "@prisma/client";
import socketManager from "../lib/socket"; // 💡 Tambahkan import socketManager

// Indonesian comments: Interface untuk Request dengan Role tambahan
interface ColumnRequest extends AuthenticatedRequest {
    userRole?: AccessRole; // Ditambahkan oleh middleware checkBoardAccess
}

// ----------------------------------------------------
// CREATE Column (OWNER Only)
// ----------------------------------------------------
export async function createColumn(req: ColumnRequest, res: Response) {
    const userId = req.userId;
    const boardId = parseInt(req.params.boardId);

    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Column title is required" });
    }
    
    // Indonesian comments: Batasan RBAC: Hanya OWNER yang boleh create
    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can create columns" });
    }

    try {
        // Indonesian comments: Cari order tertinggi (terakhir) di board ini
        const latestColumn = await prisma.column.findFirst({
            where: { boardId: boardId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        // Indonesian comments: Order baru = order terakhir + 1, atau 0 kalau belum ada
        const newOrder = latestColumn ? latestColumn.order + 1 : 0;

        const newColumn = await prisma.column.create({
            data: {
                boardId: boardId,
                title: title,
                order: newOrder,
            }
        });

        // 💡 EMIT SOCKET EVENT untuk column created
        try {
            socketManager.broadcastToBoard(
                boardId,
                "column-updated",
                {
                    type: "CREATED",
                    columnId: newColumn.id,
                    column: newColumn,
                    createdBy: userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string // Exclude sender jika ada
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event for column creation:", socketErr);
            // Jangan gagalkan request utama karena error socket
        }

        return res.status(201).json({ 
            message: "Column created successfully", 
            column: newColumn 
        });
    } catch (err: any) {
        // Indonesian comments: Jika boardId tidak valid atau error lainnya
        if (err.code === 'P2003') { 
            return res.status(404).json({ error: "Board not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to create column" });
    }
}

// ----------------------------------------------------
// READ Columns (OWNER, EDITOR, VIEWER)
// ----------------------------------------------------
export async function getColumnsByBoardId(req: ColumnRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);

    try {
        const columns = await prisma.column.findMany({
            where: { boardId: boardId },
            orderBy: { order: 'asc' },
            include: {
                cards: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        return res.json(columns);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve columns" });
    }
}

// ----------------------------------------------------
// PATCH Column Metadata (OWNER/EDITOR) - Hanya Title
// ----------------------------------------------------
export async function updateColumn(req: ColumnRequest, res: Response) {
    const columnId = parseInt(req.params.columnId);
    const boardId = parseInt(req.params.boardId);
    const { title } = req.body; 
    
    // Indonesian comments: RBAC: OWNER dan EDITOR (minRole: EDITOR) yang boleh update
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can update column metadata" });
    }

    if (title === undefined) {
        return res.status(400).json({ error: "Title data is required for metadata update" });
    }

    try {
        const updatedColumn = await prisma.column.update({
            where: { id: columnId, boardId: boardId },
            data: { title: title },
        });

        // 💡 EMIT SOCKET EVENT untuk column updated
        try {
            socketManager.broadcastToBoard(
                boardId,
                "column-updated",
                {
                    type: "UPDATED",
                    columnId: columnId,
                    column: updatedColumn,
                    updatedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string // Exclude sender jika ada
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event for column update:", socketErr);
        }

        return res.json({ message: "Column title updated successfully", column: updatedColumn });
    } catch (err: any) {
        if (err.code === 'P2025' || err.code === 'P2003') {
            return res.status(404).json({ error: "Column or Board not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to update column title" });
    }
}

// ----------------------------------------------------
// PUT Column Order (OWNER/EDITOR) - Reordering dengan Drag & Drop
// ----------------------------------------------------
export async function moveColumn(req: ColumnRequest, res: Response) {
    const columnId = parseInt(req.params.columnId);
    const boardId = parseInt(req.params.boardId);
    const { order: newOrder } = req.body;
    
    // Indonesian comments: RBAC: OWNER dan EDITOR (minRole: EDITOR) yang boleh update order
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can change column order" });
    }

    if (newOrder === undefined || typeof newOrder !== 'number') {
        return res.status(400).json({ error: "New order (number) is required" });
    }

    try {
        // 1. Ambil data column saat ini
        const currentColumn = await prisma.column.findUnique({
            where: { id: columnId, boardId: boardId },
            select: { order: true }
        });

        if (!currentColumn) {
            return res.status(404).json({ error: "Column not found in this board" });
        }

        const oldOrder = currentColumn.order;

        if (oldOrder === newOrder) {
            return res.json({ message: "Column order is already up-to-date." });
        }

        // 2. Gunakan transaction untuk memastikan konsistensi
        const result = await prisma.$transaction(async (tx) => {
            // Set temporary order negatif untuk menghindari conflict
            await tx.column.update({
                where: { id: columnId },
                data: { order: -999999 }
            });

            // 3. Logic reordering
            if (newOrder < oldOrder) {
                // Pindah ke depan (order lebih kecil)
                await tx.column.updateMany({
                    where: { 
                        boardId: boardId,
                        order: { gte: newOrder, lt: oldOrder }
                    },
                    data: { order: { increment: 1 } },
                });
            } else {
                // Pindah ke belakang (order lebih besar)
                await tx.column.updateMany({
                    where: { 
                        boardId: boardId,
                        order: { gt: oldOrder, lte: newOrder }
                    },
                    data: { order: { decrement: 1 } },
                });
            }

            // 4. Update column dengan order baru
            await tx.column.update({
                where: { id: columnId },
                data: { order: newOrder },
            });

            // 5. Dapatkan column yang sudah diupdate
            const updatedColumn = await tx.column.findUnique({
                where: { id: columnId },
                include: {
                    cards: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            return updatedColumn;
        }, {
            isolationLevel: 'Serializable'
        });

        // 💡 EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            socketManager.broadcastToBoard(
                boardId,
                "column-updated",
                {
                    type: "MOVED",
                    columnId: columnId,
                    newOrder: newOrder,
                    column: result,
                    movedBy: userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string // Exclude sender jika ada
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Column order updated successfully", 
            column: result 
        });
    } catch (err: any) {
        console.error("Error in moveColumn:", err);
        
        if (err.code === 'P2025' || err.code === 'P2003') {
            return res.status(404).json({ error: "Column or Board not found" });
        }
        
        if (err.code === 'P2002') {
            // Retry logic untuk handle unique constraint violation
            try {
                console.log("Retrying column move operation...");
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Reset semua order di board ini
                await resetColumnOrders(boardId);
                return res.status(500).json({ 
                    error: "Column order conflict detected. Please refresh the page." 
                });
            } catch (retryErr) {
                console.error("Retry failed:", retryErr);
            }
        }
        
        return res.status(500).json({ error: "Failed to update column order" });
    }
}

// Helper function untuk reset semua order column
async function resetColumnOrders(boardId: number) {
    const columns = await prisma.column.findMany({
        where: { boardId: boardId },
        orderBy: { order: 'asc' },
        select: { id: true }
    });

    for (let i = 0; i < columns.length; i++) {
        await prisma.column.update({
            where: { id: columns[i].id },
            data: { order: i }
        });
    }
}

// ----------------------------------------------------
// DELETE Column (OWNER Only)
// ----------------------------------------------------
export async function deleteColumn(req: ColumnRequest, res: Response) {
    const columnId = parseInt(req.params.columnId);
    const boardId = parseInt(req.params.boardId);

    // Indonesian comments: Batasan RBAC: Hanya OWNER yang boleh delete
    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can delete columns" });
    }

    try {
        // 💡 Simpan data column sebelum dihapus untuk socket event
        const columnToDelete = await prisma.column.findUnique({
            where: { id: columnId, boardId: boardId },
            select: { id: true, order: true, title: true }
        });

        if (!columnToDelete) {
            return res.status(404).json({ error: "Column not found in this board" });
        }

        // Indonesian comments: Hapus column dan ambil order-nya
        const deletedColumn = await prisma.column.delete({
            where: { id: columnId, boardId: boardId },
            select: { order: true }
        });

        // Indonesian comments: Geser order column lain yang berada setelah column yang dihapus
        await prisma.column.updateMany({
            where: {
                boardId: boardId,
                order: { gt: deletedColumn.order },
            },
            data: { order: { decrement: 1 } },
        });

        // 💡 EMIT SOCKET EVENT untuk column deleted
        try {
            socketManager.broadcastToBoard(
                boardId,
                "column-updated",
                {
                    type: "DELETED",
                    columnId: columnId,
                    deletedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string // Exclude sender jika ada
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event for column deletion:", socketErr);
        }

        return res.json({ message: "Column deleted successfully, and subsequent columns re-ordered" });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Column not found in this board" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to delete column" });
    }
}