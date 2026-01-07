// dinow/beckend/src/routes/column.route.ts
import { Router } from "express";
import { auth } from "../middleware/auth";
import { checkBoardAccess } from "../middleware/rbac";
import * as columnController from "../controllers/column.controller";
import { AccessRole } from "@prisma/client";

const router = Router();

router.post(
    "/:boardId/columns", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    columnController.createColumn
);

router.get(
    "/:boardId/columns", 
    auth, 
    checkBoardAccess(AccessRole.VIEWER), 
    columnController.getColumnsByBoardId
);

router.patch(
    "/:boardId/columns/:columnId", 
    auth, 
    checkBoardAccess(AccessRole.EDITOR), 
    columnController.updateColumn
);

// NEW: Endpoint untuk drag & drop column
router.put(
    "/:boardId/columns/:columnId/move",
    auth, 
    checkBoardAccess(AccessRole.EDITOR), 
    columnController.moveColumn
);

router.delete(
    "/:boardId/columns/:columnId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    columnController.deleteColumn
);

export default router;