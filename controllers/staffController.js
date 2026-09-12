const Staff = require("../models/staffmodel");
const Complaints = require("../models/complaintmodel");

const staffController = {

    home: (req, res) => {
        res.redirect("/");
    },

    getdata: async (req, res) => {
        try {
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

            const staff = await Staff.find(filter).sort({ specialty: 1, name: 1 });
            res.render("staff.ejs", {
                staff,
                filter: { specialty: specialty || "All", availability: availability || "All", search: search || "" }
            });
        } catch (err) {
            console.log("Error fetching staff:", err);
            res.send("Error fetching staff");
        }
    },

    addpage: (req, res) => {
        res.render("staffform.ejs");
    },

    adddata: async (req, res) => {
        try {
            if (!req.body.staffId || req.body.staffId.trim() === "") {
                const count = await Staff.countDocuments();
                req.body.staffId = "STF-" + String(101 + count);
            }
            if (req.body.email) {
                req.body.email = req.body.email.trim().toLowerCase();
            }
            if (!req.body.password || req.body.password.trim() === "") {
                req.body.password = "Staff@123";
            }
            await Staff.create(req.body);
            res.redirect("/staff/view?msg=" + encodeURIComponent(`Staff member ${req.body.name} added successfully with login access.`));
        } catch (err) {
            console.log("Error adding staff:", err);
            res.send("Error adding staff: " + err.message);
        }
    },

    editpage: async (req, res) => {
        try {
            const staff = await Staff.findById(req.params.id);
            if (!staff) {
                return res.status(404).send("Staff member not found");
            }
            res.render("staffedit.ejs", { staff });
        } catch (err) {
            console.error("Error finding staff:", err);
            res.status(500).send("Staff member not found or invalid ID");
        }
    },

    updatedata: async (req, res) => {
        try {
            if (req.body.email) {
                req.body.email = req.body.email.trim().toLowerCase();
            }
            await Staff.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
            res.redirect("/staff/view?msg=" + encodeURIComponent("Staff member updated successfully."));
        } catch (err) {
            console.error("Error updating staff:", err);
            res.status(500).send("Error updating staff: " + err.message);
        }
    },

    deletedata: async (req, res) => {
        try {
            await Staff.findByIdAndDelete(req.params.id);
            res.redirect("/staff/view?msg=" + encodeURIComponent("Staff member removed."));
        } catch (err) {
            console.error("Error deleting staff:", err);
            res.status(500).send("Error deleting staff");
        }
    },

    // Dedicated Maintenance Staff Portal (for logged in staff)
    portal: async (req, res) => {
        try {
            const staffUser = req.session.staffUser;
            if (!staffUser) {
                return res.redirect("/login");
            }

            // Fresh staff profile
            const currentStaff = await Staff.findById(staffUser._id);
            const staffNamePattern = currentStaff.name;

            // Find all complaints assigned to this staff member
            const assignedComplaints = await Complaints.find({
                assignedStaff: { $regex: staffNamePattern, $options: "i" }
            }).sort({ createdAt: -1 });

            const pendingTasks = assignedComplaints.filter(c => c.status !== "Resolved" && c.status !== "Rejected");
            const resolvedTasks = assignedComplaints.filter(c => c.status === "Resolved");

            const msg = req.query.msg || null;

            res.render("staffportal.ejs", {
                currentStaff,
                assignedComplaints,
                pendingTasks,
                resolvedTasks,
                msg
            });
        } catch (err) {
            console.error("Error loading staff portal:", err);
            res.redirect("/");
        }
    },

    // Staff member updates their own availability
    updateAvailability: async (req, res) => {
        try {
            const staffUser = req.session.staffUser;
            const { availability } = req.body;
            await Staff.findByIdAndUpdate(staffUser._id, { availability });
            
            // update in session
            req.session.staffUser.availability = availability;
            res.redirect("/staff/portal?msg=" + encodeURIComponent(`Availability updated to ${availability}`));
        } catch (err) {
            console.error("Error updating availability:", err);
            res.redirect("/staff/portal");
        }
    }
};

module.exports = staffController;
