import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { AccessRole } from "@prisma/client";
import socketManager from "../lib/socket"; // Tambahkan import socketManager
import { getFileUrl, deleteFile } from "../utils/upload";

// Indonesian comments: Interface untuk Request dengan Role tambahan
interface CardRequest extends AuthenticatedRequest {
    userRole?: AccessRole; // Ditambahkan oleh middleware checkBoardAccess
}

// ----------------------------------------------------
// CREATE Card (OWNER Only)
// ----------------------------------------------------
export async function createCard(req: CardRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);
    const { columnId, title, description } = req.body;

    // Indonesian comments: Batasan RBAC: Hanya OWNER yang boleh create
    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can create cards" });
    }

    if (!columnId || !title) {
        return res.status(400).json({ error: "columnId and title are required" });
    }

    try {
        const column = await prisma.column.findUnique({
            where: { id: columnId, boardId: boardId },
            select: { id: true }
        });

        if (!column) {
            return res.status(404).json({ error: "Column not found in this board" });
        }
        
        const latestCard = await prisma.card.findFirst({
            where: { columnId: columnId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const newOrder = latestCard ? latestCard.order + 1 : 0;

        const newCard = await prisma.card.create({
            data: {
                boardId: boardId,
                columnId: columnId,
                title: title,
                description: description,
                order: newOrder,
            }
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "CREATED",
                        cardId: newCard.id,
                        card: newCard,
                        createdBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined // Exclude sender jika ada
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
            // Jangan gagalkan request utama karena error socket
        }

        return res.status(201).json({ 
            message: "Card created successfully", 
            card: newCard 
        });
    } catch (err: any) {
        if (err.code === 'P2003') { 
            return res.status(404).json({ error: "Board not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to create card" });
    }
}

// ----------------------------------------------------
// READ Cards (OWNER, EDITOR, VIEWER)
// ----------------------------------------------------
export async function getCardsByBoardId(req: CardRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);

    try {
        const cards = await prisma.card.findMany({
            where: { boardId: boardId },
            include: {
                column: { select: { id: true, title: true } }
            },
            orderBy: { columnId: 'asc', order: 'asc' }
        });

        return res.json(cards);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve cards" });
    }
}

// ----------------------------------------------------
// PATCH Card Metadata (OWNER/EDITOR) - Title, Desc
// ----------------------------------------------------
export async function updateCard(req: CardRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const boardId = parseInt(req.params.boardId);
    
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can update card metadata" });
    }

    const { title, description } = req.body;
    
    if (title === undefined && description === undefined) {
        return res.status(400).json({ error: "No metadata update data provided" });
    }

    try {
        const updatedCard = await prisma.card.update({
            where: { id: cardId, boardId: boardId },
            data: {
                title: title,
                description: description,
            },
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "UPDATED",
                        cardId: cardId,
                        card: updatedCard,
                        updatedBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined // Exclude sender jika ada
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
            // Jangan gagalkan request utama karena error socket
        }

        return res.json({ message: "Card metadata updated successfully", card: updatedCard });
    } catch (err: any) {
        if (err.code === 'P2025' || err.code === 'P2003') {
            return res.status(404).json({ error: "Card/Column not found" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to update card metadata" });
    }
}

// ----------------------------------------------------
// PUT Card Move/Order (OWNER/EDITOR) - Order dan/atau ColumnId
// ----------------------------------------------------
export async function moveCard(req: CardRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const boardId = parseInt(req.params.boardId);
    
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can move/reorder cards" });
    }

    const { order: newOrder, columnId: newColumnId } = req.body;
    
    if (newOrder === undefined && newColumnId === undefined) {
        return res.status(400).json({ error: "New order or new columnId is required for move operation" });
    }

    try {
        // 1. Ambil data card saat ini tanpa transaction untuk menghindari nested transaction
        const currentCard = await prisma.card.findUnique({
            where: { id: cardId, boardId: boardId },
            select: { order: true, columnId: true }
        });

        if (!currentCard) {
            return res.status(404).json({ error: "Card not found in this board" });
        }

        const oldColumnId = currentCard.columnId;
        const oldOrder = currentCard.order;
        
        // Tentukan target
        let targetColumnId = newColumnId !== undefined ? newColumnId : oldColumnId;
        let targetOrder = newOrder !== undefined ? newOrder : oldOrder;
        
        const isColumnChange = targetColumnId !== oldColumnId;
        const isOrderChange = targetOrder !== oldOrder;

        if (!isColumnChange && !isOrderChange) {
            return res.json({ message: "Card position is already up-to-date." });
        }
        
        // Validasi Column Baru (Jika pindah column)
        if (isColumnChange) {
            const targetColumn = await prisma.column.findUnique({
                where: { id: targetColumnId, boardId: boardId },
                select: { id: true }
            });
            if (!targetColumn) {
                return res.status(404).json({ error: "Target column not found in this board" });
            }
        }

        // Validasi targetOrder tidak negatif
        if (targetOrder < 0) {
            targetOrder = 0;
        }

        // 2. Gunakan single transaction dengan isolation level yang lebih rendah
        const result = await prisma.$transaction(async (tx) => {
            // KASUS 1: Pindah ke column berbeda
            if (isColumnChange) {
                console.log(`Moving card ${cardId} from column ${oldColumnId} to ${targetColumnId}, order ${oldOrder} to ${targetOrder}`);
                
                // 1. Geser card di column lama ke atas (tanpa temporary order)
                await tx.card.updateMany({
                    where: {
                        columnId: oldColumnId,
                        order: { gt: oldOrder },
                    },
                    data: { order: { decrement: 1 } },
                });
                
                // 2. Cari max order di column baru
                const maxOrderResult = await tx.card.aggregate({
                    where: { columnId: targetColumnId },
                    _max: { order: true }
                });
                const maxOrder = maxOrderResult._max.order || 0;
                
                // 3. Adjust target order jika melebihi max order
                if (targetOrder > maxOrder + 1) {
                    targetOrder = maxOrder + 1;
                }
                
                // 4. Geser card di column baru ke bawah untuk memberi ruang
                await tx.card.updateMany({
                    where: {
                        columnId: targetColumnId,
                        order: { gte: targetOrder },
                    },
                    data: { order: { increment: 1 } },
                });
                
                // 5. Update card dengan column dan order baru (dalam satu operation)
                const updatedCard = await tx.card.update({
                    where: { id: cardId },
                    data: {
                        columnId: targetColumnId,
                        order: targetOrder,
                    },
                    include: { column: { select: { title: true } } }
                });
                
                return updatedCard;
            }
            // KASUS 2: Reorder di column yang sama
            else if (isOrderChange) {
                console.log(`Reordering card ${cardId} in column ${oldColumnId}, from order ${oldOrder} to ${targetOrder}`);
                
                // 1. Hitung max order di column
                const maxOrderResult = await tx.card.aggregate({
                    where: { columnId: oldColumnId },
                    _max: { order: true }
                });
                const maxOrder = maxOrderResult._max.order || 0;
                
                // 2. Adjust target order jika melebihi batas
                if (targetOrder > maxOrder) {
                    targetOrder = maxOrder;
                }
                
                // 3. Logic reordering berdasarkan posisi
                if (targetOrder > oldOrder) {
                    // Pindah ke bawah
                    await tx.card.updateMany({
                        where: {
                            columnId: oldColumnId,
                            order: { gt: oldOrder, lte: targetOrder },
                        },
                        data: { order: { decrement: 1 } },
                    });
                } else if (targetOrder < oldOrder) {
                    // Pindah ke atas
                    await tx.card.updateMany({
                        where: {
                            columnId: oldColumnId,
                            order: { gte: targetOrder, lt: oldOrder },
                        },
                        data: { order: { increment: 1 } },
                    });
                }
                
                // 4. Update card dengan order baru
                const updatedCard = await tx.card.update({
                    where: { id: cardId },
                    data: { order: targetOrder },
                    include: { column: { select: { title: true } } }
                });
                
                return updatedCard;
            }
            
            // 5. Default case (shouldn't reach here)
            return await tx.card.findUnique({
                where: { id: cardId },
                include: { column: { select: { title: true } } }
            });
        }, {
            timeout: 5000,
            maxWait: 3000,
            isolationLevel: 'ReadCommitted' // Kurangi dari Serializable untuk menghindari deadlock
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "MOVED",
                        cardId: cardId,
                        fromColumnId: oldColumnId,
                        toColumnId: targetColumnId,
                        newOrder: targetOrder,
                        card: result,
                        movedBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined // Exclude sender jika ada
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
            // Jangan gagalkan request utama karena error socket
        }
        
        return res.json({ 
            message: "Card moved/reordered successfully", 
            card: result 
        });

    } catch (err: any) {
        console.error("Error in moveCard:", err);
        
        if (err.code === 'P2025' || err.code === 'P2003') {
            return res.status(404).json({ error: "Card/Column not found" });
        }
        
        if (err.code === 'P2034') {
            // Handle deadlock/write conflict dengan retry mechanism
            try {
                console.log("Deadlock detected, retrying with exponential backoff...");
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100)); // Random delay 100-300ms
                
                // Retry dengan approach yang lebih simple
                const retryResult = await retryMoveCardSafely(cardId, boardId, newOrder, newColumnId);
                
                // EMIT SOCKET EVENT untuk retry juga
                try {
                    const userId = req.userId;
                    if (userId && retryResult) {
                        socketManager.broadcastToBoard(
                            boardId,
                            "card-updated",
                            {
                                type: "MOVED",
                                cardId: cardId,
                                fromColumnId: retryResult.columnId,
                                toColumnId: retryResult.columnId,
                                newOrder: retryResult.order,
                                card: retryResult,
                                movedBy: userId,
                                timestamp: new Date().toISOString(),
                            },
                            req.headers['socket-id'] as string | undefined
                        );
                    }
                } catch (socketErr) {
                    console.error("Failed to emit socket event for retry:", socketErr);
                }
                
                return res.json({ 
                    message: "Card moved/reordered successfully (retry)", 
                    card: retryResult 
                });
            } catch (retryErr) {
                console.error("Retry failed:", retryErr);
                return res.status(500).json({ 
                    error: "Failed to move card due to database conflict. Please refresh the page and try again." 
                });
            }
        }
        
        if (err.code === 'P2002') {
            // Handle unique constraint conflict
            try {
                console.log("Order conflict detected, attempting recovery...");
                await recoverFromDuplicateOrder(boardId);
                
                // Retry setelah recovery
                const retryResult = await retryMoveCardSafely(cardId, boardId, newOrder, newColumnId);
                
                return res.json({ 
                    message: "Card moved/reordered successfully (after recovery)", 
                    card: retryResult 
                });
            } catch (recoveryErr) {
                console.error("Recovery failed:", recoveryErr);
                return res.status(500).json({ 
                    error: "Failed to move card due to order conflict. Please refresh the page and try again." 
                });
            }
        }
        
        return res.status(500).json({ error: "Failed to move/reorder card" });
    }
}

// Helper function untuk retry dengan pendekatan yang lebih aman
async function retryMoveCardSafely(cardId: number, boardId: number, newOrder?: number, newColumnId?: number) {
    // Gunakan approach reset all orders per column
    return await prisma.$transaction(async (tx) => {
        // Ambil current card info
        const currentCard = await tx.card.findUnique({
            where: { id: cardId },
            select: { columnId: true, order: true }
        });
        
        if (!currentCard) {
            throw new Error("Card not found");
        }
        
        const targetColumnId = newColumnId !== undefined ? newColumnId : currentCard.columnId;
        const targetOrder = newOrder !== undefined ? newOrder : currentCard.order;
        
        // Group cards by column
        const allCards = await tx.card.findMany({
            where: { boardId: boardId },
            orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
            select: { id: true, columnId: true, order: true }
        });
        
        // Group by column
        const cardsByColumn = new Map<number, typeof allCards>();
        allCards.forEach(card => {
            if (!cardsByColumn.has(card.columnId)) {
                cardsByColumn.set(card.columnId, []);
            }
            cardsByColumn.get(card.columnId)!.push(card);
        });
        
        // Process each column separately
        for (const [columnId, cards] of cardsByColumn) {
            if (columnId === targetColumnId) {
                // This is the target column - need to handle the moved card specially
                const otherCards = cards.filter(c => c.id !== cardId);
                
                // Update other cards first, avoiding the target order
                let orderIndex = 0;
                for (const card of otherCards.sort((a, b) => a.order - b.order)) {
                    // Skip the target order for other cards
                    if (orderIndex === targetOrder) {
                        orderIndex++;
                    }
                    if (card.order !== orderIndex) {
                        await tx.card.update({
                            where: { id: card.id },
                            data: { order: orderIndex }
                        });
                    }
                    orderIndex++;
                }
                
                // Update the moved card last with its target order
                await tx.card.update({
                    where: { id: cardId },
                    data: { 
                        columnId: targetColumnId,
                        order: targetOrder 
                    }
                });
            } else if (columnId === currentCard.columnId && columnId !== targetColumnId) {
                // This is the source column - remove the moved card and reindex
                const remainingCards = cards.filter(c => c.id !== cardId);
                
                // Reindex remaining cards
                for (let i = 0; i < remainingCards.length; i++) {
                    if (remainingCards[i].order !== i) {
                        await tx.card.update({
                            where: { id: remainingCards[i].id },
                            data: { order: i }
                        });
                    }
                }
            } else {
                // Other columns - just reindex if needed
                for (let i = 0; i < cards.length; i++) {
                    if (cards[i].order !== i) {
                        await tx.card.update({
                            where: { id: cards[i].id },
                            data: { order: i }
                        });
                    }
                }
            }
        }
        
        return await tx.card.findUnique({
            where: { id: cardId },
            include: { column: { select: { title: true } } }
        });
    }, {
        timeout: 10000,
        maxWait: 5000,
        isolationLevel: 'ReadCommitted'
    });
}

// Helper function untuk memperbaiki order di sebuah column
async function fixCardOrderInColumn(tx: any, columnId: number) {
    // Ambil semua card di column, urutkan berdasarkan order saat ini
    const cards = await tx.card.findMany({
        where: { columnId: columnId },
        orderBy: { order: 'asc' },
        select: { id: true, order: true }
    });
    
    // Update order untuk memastikan urutan 0, 1, 2, ...
    for (let i = 0; i < cards.length; i++) {
        if (cards[i].order !== i) {
            await tx.card.update({
                where: { id: cards[i].id },
                data: { order: i }
            });
        }
    }
}

// Helper function untuk recover dari duplicate order
async function recoverFromDuplicateOrder(boardId: number) {
    // Ambil semua column di board
    const columns = await prisma.column.findMany({
        where: { boardId: boardId },
        select: { id: true }
    });
    
    // Perbaiki order di setiap column
    for (const column of columns) {
        await fixCardOrderInColumnForRecovery(column.id);
    }
}

async function fixCardOrderInColumnForRecovery(columnId: number) {
    // Gunakan raw query untuk menghindari transaction conflict
    const cards = await prisma.$queryRaw`
        SELECT id, "order" 
        FROM "Card" 
        WHERE "columnId" = ${columnId}
        ORDER BY "order" ASC, "updatedAt" ASC
    ` as any[];
    
    // Update menggunakan batch untuk menghindari race condition
    for (let i = 0; i < cards.length; i++) {
        await prisma.card.updateMany({
            where: { 
                id: cards[i].id,
                columnId: columnId
            },
            data: { order: i }
        });
    }
}

// ----------------------------------------------------
// DELETE Card (OWNER Only)
// ----------------------------------------------------
export async function deleteCard(req: CardRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const boardId = parseInt(req.params.boardId);

    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can delete cards" });
    }

    try {
        const currentCard = await prisma.card.findUnique({
            where: { id: cardId, boardId: boardId },
            select: { order: true, columnId: true }
        });

        if (!currentCard) {
            return res.status(404).json({ error: "Card not found in this board" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.card.delete({
                where: { id: cardId },
            });

            await tx.card.updateMany({
                where: {
                    columnId: currentCard.columnId,
                    order: { gt: currentCard.order },
                },
                data: { order: { decrement: 1 } },
            });
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "DELETED",
                        cardId: cardId,
                        columnId: currentCard.columnId,
                        deletedBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined // Exclude sender jika ada
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
            // Jangan gagalkan request utama karena error socket
        }

        return res.json({ message: "Card deleted successfully, and subsequent cards re-ordered" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete card" });
    }
}

// ----------------------------------------------------
// UPLOAD Card Image (OWNER/EDITOR)
// ----------------------------------------------------
export async function uploadCardImage(req: CardRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const boardId = parseInt(req.params.boardId);
    
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can upload card images" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Cek card是否存在
        const card = await prisma.card.findUnique({
            where: { id: cardId, boardId: boardId },
            select: { id: true, imageUrl: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found in this board" });
        }

        // Hapus gambar lama jika ada
        if (card.imageUrl) {
            const oldFileName = card.imageUrl.split('/').pop();
            if (oldFileName) {
                deleteFile(oldFileName);
            }
        }

        // Update card dengan gambar baru
        const imageUrl = getFileUrl(req.file.filename);
        const updatedCard = await prisma.card.update({
            where: { id: cardId },
            data: { imageUrl: imageUrl }
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "IMAGE_UPDATED",
                        cardId: cardId,
                        card: updatedCard,
                        updatedBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Card image uploaded successfully", 
            card: updatedCard,
            imageUrl: imageUrl
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to upload card image" });
    }
}

// ----------------------------------------------------
// DELETE Card Image (OWNER/EDITOR)
// ----------------------------------------------------
export async function deleteCardImage(req: CardRequest, res: Response) {
    const cardId = parseInt(req.params.cardId);
    const boardId = parseInt(req.params.boardId);
    
    if (req.userRole !== AccessRole.OWNER && req.userRole !== AccessRole.EDITOR) {
        return res.status(403).json({ error: "Access Denied: Only OWNER or EDITOR can delete card images" });
    }

    try {
        // Cek card是否存在
        const card = await prisma.card.findUnique({
            where: { id: cardId, boardId: boardId },
            select: { id: true, imageUrl: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found in this board" });
        }

        if (!card.imageUrl) {
            return res.status(400).json({ error: "No image to delete" });
        }

        // Hapus file dari storage
        const fileName = card.imageUrl.split('/').pop();
        if (fileName) {
            deleteFile(fileName);
        }

        // Update card untuk menghapus imageUrl
        const updatedCard = await prisma.card.update({
            where: { id: cardId },
            data: { imageUrl: null }
        });

        // EMIT SOCKET EVENT untuk real-time update
        try {
            const userId = req.userId;
            if (userId) {
                socketManager.broadcastToBoard(
                    boardId,
                    "card-updated",
                    {
                        type: "IMAGE_DELETED",
                        cardId: cardId,
                        card: updatedCard,
                        updatedBy: userId,
                        timestamp: new Date().toISOString(),
                    },
                    req.headers['socket-id'] as string | undefined
                );
            }
        } catch (socketErr) {
            console.error("Failed to emit socket event:", socketErr);
        }

        return res.json({ 
            message: "Card image deleted successfully", 
            card: updatedCard
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete card image" });
    }
}