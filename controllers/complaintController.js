const Complaints = require("../models/complaintmodel");
const Residents = require("../models/residentmodel");
const Staff = require("../models/staffmodel");

const complaintController = {

    home: async (req, res) => {
        try {
            const totalComplaints = await Complaints.countDocuments();
            const pendingComplaints = await Complaints.countDocuments({ status: "Pending" });
            const assignedComplaints = await Complaints.countDocuments({ status: "Assigned" });
            const inProgressComplaints = await Complaints.countDocuments({ status: "In Progress" });
            const resolvedComplaints = await Complaints.countDocuments({ status: "Resolved" });
            const rejectedComplaints = await Complaints.countDocuments({ status: "Rejected" });
            
            const totalResidents = await Residents.countDocuments();
            const totalStaff = await Staff.countDocuments();

            // Category-wise Breakdown
            const categories = [
                "Water Supply & Plumbing",
                "Electricity & Power",
                "Elevator & Lift",
                "Security & Access",
                "Carpentry & Civil",
                "Cleanliness & Sanitation",
                "Parking & Traffic",
                "Noise Disturbance",
                "Common Amenities & Garden",
                "Other"
            ];

            const categoryBreakdown = await Promise.all(
                categories.map(async (cat) => {
                    const count = await Complaints.countDocuments({ category: cat });
                    const resolved = await Complaints.countDocuments({ category: cat, status: "Resolved" });
                    return {
                        category: cat,
                        count,
                        resolved,
                        pending: count - resolved
                    };
                })
            );

            // Block-wise Breakdown (Wings A to E)
            const blocks = ["A", "B", "C", "D", "E"];
            const blockBreakdown = await Promise.all(
                blocks.map(async (block) => {
                    const count = await Complaints.countDocuments({ wing: block });
                    const pending = await Complaints.countDocuments({ wing: block, status: { $ne: "Resolved" } });
                    const resolved = await Complaints.countDocuments({ wing: block, status: "Resolved" });
                    return {
                        block: "Block " + block,
                        wing: block,
                        count,
                        pending,
                        resolved
                    };
                })
            );

            // Recent status updates / notifications
            const recentActivity = await Complaints.find()
                .sort({ updatedAt: -1 })
                .limit(5)
                .select("complaintId title residentName wing flatNo status updatedAt assignedStaff");

            res.render("home.ejs", {
                stats: {
                    totalComplaints,
                    pendingComplaints,
                    assignedComplaints,
                    inProgressComplaints,
                    resolvedComplaints,
                    rejectedComplaints,
                    totalResidents,
                    totalStaff
                },
                categoryBreakdown,
                blockBreakdown,
                recentActivity
            });
        } catch (err) {
            console.error("Error loading dashboard analytics:", err);
            res.render("home.ejs", {
                stats: {
                    totalComplaints: 0,
                    pendingComplaints: 0,
                    assignedComplaints: 0,
                    inProgressComplaints: 0,
                    resolvedComplaints: 0,
                    rejectedComplaints: 0,
                    totalResidents: 0,
                    totalStaff: 0
                },
                categoryBreakdown: [],
                blockBreakdown: [],
                recentActivity: []
            });
        }
    },

    getdata: async (req, res) => {
        try {
            const { status, priority, category, wing, search, msg } = req.query;
            let filter = {};

            if (status && status !== "All") {
                filter.status = status;
            }
            if (priority && priority !== "All") {
                filter.priority = priority;
            }
            if (category && category !== "All") {
                filter.category = category;
            }
            if (wing && wing !== "All") {
                filter.wing = wing;
            }
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { residentName: { $regex: search, $options: "i" } },
                    { flatNo: { $regex: search, $options: "i" } },
                    { complaintId: { $regex: search, $options: "i" } },
                    { assignedStaff: { $regex: search, $options: "i" } }
                ];
            }

            const complaint = await Complaints.find(filter).sort({ createdAt: -1 });
            const staffList = await Staff.find().select("name specialty staffId availability");

            res.render("complaints.ejs", { 
                complaint,
                staffList,
                notification: msg || null,
                filter: { 
                    status: status || "All", 
                    priority: priority || "All", 
                    category: category || "All", 
                    wing: wing || "All",
                    search: search || "" 
                } 
            });
        } catch (err) {
            console.log("Error fetching complaints:", err);
            res.send("Error fetching complaints");
        }
    },

    addpage: async (req, res) => {
        try {
            const staffList = await Staff.find().select("name specialty staffId availability");
            res.render("complaintform.ejs", { staffList });
        } catch (err) {
            res.render("complaintform.ejs", { staffList: [] });
        }
    },

    adddata: async (req, res) => {
        try {
            if (!req.body.complaintId || req.body.complaintId.trim() === "") {
                const count = await Complaints.countDocuments();
                req.body.complaintId = "CMP-" + String(1001 + count);
            }

            // Initial timeline event
            req.body.timeline = [
                {
                    status: req.body.status || "Pending",
                    note: "Complaint submitted by resident.",
                    updatedAt: new Date()
                }
            ];

            // If staff is assigned upon creation, transition status to Assigned
            if (req.body.assignedStaff && req.body.assignedStaff !== "Unassigned" && req.body.status === "Pending") {
                req.body.status = "Assigned";
                req.body.timeline.push({
                    status: "Assigned",
                    note: `Assigned to ${req.body.assignedStaff}`,
                    updatedAt: new Date()
                });
            }

            await Complaints.create(req.body);
            res.redirect("/view?msg=" + encodeURIComponent(`Complaint #${req.body.complaintId} submitted successfully!`));
        } catch (err) {
            console.log("Error adding complaint:", err);
            res.send("Error adding complaint: " + err.message);
        }
    },

    editpage: async (req, res) => {
        try {
            const complaint = await Complaints.findById(req.params.id);
            if (!complaint) {
                return res.status(404).send("Complaint not found");
            }
            const staffList = await Staff.find().select("name specialty staffId availability");
            res.render("complaintedit.ejs", { complaint, staffList });
        } catch (err) {
            console.error("Error finding complaint:", err);
            res.status(500).send("Complaint not found or invalid ID");
        }
    },

    updatedata: async (req, res) => {
        try {
            const existing = await Complaints.findById(req.params.id);
            if (!existing) {
                return res.status(404).send("Complaint not found");
            }

            // If status changed or notes added, append to timeline
            let timeline = existing.timeline || [];
            if (req.body.status && req.body.status !== existing.status) {
                timeline.push({
                    status: req.body.status,
                    note: req.body.resolutionNotes || `Status updated from ${existing.status} to ${req.body.status}`,
                    updatedAt: new Date()
                });
            }

            req.body.timeline = timeline;

            await Complaints.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
            res.redirect("/view?msg=" + encodeURIComponent(`Complaint #${existing.complaintId} updated to '${req.body.status}'`));
        } catch (err) {
            console.error("Error updating complaint:", err);
            res.status(500).send("Error updating complaint: " + err.message);
        }
    },

    deletedata: async (req, res) => {
        try {
            const complaint = await Complaints.findByIdAndDelete(req.params.id);
            const ref = complaint ? complaint.complaintId : "Record";
            res.redirect("/view?msg=" + encodeURIComponent(`${ref} deleted successfully.`));
        } catch (err) {
            console.error("Error deleting complaint:", err);
            res.status(500).send("Error deleting complaint");
        }
    },

    quickStatus: async (req, res) => {
        try {
            const { status, assignedStaff } = req.body;
            const existing = await Complaints.findById(req.params.id);
            if (!existing) {
                return res.status(404).send("Complaint not found");
            }

            let updatePayload = {};
            let timeline = existing.timeline || [];

            if (status) {
                updatePayload.status = status;
                timeline.push({
                    status,
                    note: `Status changed to ${status}`,
                    updatedAt: new Date()
                });
            }

            if (assignedStaff) {
                updatePayload.assignedStaff = assignedStaff;
                if (existing.status === "Pending" && status === undefined) {
                    updatePayload.status = "Assigned";
                }
                timeline.push({
                    status: updatePayload.status || existing.status,
                    note: `Assigned staff: ${assignedStaff}`,
                    updatedAt: new Date()
                });
            }

            updatePayload.timeline = timeline;

            await Complaints.findByIdAndUpdate(req.params.id, updatePayload);
            res.redirect("/view?msg=" + encodeURIComponent(`Status for #${existing.complaintId} updated to '${updatePayload.status || existing.status}'`));
        } catch (err) {
            console.error("Error updating status:", err);
            res.status(500).send("Error updating status");
        }
    }
};

module.exports = complaintController;
