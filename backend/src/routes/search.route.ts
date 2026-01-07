//src/routes/search.route.ts

import { Router } from "express";
import { auth } from "../middleware/auth";
import * as searchController from "../controllers/search.controller";

const router = Router();

router.get("/", auth, searchController.globalSearch);

export default router;