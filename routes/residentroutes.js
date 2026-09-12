const express = require("express");
const router = express.Router();

const residentController = require("../controllers/residentController");
const { isAdmin } = require("../middlewares/auth");

// Home
router.get("/", residentController.home);

// View All Residents (Public directory / Admin)
router.get("/view", residentController.getdata);

// Add Resident (Admin only)
router.get("/add", isAdmin, residentController.addpage);
router.post("/add", isAdmin, residentController.adddata);

// Edit Resident (Admin only)
router.get("/edit/:id", isAdmin, residentController.editpage);
router.post("/edit/:id", isAdmin, residentController.updatedata);

// Delete Resident (Admin only)
router.get("/delete/:id", isAdmin, residentController.deletedata);

module.exports = router;
