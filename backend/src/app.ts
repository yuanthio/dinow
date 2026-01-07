import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./router";
import { createServer } from "http";
import socketManager from "./lib/socket";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:4000",
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from uploads folder
const uploadsPath = path.join(process.cwd(), 'src', 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

app.use("/api/v1", router);

app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

// Create HTTP server untuk Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO
socketManager.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;