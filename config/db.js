require("dotenv").config();

const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;

// Global cached connection for Serverless (Vercel) & Local
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!mongoUrl) {
        console.warn("⚠️ MONGO_URL not defined in environment variables.");
        return null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 4000,
            family: 4,
            maxPoolSize: 10
        };

        cached.promise = mongoose.connect(mongoUrl, opts).then((mongooseInstance) => {
            console.log("✅ MongoDB Connected Successfully");
            return mongooseInstance;
        }).catch((err) => {
            cached.promise = null;
            console.error("❌ MongoDB Connection Error:", err.message);
            return null;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Database connection failed:", e.message);
    }

    return cached.conn;
}

// Initial connection attempt
connectDB().catch(() => {});

const db = mongoose.connection;

module.exports = { db, connectDB };
