//routes/board.access.ts

import { Router } from "express";
import { auth } from "../middleware/auth";
import { checkBoardAccess } from "../middleware/rbac";
import * as boardAccessController from "../controllers/boardaccess.controller";
import { AccessRole } from "@prisma/client";

const router = Router();

router.post(
    "/:boardId/access/member",
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    boardAccessController.addMember
);

router.patch(
    "/:boardId/access/member/:targetUserId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    boardAccessController.updateMemberRole
);

router.delete(
    "/:boardId/access/member/:targetUserId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    boardAccessController.removeMember
);

export default router;