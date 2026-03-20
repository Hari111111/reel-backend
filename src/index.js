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
import postRoutes from "./routes/postRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

const configuredOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (
      configuredOrigins.includes(origin) ||
      /^https?:\/\/localhost(?::\d+)?$/i.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin) ||
      /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/i.test(origin) ||
      /^exp:\/\/.+/i.test(origin) ||
      /^expo:\/\/.+/i.test(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
app.use("/api/posts", postRoutes);
app.use("/api/statuses", statusRoutes);
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
