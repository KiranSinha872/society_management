const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");
const { isAdmin, isStaff } = require("../middlewares/auth");

// Dedicated Staff Workspace Portal / Homepage (Staff only)
router.get("/", isStaff, staffController.portal);
router.get("/portal", isStaff, staffController.portal);
router.post("/availability", isStaff, staffController.updateAvailability);
router.post("/change-password", isStaff, staffController.changePassword);

// View Staff Directory
router.get("/view", staffController.getdata);

// Add Staff (Admin only)
router.get("/add", isAdmin, staffController.addpage);
router.post("/add", isAdmin, staffController.adddata);

// Edit Staff (Admin only)
router.get("/edit/:id", isAdmin, staffController.editpage);
router.post("/edit/:id", isAdmin, staffController.updatedata);

// Delete Staff (Admin only)
router.get("/delete/:id", isAdmin, staffController.deletedata);

module.exports = router;
