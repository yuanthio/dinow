//boardaccess.controller.ts

import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { AccessRole, InvitationStatus } from "@prisma/client";
// import { RoleHierarchy } from "../lib/constants"; // Tidak dipakai di controller ini

// Indonesian comments: Interface untuk Request dengan Role tambahan
interface BoardAccessRequest extends AuthenticatedRequest {
    userRole?: AccessRole; // Ditambahkan oleh middleware checkBoardAccess
}

// ----------------------------------------------------
// 1. ADD MEMBER (Instant Access, menggantikan inviteMember)
// ----------------------------------------------------

// Indonesian comments: OWNER menambahkan user lain langsung sebagai member
export async function addMember(req: BoardAccessRequest, res: Response) {
    const boardId = parseInt(req.params.boardId);
    const senderId = req.userId;
    // const userRole = req.userRole; // 💡 Sudah pasti OWNER

    const { recipientEmail, targetRole } = req.body;

    // Indonesian comments: Batasan RBAC: Hanya OWNER yang bisa add member
    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can add members" });
    }

    if (!recipientEmail || !targetRole || !Object.values(AccessRole).includes(targetRole)) {
        return res.status(400).json({ error: "Recipient email and a valid targetRole (OWNER, EDITOR, VIEWER) are required" });
    }
    
    // Indonesian comments: OWNER tidak boleh menambahkan dirinya sendiri
    if (senderId && recipientEmail === req.body.email) {
        return res.status(400).json({ error: "You cannot add yourself" });
    }

    try {
        // 1. Cari ID recipient
        const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail },
            select: { id: true, username: true }
        });

        if (!recipient) {
            return res.status(404).json({ error: "Recipient user not found" });
        }
        const recipientId = recipient.id;

        // 2. Cek apakah user sudah jadi member
        const isMember = await prisma.boardAccess.findUnique({
            where: { userId_boardId: { userId: recipientId, boardId: boardId } },
        });

        if (isMember) {
            return res.status(400).json({ error: "User is already a member of this board" });
        }
        
        // 3. Langsung tambahkan ke BoardAccess dalam transaksi
        await prisma.$transaction(async (tx) => {
            
            // Hapus/tolak semua undangan yang mungkin pending (biar bersih)
            await tx.boardInvitation.deleteMany({
                where: { boardId: boardId, recipientId: recipientId, status: InvitationStatus.PENDING }
            });

            // Langsung buat entry di BoardAccess
            await tx.boardAccess.create({
                data: {
                    userId: recipientId,
                    boardId: boardId,
                    role: targetRole,
                },
            });
            
            // Buat entry BoardInvitation sebagai history 'Accepted'
            await tx.boardInvitation.upsert({
                where: {
                    boardId_recipientId: { boardId: boardId, recipientId: recipientId }
                },
                update: { 
                    targetRole: targetRole,
                    status: InvitationStatus.ACCEPTED,
                    senderId: senderId!, // Update sender jika perlu
                },
                create: {
                    boardId: boardId,
                    senderId: senderId!,
                    recipientId: recipientId,
                    targetRole: targetRole,
                    status: InvitationStatus.ACCEPTED,
                },
            });

        });

        return res.status(201).json({ 
            message: `User ${recipient.username} instantly added as ${targetRole}`,
            member: { userId: recipientId, role: targetRole, boardId: boardId }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Failed to add member" });
    }
}

// Indonesian comments: HAPUS fungsi handleInvitation
// export async function handleInvitation(...) {...}

// ----------------------------------------------------
// 2. MEMBER MANAGEMENT (UPDATE ROLE & REMOVE MEMBER)
// ----------------------------------------------------
// ... (updateMemberRole dan removeMember tetap SAMA karena tidak ada perubahan logic di sana)

export async function updateMemberRole(req: BoardAccessRequest, res: Response) {
// ... (Kode updateMemberRole sebelumnya tetap di sini)
    const boardId = parseInt(req.params.boardId);
    const targetUserId = parseInt(req.params.targetUserId);

    const { newRole } = req.body;

    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can update member roles" });
    }

    if (!newRole || !Object.values(AccessRole).includes(newRole)) {
        return res.status(400).json({ error: "A valid newRole (OWNER, EDITOR, VIEWER) is required" });
    }

    if (targetUserId === req.userId) {
        return res.status(400).json({ error: "Cannot change your own role using this endpoint" });
    }
    
    if (newRole === AccessRole.OWNER) {
        return res.status(400).json({ error: "Cannot assign OWNER role to another member using this endpoint (use transfer ownership endpoint instead)" });
    }


    try {
        const updatedAccess = await prisma.boardAccess.update({
            where: {
                userId_boardId: {
                    userId: targetUserId,
                    boardId: boardId,
                }
            },
            data: {
                role: newRole,
            },
            include: { user: { select: { username: true } } }
        });

        return res.json({ 
            message: `Role of ${updatedAccess.user.username} updated to ${newRole}`, 
            access: updatedAccess 
        });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Member not found in this board" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to update member role" });
    }
}

export async function removeMember(req: BoardAccessRequest, res: Response) {
// ... (Kode removeMember sebelumnya tetap di sini)
    const boardId = parseInt(req.params.boardId);
    const targetUserId = parseInt(req.params.targetUserId);

    if (req.userRole !== AccessRole.OWNER) {
        return res.status(403).json({ error: "Access Denied: Only OWNER can remove members" });
    }
    
    if (targetUserId === req.userId) {
        return res.status(400).json({ error: "Cannot remove yourself (transfer ownership first)" });
    }

    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { userId: true }
        });

        if (board && board.userId === targetUserId) {
            return res.status(400).json({ error: "Cannot remove the primary board owner. Transfer ownership first." });
        }

        // Hapus akses dan hapus/tolak undangan terkait
        await prisma.$transaction(async (tx) => {
            await tx.boardAccess.delete({
                where: {
                    userId_boardId: {
                        userId: targetUserId,
                        boardId: boardId,
                    }
                }
            });
            
            // Tandai semua undangan yang mungkin pernah dikirim sebagai rejected (bersihkan history pending)
            await tx.boardInvitation.updateMany({
                where: { boardId: boardId, recipientId: targetUserId },
                data: { status: InvitationStatus.REJECTED }
            });
        });

        return res.json({ 
            message: `Member removed from board` 
        });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Member not found in this board" });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to remove member" });
    }
}