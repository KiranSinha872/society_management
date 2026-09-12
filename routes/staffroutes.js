const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");
const { isAdmin, isStaff } = require("../middlewares/auth");

// Home (Public/General)
router.get("/", staffController.home);

// Dedicated Staff Workspace Portal (Staff only)
router.get("/portal", isStaff, staffController.portal);
router.post("/availability", isStaff, staffController.updateAvailability);

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
