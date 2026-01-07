import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { AccessRole, Prisma } from "@prisma/client";
import socketManager from "../lib/socket";

// Indonesian comments: Interface untuk Request dengan Role tambahan
interface ChecklistRequest extends AuthenticatedRequest {
    userRole?: AccessRole; // Ditambahkan oleh middleware checkBoardAccess
}

// Tipe untuk Prisma transaction
type Transaction = Prisma.TransactionClient;

// Helper function untuk update checklist progress di Card
async function updateCardChecklistProgress(cardId: number, tx: Transaction) {
    const checklistItems = await tx.checklistItem.findMany({
        where: { cardId: cardId },
        select: { completed: true }
    });
    
    const total = checklistItems.length;
    const completed = checklistItems.filter((item: { completed: boolean }) => item.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    await tx.card.update({
        where: { id: cardId },
        data: {
            checklist: {
                total: total,
                completed: completed,
                progress: progress
            }
        }
    });
    
    return { total, completed, progress };
}

// ----------------------------------------------------
// CREATE Checklist Item (OWNER/EDITOR)
// ----------------------------------------------------
export async function createChecklistItem(req: ChecklistRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const { text } = req.body;

    // Indonesian comments: RBAC: OWNER dan EDITOR yang boleh memodifikasi
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can manage checklists" });
    }

    if (!text) {
        return res.status(400).json({ error: "Checklist item text is required" });
    }

    try {
        // Cari card untuk mendapatkan boardId
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true, columnId: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        // Cari order tertinggi di card ini
        const latestItem = await prisma.checklistItem.findFirst({
            where: { cardId: cardId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const newOrder = latestItem ? latestItem.order + 1 : 0;

        const result = await prisma.$transaction(async (tx: Transaction) => {
            // Buat checklist item
            const newItem = await tx.checklistItem.create({
                data: {
                    cardId: cardId,
                    text: text,
                    order: newOrder,
                },
                include: {
                    card: {
                        select: {
                            id: true,
                            title: true,
                            boardId: true,
                            columnId: true
                        }
                    }
                }
            });

            // Update checklist progress di Card
            const progress = await updateCardChecklistProgress(cardId, tx);
            
            return { item: newItem, progress };
        });

        // 💡 EMIT SOCKET EVENT untuk real-time update
        try {
            socketManager.broadcastToBoard(
                card.boardId,
                "checklist-updated",
                {
                    type: "ITEM_CREATED",
                    cardId: cardId,
                    columnId: card.columnId,
                    item: result.item,
                    progress: result.progress,
                    updatedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string // Exclude sender jika ada
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.status(201).json({ 
            message: "Checklist item added successfully", 
            item: result.item,
            progress: result.progress
        });
    } catch (err: any) {
        // Jika cardId tidak valid atau error lainnya
        if (err.code === 'P2003') { 
            return res.status(404).json({ error: "Card not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to create checklist item" });
    }
}

// ----------------------------------------------------
// READ Checklist Items for a Card (VIEWER, EDITOR, OWNER)
// ----------------------------------------------------
export async function getChecklistItems(req: ChecklistRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);

    try {
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        const items = await prisma.checklistItem.findMany({
            where: { cardId: cardId },
            orderBy: { order: 'asc' }
        });

        // Get progress data
        const total = items.length;
        const completed = items.filter(item => item.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return res.json({
            items,
            progress: {
                total,
                completed,
                progress
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve checklist items" });
    }
}

// ----------------------------------------------------
// UPDATE Checklist Item (OWNER/EDITOR) - Toggle Completed atau Update Text/Order
// ----------------------------------------------------
export async function updateChecklistItem(req: ChecklistRequest, res: Response) {
    const itemId = parseInt(req.params.itemId);
    const { text, completed, order } = req.body;

    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can modify checklists" });
    }

    // Pastikan ada data yang diupdate
    if (text === undefined && completed === undefined && order === undefined) {
        return res.status(400).json({ error: "No update data provided" });
    }

    try {
        // Cari item dan card terkait
        const item = await prisma.checklistItem.findUnique({
            where: { id: itemId },
            include: {
                card: {
                    select: {
                        id: true,
                        boardId: true,
                        columnId: true
                    }
                }
            }
        });

        if (!item) {
            return res.status(404).json({ error: "Checklist item not found" });
        }

        const result = await prisma.$transaction(async (tx: Transaction) => {
            const updateData: { text?: string, completed?: boolean, order?: number } = {};
            
            if (text !== undefined) updateData.text = text;
            if (completed !== undefined) updateData.completed = completed;
            
            // Handle reordering jika order diubah
            if (order !== undefined) {
                const currentOrder = item.order;
                
                if (order !== currentOrder) {
                    // Geser item lain
                    if (order > currentOrder) {
                        await tx.checklistItem.updateMany({
                            where: {
                                cardId: item.cardId,
                                order: { gt: currentOrder, lte: order }
                            },
                            data: { order: { decrement: 1 } }
                        });
                    } else {
                        await tx.checklistItem.updateMany({
                            where: {
                                cardId: item.cardId,
                                order: { gte: order, lt: currentOrder }
                            },
                            data: { order: { increment: 1 } }
                        });
                    }
                    
                    updateData.order = order;
                }
            }

            // Update item
            const updatedItem = await tx.checklistItem.update({
                where: { id: itemId },
                data: updateData,
                include: {
                    card: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                }
            });

            // Update checklist progress di Card
            const progress = await updateCardChecklistProgress(item.cardId, tx);
            
            return { item: updatedItem, progress };
        });

        // 💡 EMIT SOCKET EVENT untuk real-time update
        try {
            socketManager.broadcastToBoard(
                item.card.boardId,
                "checklist-updated",
                {
                    type: completed !== undefined ? "ITEM_TOGGLED" : "ITEM_UPDATED",
                    cardId: item.cardId,
                    columnId: item.card.columnId,
                    itemId: itemId,
                    item: result.item,
                    progress: result.progress,
                    updatedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Checklist item updated successfully", 
            item: result.item,
            progress: result.progress
        });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Checklist item not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to update checklist item" });
    }
}

// ----------------------------------------------------
// BULK UPDATE Checklist Items Order (OWNER/EDITOR)
// ----------------------------------------------------
export async function reorderChecklistItems(req: ChecklistRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const { items } = req.body; // Array of { id, order }

    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can reorder checklist" });
    }

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Items array is required" });
    }

    try {
        // Cari card untuk mendapatkan boardId
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true, columnId: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        await prisma.$transaction(async (tx: Transaction) => {
            // Update semua item dengan order baru
            for (const item of items) {
                await tx.checklistItem.update({
                    where: { id: item.id, cardId: cardId },
                    data: { order: item.order }
                });
            }
            
            // Update progress
            await updateCardChecklistProgress(cardId, tx);
        });

        // 💡 EMIT SOCKET EVENT untuk real-time update
        try {
            socketManager.broadcastToBoard(
                card.boardId,
                "checklist-updated",
                {
                    type: "ITEMS_REORDERED",
                    cardId: cardId,
                    columnId: card.columnId,
                    items: items,
                    updatedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Checklist items reordered successfully" 
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to reorder checklist items" });
    }
}

// ----------------------------------------------------
// DELETE Checklist Item (OWNER/EDITOR)
// ----------------------------------------------------
export async function deleteChecklistItem(req: ChecklistRequest, res: Response) {
    const itemId = parseInt(req.params.itemId);

    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can manage checklists" });
    }

    try {
        // Cari item untuk mendapatkan card dan board info
        const itemToDelete = await prisma.checklistItem.findUnique({
            where: { id: itemId },
            include: {
                card: {
                    select: {
                        id: true,
                        boardId: true,
                        columnId: true
                    }
                }
            }
        });
        
        if (!itemToDelete) {
             return res.status(404).json({ error: "Checklist item not found" });
        }

        const result = await prisma.$transaction(async (tx: Transaction) => {
            // Hapus item
            await tx.checklistItem.delete({
                where: { id: itemId },
            });
            
            // Geser order item lain di card yang sama
            await tx.checklistItem.updateMany({
                where: {
                    cardId: itemToDelete.cardId,
                    order: { gt: itemToDelete.order },
                },
                data: { order: { decrement: 1 } },
            });

            // Update checklist progress di Card
            const progress = await updateCardChecklistProgress(itemToDelete.cardId, tx);
            
            return progress;
        });

        // 💡 EMIT SOCKET EVENT untuk real-time update
        try {
            socketManager.broadcastToBoard(
                itemToDelete.card.boardId,
                "checklist-updated",
                {
                    type: "ITEM_DELETED",
                    cardId: itemToDelete.cardId,
                    columnId: itemToDelete.card.columnId,
                    itemId: itemId,
                    progress: result,
                    updatedBy: req.userId,
                    timestamp: new Date().toISOString(),
                },
                req.headers['socket-id'] as string
            );
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Checklist item deleted successfully",
            progress: result
        });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Checklist item not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to delete checklist item" });
    }
}