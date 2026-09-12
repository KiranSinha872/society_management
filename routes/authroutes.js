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

// Protected User Profile
router.get("/profile", isAuthenticated, authController.profilePage);

module.exports = router;

