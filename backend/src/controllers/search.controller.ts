//searc.controller.ts

import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

export async function globalSearch(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });
    
    const query = req.query.q as string; 
    const queryTerm = query ? query.trim() : '';

    if (!queryTerm || queryTerm.length < 3) {
        return res.status(400).json({ error: "Search query 'q' must be at least 3 characters long for prefix search." });
    }
    const searchCondition = { startsWith: queryTerm, mode: 'insensitive' as const }; 

    try {
        const foundBoards = await prisma.board.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
                OR: [
                    { name: searchCondition }, 
                ],
            },
            select: {
                id: true,
                name: true,
                category: true,
                members: {
                    where: { userId: userId },
                    select: { role: true }
                }
            },
            orderBy: { name: 'asc' }, 
            take: 10,
        });
        
        // 2. Cari Columns yang match dengan query dan user punya akses ke board-nya
        const foundColumns = await prisma.column.findMany({
            where: {
                board: {
                    members: {
                        some: {
                            userId: userId, // Column hanya yang ada di board yang diakses user
                        },
                    },
                },
                OR: [
                    { title: searchCondition }, 
                ],
            },
            select: {
                id: true,
                title: true,
                boardId: true,
                board: {
                    select: { name: true } // Tampilkan nama board tempat column berada
                }
            },
            orderBy: { title: 'asc' }, 
            take: 15,
        });

        // 3. Cari Cards yang match dengan query dan user punya akses ke board-nya
        const foundCards = await prisma.card.findMany({
            where: {
                board: {
                    members: {
                        some: {
                            userId: userId, // Card hanya yang ada di board yang diakses user
                        },
                    },
                },
                OR: [
                    { title: searchCondition }, 
                    // Indonesian comments: Description tetap dihilangkan untuk prefix search demi performa
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                boardId: true,
                columnId: true,
                board: {
                    select: { name: true }
                }
            },
            orderBy: { title: 'asc' }, 
            take: 20, 
        });

        return res.json({
            message: `Prefix search results for query: "${queryTerm}"`,
            boards: foundBoards,
            columns: foundColumns,
            cards: foundCards,
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to perform global search" });
    }
}