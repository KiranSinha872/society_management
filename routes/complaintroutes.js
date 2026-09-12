const express = require("express");
const router = express.Router();

const complaintController = require("../controllers/complaintController");
const { isAdmin } = require("../middlewares/auth");

// Home Dashboard (Public)
router.get("/", complaintController.home);

// View Complaints (Public & Filterable)
router.get("/view", complaintController.getdata);

// Add Complaint (Public for Residents)
router.get("/add", complaintController.addpage);
router.post("/add", complaintController.adddata);

// Edit Complaint (Admin & Staff)
router.get("/edit/:id", complaintController.editpage);
router.post("/edit/:id", complaintController.updatedata);

// Delete Complaint (Admin only)
router.get("/delete/:id", isAdmin, complaintController.deletedata);

// Quick Status Update
router.post("/status/:id", complaintController.quickStatus);

module.exports = router;
