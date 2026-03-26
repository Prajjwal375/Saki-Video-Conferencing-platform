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

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

app.use("/api/v1/users", userRouter);

const start = async () => {
    try {
        const connectionDb = await mongoose.connect("mongodb+srv://prajjwalsaki375_db_user:4dfeLeWXxxcy9WAn@cluster0.9gcravm.mongodb.net/");
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
        
        server.listen(8000, () => {
            console.log("LISTEN ON PORT 8000");
        });
    } catch (error) {
        console.log("Error starting server:", error);
    }
};

start();