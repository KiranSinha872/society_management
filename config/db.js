require("dotenv").config();

const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/society_complaint_db";

console.log("Connecting to MongoDB Database...");

// Disable buffering so pages never hang for 10s if offline/connecting
mongoose.set("bufferCommands", false);

mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
    family: 4 // Force IPv4 to prevent macOS IPv6 lookup delay
}).then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully!");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("👉 Please ensure IP Access (0.0.0.0/0) is Active in MongoDB Atlas Network Access tab.");
});

const db = mongoose.connection;

db.on("connected", () => {
    console.log("MongoDB state: Connected");
});

db.on("disconnected", () => {
    console.log("MongoDB state: Disconnected");
});

db.on("error", (err) => {
    console.error("MongoDB Runtime Error:", err.message);
});

module.exports = db;
