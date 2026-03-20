import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./config/socket.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/test", testRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    httpServer.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
      console.log(`Socket.IO server initialized`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
