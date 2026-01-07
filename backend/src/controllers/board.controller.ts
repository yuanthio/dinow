//board.controller.ts

import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { defaultBoardTemplate } from "../lib/constan";
import { AccessRole, Priority, Category } from "@prisma/client";

// Indonesian comments: Interface untuk Request dengan Role tambahan
interface BoardRequest extends AuthenticatedRequest {
    userRole?: AccessRole; // Ditambahkan oleh middleware checkBoardAccess
}

// Tambahkan import untuk BoardType
interface BoardRequestBody {
    name: string;
    priority: Priority;
    category: Category;
    deadline?: string;
    type?: 'template' | 'custom'; // Tambahkan field type
}

// ----------------------------------------------------
// CREATE Board (Hanya bisa oleh User yang bersangkutan)
// ----------------------------------------------------
export async function createBoard(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    // Ambil data board dari body
    const { name, priority, category, deadline, type = 'template' } = req.body as BoardRequestBody;

    if (!name) {
        return res.status(400).json({ error: "Board name is required" });
    }

    try {
        // Buat Board dan Column default dalam satu transaction
        const newBoard = await prisma.$transaction(async (tx) => {
            const board = await tx.board.create({
                data: {
                    userId: userId,
                    name: name,
                    priority: priority as Priority || Priority.LOW,
                    category: category as Category || Category.PERSONAL,
                    deadline: deadline ? new Date(deadline) : undefined,
                    
                    // 1. Tambahkan pembuat sebagai OWNER
                    members: {
                        create: {
                            userId: userId,
                            role: AccessRole.OWNER,
                        },
                    },
                    
                    // 2. Auto generate 3 column default hanya jika type = 'template'
                    columns: type === 'template' ? {
                        createMany: {
                            data: defaultBoardTemplate.map((col, index) => ({
                                title: col.title,
                                order: index,
                            })),
                        },
                    } : undefined,
                },
                // Ambil data board, member, dan column yang baru dibuat
                include: {
                    members: { select: { role: true, userId: true } },
                    columns: { orderBy: { order: 'asc' } }
                }
            });

            return board;
        });

        return res.status(201).json({ 
            message: `Board created successfully${type === 'template' ? ' with default columns' : ''}`, 
            board: newBoard 
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create board" });
    }
}

// ----------------------------------------------------
// READ Board (All members: OWNER, EDITOR, VIEWER)
// ----------------------------------------------------
export async function getBoardById(req: BoardRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);
    // const userRole = req.userRole; // 💡 Role user sudah dicek di middleware checkBoardAccess

    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                user: { select: { id: true, username: true, email: true } }, // Owner board (userId)
                members: { 
                    select: { user: { select: { id: true, username: true, email: true } }, role: true },
                    orderBy: { role: 'asc' } // Urutkan biar OWNER di atas
                },
                columns: {
                    orderBy: { order: 'asc' },
                    include: {
                        cards: {
                            orderBy: { order: 'asc' }
                        }
                    }
                    },
            }
        });

        // Indonesian comments: Board tidak ditemukan (walaupun harusnya sudah dicek di middleware, 
        // tapi biar aman)
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }
        
        // Indonesian comments: Kirim data board lengkap
        return res.json(board);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve board" });
    }
}

// ----------------------------------------------------
// READ Board List (User yang merupakan OWNER, EDITOR, atau VIEWER)
// ----------------------------------------------------
export async function getMyBoards(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });
    
    // Extract query parameters for filtering and sorting
    const { category, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    try {
        // Build where clause for filtering
        const whereClause: any = {
            members: {
                some: {
                    userId: userId,
                },
            },
        };
        
        // Add filters if provided
        if (category) {
            whereClause.category = category;
        }
        
        if (priority) {
            whereClause.priority = priority;
        }
        
        // Build order clause for sorting
        const orderClause: any = {};
        orderClause[sortBy as string] = sortOrder;
        
        // Indonesian comments: Cari semua board di mana user adalah membernya dengan filter dan sorting
        const boards = await prisma.board.findMany({
            where: whereClause,
            include: {
                members: {
                    select: { 
                        user: { select: { id: true, username: true, email: true } }, 
                        role: true 
                    },
                },
                columns: {
                    include: {
                        cards: {
                            select: { id: true },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: orderClause
        });

        return res.json(boards);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve boards" });
    }
}

// ----------------------------------------------------
// UPDATE Board (Hanya OWNER: full CRUD dashboard)
// ----------------------------------------------------
export async function updateBoard(req: BoardRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);
    const userId = req.userId;
    // const userRole = req.userRole; // Pasti OWNER karena di-filter di router

    // Indonesian comments: Ambil field yang mau diupdate
    const { name, priority, category, deadline } = req.body;
    
    // Indonesian comments: Pastikan ada data yang mau diupdate
    if (!name && !priority && !category && !deadline) {
        return res.status(400).json({ error: "No update data provided" });
    }

    try {
        const updatedBoard = await prisma.board.update({
            where: { id: boardId, userId: userId }, // 💡 Cek juga dia owner asli di table Board
            data: {
                name: name,
                priority: priority as Priority,
                category: category as Category,
                deadline: deadline ? new Date(deadline) : undefined,
            },
        });

        return res.json({ message: "Board updated successfully", board: updatedBoard });
    } catch (err: any) {
        // Indonesian comments: Jika boardId salah atau user bukan owner
        if (err.code === 'P2025') { 
             return res.status(404).json({ error: "Board not found or you are not the owner" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to update board" });
    }
}

// ----------------------------------------------------
// DELETE Board (Hanya OWNER: full CRUD dashboard)
// ----------------------------------------------------
export async function deleteBoard(req: BoardRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);
    const userId = req.userId;
    // const userRole = req.userRole; // Pasti OWNER

    try {
        // Indonesian comments: Hapus board. Cascade delete akan menghapus Column, Card, 
        // BoardAccess, dan BoardInvitation terkait
        await prisma.board.delete({
            where: {
                id: boardId,
                userId: userId, // 💡 Pastikan hanya owner yang bisa delete
            },
        });

        return res.json({ message: "Board deleted successfully" });
    } catch (err:any) {
        // Indonesian comments: Jika boardId salah atau user bukan owner
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Board not found or you are not the owner" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to delete board" });
    }
}