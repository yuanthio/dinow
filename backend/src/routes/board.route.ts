import { Router } from "express";
import { auth } from "../middleware/auth";
import { checkBoardAccess } from "../middleware/rbac";
import * as boardController from "../controllers/board.controller";
import { AccessRole } from "@prisma/client";

const router = Router();

router.post("/", auth, boardController.createBoard);
router.get("/my-boards", auth, boardController.getMyBoards);
router.get(
    "/:boardId", 
    auth, 
    checkBoardAccess(AccessRole.VIEWER),
    boardController.getBoardById
);
router.patch(
    "/:boardId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    boardController.updateBoard
);
router.delete(
    "/:boardId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    boardController.deleteBoard
);
export default router;