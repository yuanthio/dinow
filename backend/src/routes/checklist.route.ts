import { Router } from "express";
import { auth } from "../middleware/auth";
import { checkBoardAccess } from "../middleware/rbac";
import { resolveBoardIdFromCardId } from "../middleware/idResolvers";
import * as checklistController from "../controllers/checklist.controller";
import { AccessRole } from "@prisma/client";

const router = Router();

// Endpoint ini akan di-mount di /boards/cards/:cardId

// GET Checklist Items
router.get(
  "/:cardId/items",
  auth,
  resolveBoardIdFromCardId,
  checkBoardAccess(AccessRole.VIEWER),
  checklistController.getChecklistItems
);

// CREATE Checklist Item: OWNER/EDITOR
router.post(
  "/:cardId/items",
  auth,
  resolveBoardIdFromCardId,
  checkBoardAccess(AccessRole.EDITOR),
  checklistController.createChecklistItem
);

// UPDATE Checklist Item (Metadata/Completed): OWNER/EDITOR
router.patch(
  "/:cardId/items/:itemId",
  auth,
  resolveBoardIdFromCardId,
  checkBoardAccess(AccessRole.EDITOR),
  checklistController.updateChecklistItem
);

// BULK UPDATE Checklist Items Order: OWNER/EDITOR
router.put(
  "/:cardId/items/reorder",
  auth,
  resolveBoardIdFromCardId,
  checkBoardAccess(AccessRole.EDITOR),
  checklistController.reorderChecklistItems
);

// DELETE Checklist Item: OWNER/EDITOR
router.delete(
  "/:cardId/items/:itemId",
  auth,
  resolveBoardIdFromCardId,
  checkBoardAccess(AccessRole.EDITOR),
  checklistController.deleteChecklistItem
);

export default router;