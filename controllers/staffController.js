const Staff = require("../models/staffmodel");
const Complaints = require("../models/complaintmodel");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");

const staffController = {

    home: (req, res) => {
        res.redirect("/");
    },

    getdata: async (req, res) => {
        try {
            await connectDB();
            const { specialty, availability, search } = req.query;
            let filter = {};

            if (specialty && specialty !== "All") {
                filter.specialty = specialty;
            }
            if (availability && availability !== "All") {
                filter.availability = availability;
            }
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { staffId: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ];
            }

            const staff = await Staff.find(filter).sort({ specialty: 1, name: 1 }).lean().catch(() => []);
            res.render("staff.ejs", {
                staff,
                filter: { specialty: specialty || "All", availability: availability || "All", search: search || "" }
            });
        } catch (err) {
            console.error("Error fetching staff:", err);
            res.render("staff.ejs", {
                staff: [],
                filter: { specialty: "All", availability: "All", search: "" }
            });
        }
    },

    addpage: (req, res) => {
        res.render("staffform.ejs");
    },

    adddata: async (req, res) => {
        try {
            await connectDB();
            if (!req.body.staffId || req.body.staffId.trim() === "") {
                const count = await Staff.countDocuments().catch(() => 0);
                req.body.staffId = "STF-" + String(101 + count);
            }
            if (req.body.email) {
                req.body.email = req.body.email.trim().toLowerCase();
            }
            
            const rawPassword = req.body.password && req.body.password.trim() !== "" ? req.body.password.trim() : "Staff@123";
            req.body.password = await bcrypt.hash(rawPassword, 10);

            await Staff.create(req.body);
            res.redirect("/staff/view?msg=" + encodeURIComponent(`Staff member ${req.body.name} added successfully with login access.`));
        } catch (err) {
            console.error("Error adding staff:", err);
            res.redirect("/staff/view?msg=" + encodeURIComponent("Error adding staff: " + err.message));
        }
    },

    editpage: async (req, res) => {
        try {
            await connectDB();
            const staff = await Staff.findById(req.params.id).lean();
            if (!staff) {
                return res.status(404).send("Staff member not found. <a href='/staff/view'>Back to list</a>");
            }
            res.render("staffedit.ejs", { staff });
        } catch (err) {
            console.error("Error finding staff:", err);
            res.status(500).send("Staff member not found or invalid ID. <a href='/staff/view'>Back to list</a>");
        }
    },

    updatedata: async (req, res) => {
        try {
            await connectDB();
            if (req.body.email) {
                req.body.email = req.body.email.trim().toLowerCase();
            }
            if (req.body.password && req.body.password.trim() !== "") {
                const trimmedPass = req.body.password.trim();
                if (!trimmedPass.startsWith("$2a$") && !trimmedPass.startsWith("$2b$")) {
                    req.body.password = await bcrypt.hash(trimmedPass, 10);
                }
            } else {
                delete req.body.password;
            }
            await Staff.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
            res.redirect("/staff/view?msg=" + encodeURIComponent("Staff member updated successfully."));
        } catch (err) {
            console.error("Error updating staff:", err);
            res.redirect("/staff/view?msg=" + encodeURIComponent("Error updating staff: " + err.message));
        }
    },

    deletedata: async (req, res) => {
        try {
            await connectDB();
            await Staff.findByIdAndDelete(req.params.id);
            res.redirect("/staff/view?msg=" + encodeURIComponent("Staff member removed."));
        } catch (err) {
            console.error("Error deleting staff:", err);
            res.redirect("/staff/view?msg=" + encodeURIComponent("Error deleting staff"));
        }
    },

    portal: async (req, res) => {
        try {
            await connectDB();
            const staffSession = req.session.staffUser || req.session.user;
            if (!staffSession) {
                return res.redirect("/login");
            }

            const staffIdToFind = staffSession._id || staffSession.id;
            const currentStaff = await Staff.findById(staffIdToFind).lean();
            if (!currentStaff) {
                return res.redirect("/login");
            }
            const staffNamePattern = currentStaff.name;

            const assignedComplaints = await Complaints.find({
                assignedStaff: { $regex: staffNamePattern, $options: "i" }
            }).sort({ createdAt: -1 }).lean().catch(() => []);

            const pendingTasks = assignedComplaints.filter(c => c.status !== "Resolved" && c.status !== "Rejected");
            const resolvedTasks = assignedComplaints.filter(c => c.status === "Resolved");

            const msg = req.query.msg || null;
            const error = req.query.error || null;

            res.render("staffportal.ejs", {
                currentStaff,
                assignedComplaints,
                pendingTasks,
                resolvedTasks,
                msg,
                error
            });
        } catch (err) {
            console.error("Error loading staff portal:", err);
            res.redirect("/?msg=" + encodeURIComponent("Error accessing staff portal."));
        }
    },

    updateAvailability: async (req, res) => {
        try {
            await connectDB();
            const staffSession = req.session.staffUser || req.session.user;
            const staffIdToFind = staffSession._id || staffSession.id;
            const { availability } = req.body;
            await Staff.findByIdAndUpdate(staffIdToFind, { availability });
            
            if (req.session.staffUser) {
                req.session.staffUser.availability = availability;
            }
            res.redirect("/staff/portal?msg=" + encodeURIComponent(`Availability status updated to ${availability}`));
        } catch (err) {
            console.error("Error updating availability:", err);
            res.redirect("/staff/portal");
        }
    },

    changePassword: async (req, res) => {
        try {
            await connectDB();
            const staffSession = req.session.staffUser || req.session.user;
            if (!staffSession) {
                return res.redirect("/login?msg=" + encodeURIComponent("Please log in to change your password."));
            }

            const staffIdToFind = staffSession._id || staffSession.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            const trimmedCurrent = (currentPassword || "").trim();
            const trimmedNew = (newPassword || "").trim();
            const trimmedConfirm = (confirmPassword || "").trim();

            if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
                return res.redirect("/staff/portal?error=" + encodeURIComponent("All password fields are required."));
            }

            if (trimmedNew.length < 6) {
                return res.redirect("/staff/portal?error=" + encodeURIComponent("New password must be at least 6 characters long."));
            }

            if (trimmedNew !== trimmedConfirm) {
                return res.redirect("/staff/portal?error=" + encodeURIComponent("New passwords do not match. Please re-enter both."));
            }

            const staffMember = await Staff.findById(staffIdToFind);
            if (!staffMember) {
                return res.redirect("/login?msg=" + encodeURIComponent("Staff account not found. Please log in again."));
            }

            let isCurrentMatch = false;
            if (staffMember.password.startsWith("$2a$") || staffMember.password.startsWith("$2b$")) {
                isCurrentMatch = await bcrypt.compare(trimmedCurrent, staffMember.password);
            } else {
                isCurrentMatch = (staffMember.password === trimmedCurrent);
            }

            if (!isCurrentMatch) {
                return res.redirect("/staff/portal?error=" + encodeURIComponent("Current password is incorrect. Please try again."));
            }

            const hashedNewPassword = await bcrypt.hash(trimmedNew, 10);
            staffMember.password = hashedNewPassword;
            await staffMember.save();

            if (req.session.staffUser) {
                req.session.staffUser.password = hashedNewPassword;
            }

            return res.redirect("/staff/portal?msg=" + encodeURIComponent("Your password has been changed successfully!"));
        } catch (err) {
            console.error("Staff change password error:", err);
            return res.redirect("/staff/portal?error=" + encodeURIComponent("Failed to change password: " + (err.message || "Server error")));
        }
    }
};

module.exports = staffController;

