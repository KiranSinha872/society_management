const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { isAuthenticated, isUser } = require("../middlewares/auth");

// User Registration
router.get("/register", authController.registerPage);
router.post("/register", authController.register);

// Authentication (Login / Logout)
router.get("/login", authController.loginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

// Protected User Homepage & Profile
router.get("/user", isUser, authController.profilePage);
router.get("/profile", isUser, authController.profilePage);
router.get("/my-complaints", isUser, (req, res) => res.redirect("/user"));
router.post("/change-password", isAuthenticated, authController.changePassword);

module.exports = router;

