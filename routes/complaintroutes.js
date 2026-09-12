const express = require("express");
const router = express.Router();

const complaintController = require("../controllers/complaintController");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");

// Home Dashboard (Public)
router.get("/", complaintController.home);

// View Complaints (Public & Filterable)
router.get("/view", complaintController.getdata);

// Add Complaint (Protected: Logged-in Residents/Users only)
router.get("/add", isAuthenticated, complaintController.addpage);
router.post("/add", isAuthenticated, complaintController.adddata);


// Edit Complaint (Admin & Staff)
router.get("/edit/:id", complaintController.editpage);
router.post("/edit/:id", complaintController.updatedata);

// Delete Complaint (Admin only)
router.get("/delete/:id", isAdmin, complaintController.deletedata);

// Quick Status Update
router.post("/status/:id", complaintController.quickStatus);

module.exports = router;
