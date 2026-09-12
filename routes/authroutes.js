const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middlewares/auth");

// User Registration
router.get("/register", authController.registerPage);
router.post("/register", authController.register);

// Authentication (Login / Logout)
router.get("/login", authController.loginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

// Protected User Profile & My Complaints
router.get("/profile", isAuthenticated, authController.profilePage);
router.get("/my-complaints", isAuthenticated, (req, res) => res.redirect("/profile"));
router.post("/change-password", isAuthenticated, authController.changePassword);

module.exports = router;

