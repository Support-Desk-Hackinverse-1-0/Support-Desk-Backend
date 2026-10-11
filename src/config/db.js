import mongoose from "mongoose";
import dns from "node:dns";
import { config } from "./config.js";

// Fix for Windows querySrv ETIMEOUT with MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}