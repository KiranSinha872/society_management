require("dotenv").config();

const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;

// Global cached connection for Serverless (Vercel) & Local
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // 1. If already connected, return connection immediately
    if (mongoose.connection.readyState === 1) {
        cached.conn = mongoose;
        return cached.conn;
    }

    if (!mongoUrl) {
        console.warn("⚠️ MONGO_URL not defined in environment variables.");
        return null;
    }

    // 2. If a connection is in progress, await the existing promise
    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 10000
        };

        cached.promise = mongoose.connect(mongoUrl, opts).then((mongooseInstance) => {
            console.log("✅ MongoDB Connected Successfully");
            return mongooseInstance;
        }).catch((err) => {
            cached.promise = null;
            cached.conn = null;
            console.error("❌ MongoDB Connection Error:", err.message);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        cached.conn = null;
        console.error("Database connection failed:", e.message);
    }

    return cached.conn;
}

// Connection event listeners for state management
mongoose.connection.on("disconnected", () => {
    cached.conn = null;
    cached.promise = null;
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
    cached.conn = null;
    cached.promise = null;
});

const db = mongoose.connection;

module.exports = { db, connectDB };


