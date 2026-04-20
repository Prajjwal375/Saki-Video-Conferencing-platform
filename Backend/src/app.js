import 'dotenv/config';
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRouter from "./routes/users.route.js";

const app = express();
const server = createServer(app);

// Initialize Socket.IO on the HTTP server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    }
});

// Pass io to socket manager
connectToSocket(io);

const ALLOWED_ORIGINS = [
    "http://host:5173",
    "http://localhost:3000",
    process.env.CORS_ORIGIN,          // set this to https://yourdomain.com on deploy
].filter(Boolean);

app.set("port", process.env.PORT || 8000);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, same-origin)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));


app.use("/api/v1/users", userRouter);

const start = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error("MONGO_URI is not set in .env");

        const connectionDb = await mongoose.connect(mongoUri);
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server listening on port ${process.env.PORT || 8000}`);
        });
    } catch (error) {
        console.log("Error starting server:", error);
        process.exit(1);
    }
};

start();