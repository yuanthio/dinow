import { Router } from "express";
import { auth } from "../middleware/auth";
import { checkBoardAccess } from "../middleware/rbac";
import * as cardController from "../controllers/card.controller";
import { AccessRole } from "@prisma/client";
import { upload } from "../utils/upload";

const router = Router();

router.post(
    "/:boardId/cards", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    cardController.createCard
);
router.get(
    "/:boardId/cards", 
    auth, 
    checkBoardAccess(AccessRole.VIEWER), 
    cardController.getCardsByBoardId
);
router.patch(
    "/:boardId/cards/:cardId", 
    auth, 
    checkBoardAccess(AccessRole.EDITOR), 
    cardController.updateCard
);
router.put(  
    "/:boardId/cards/:cardId/move",
    auth, 
    checkBoardAccess(AccessRole.EDITOR), 
    cardController.moveCard
);
router.delete(
    "/:boardId/cards/:cardId", 
    auth, 
    checkBoardAccess(AccessRole.OWNER), 
    cardController.deleteCard
);

// Upload gambar card
router.post(
    "/:boardId/cards/:cardId/image",
    auth,
    checkBoardAccess(AccessRole.EDITOR),
    upload.single('image'),
    cardController.uploadCardImage
);

// Delete gambar card
router.delete(
    "/:boardId/cards/:cardId/image",
    auth,
    checkBoardAccess(AccessRole.EDITOR),
    cardController.deleteCardImage
);

export default router;