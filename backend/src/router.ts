//src/router.ts

import { Router } from "express";

import authRouter from "./routes/auth.route";
import boardRouter from "./routes/board.route";
import columnRouter from "./routes/column.route";
import cardRouter from "./routes/card.route";
import boardAccessRouter from "./routes/boardaccess.route";
import searchRouter from "./routes/search.route";
import checklistRouter from "./routes/checklist.route";

const apiRouter = Router();

apiRouter.use("/auth", authRouter); 
apiRouter.use("/boards", boardRouter);
apiRouter.use("/boards", columnRouter);
apiRouter.use("/boards", cardRouter);
apiRouter.use("/boards", boardAccessRouter);
apiRouter.use("/boards", checklistRouter);
apiRouter.use("/", boardAccessRouter); 
apiRouter.use("/search", searchRouter);

export default apiRouter;