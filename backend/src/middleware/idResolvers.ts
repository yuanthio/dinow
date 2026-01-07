//src/middleware/idResolvers.ts

import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "./auth"; // 💡 Gunakan interface yang sama

// Indonesian comments: Middleware untuk mendapatkan Board ID dari Card ID
export async function resolveBoardIdFromCardId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Indonesian comments: Ambil cardId dari params
    const cardId = parseInt(req.params.cardId);

    if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid Card ID provided." });
    }

    try {
        // Cari boardId dari card
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found." });
        }
        
        // Indonesian comments: Attach boardId ke params agar bisa diakses oleh checkBoardAccess berikutnya
        (req as any).params.boardId = card.boardId.toString(); 
        
        next();
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to resolve Board ID from Card ID." });
    }
}

// Indonesian comments: Tambahkan resolver untuk Column (contoh)
export async function resolveBoardIdFromColumnId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const columnId = parseInt(req.params.columnId);

    if (isNaN(columnId)) {
        return res.status(400).json({ error: "Invalid Column ID provided." });
    }

    try {
        const column = await prisma.column.findUnique({
            where: { id: columnId },
            select: { boardId: true }
        });

        if (!column) {
            return res.status(404).json({ error: "Column not found." });
        }
        
        (req as any).params.boardId = column.boardId.toString(); 
        
        next();
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to resolve Board ID from Column ID." });
    }
}
