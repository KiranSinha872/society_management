require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const { connectDB } = require("./config/db");
const app = express();

// Serverless MongoDB Connection Middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (e) {
        console.error("DB connection error in middleware:", e);
    }
    next();
});

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "society_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Body parser Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Pass session/role state to all EJS templates
app.use((req, res, next) => {
    res.locals.isAdmin = (req.session && req.session.role === "admin") ? true : false;
    res.locals.isStaff = (req.session && req.session.role === "staff") ? true : false;
    res.locals.userRole = (req.session && req.session.role) ? req.session.role : "resident";
    res.locals.adminEmail = (req.session && req.session.adminEmail) ? req.session.adminEmail : null;
    res.locals.staffUser = (req.session && req.session.staffUser) ? req.session.staffUser : null;
    next();
});

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const authRoutes = require("./routes/authroutes");
const complaintRoutes = require("./routes/complaintroutes");
const residentRoutes = require("./routes/residentroutes");
const staffRoutes = require("./routes/staffroutes");

// Auth Routes (Login / Logout)
app.use("/", authRoutes);

// Complaint & Dashboard Routes
app.use("/", complaintRoutes);

// Resident Directory Routes
app.use("/residents", residentRoutes);

// Maintenance Staff Routes
app.use("/staff", staffRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found. <a href='/'>Go to Home</a>");
});

// Server (Local development)
if (require.main === module || process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3007;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
