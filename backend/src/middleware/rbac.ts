import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "./auth";
import { AccessRole } from "@prisma/client";
import { RoleHierarchy } from "../lib/constan";

// Indonesian comments: Middleware untuk otorisasi akses board
export const checkBoardAccess = (minRole: AccessRole) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const boardId = parseInt(req.params.boardId);
        const userId = req.userId;

        // Indonesian comments: Cek validitas input
        if (isNaN(boardId) || !userId) {
            return res.status(400).json({ error: "Invalid Board ID or User ID is missing" });
        }

        try {
            // Indonesian comments: Cari akses user di board ini
            const userAccess = await prisma.boardAccess.findUnique({
                where: {
                    userId_boardId: {
                        userId: userId,
                        boardId: boardId,
                    },
                },
            });

            // Indonesian comments: Kalau user belum jadi member
            if (!userAccess) {
                return res.status(403).json({ error: "Access Denied: Not a member of this board" });
            }

            // Indonesian comments: Bandingkan role user dengan minimum role yang dibutuhkan
            const userRoleRank = RoleHierarchy[userAccess.role];
            const requiredRoleRank = RoleHierarchy[minRole];

            // Indonesian comments: Cek apakah role user cukup (rank kecil = role tinggi)
            if (userRoleRank <= requiredRoleRank) {
                // Indonesian comments: Attach role user ke request untuk dipakai di controller
                (req as any).userRole = userAccess.role;
                next(); // Lanjut ke controller
            } else {
                return res.status(403).json({ error: "Access Denied: Insufficient role" });
            }
        } catch (err: any) {
            console.error(err);
            return res.status(500).json({ error: "Failed to verify board access" });
        }
    };
};