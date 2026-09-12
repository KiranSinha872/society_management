require("dotenv").config();

const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!mongoUrl) {
        console.error("CRITICAL: MONGO_URL environment variable is not defined.");
        return;
    }
    try {
        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
};

// Initial connection
connectDB();

const db = mongoose.connection;

db.on("connected", () => {
    console.log("MongoDB Connection state: Connected");
});

db.on("disconnected", () => {
    console.log("MongoDB Connection state: Disconnected");
});

db.on("error", (err) => {
    console.error("MongoDB Runtime Error:", err.message);
});

module.exports = { db, connectDB };
