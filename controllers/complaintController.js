const Complaints = require("../models/complaintmodel");
const Residents = require("../models/residentmodel");
const Staff = require("../models/staffmodel");
const { connectDB } = require("../config/db");

const complaintController = {

    home: async (req, res) => {
        try {
            await connectDB();

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
            const blocks = ["A", "B", "C", "D", "E"];

            // High-performance single aggregation + concurrent counts
            const [aggResult, totalResidents, totalStaff] = await Promise.all([
                Complaints.aggregate([
                    {
                        $facet: {
                            statusCounts: [
                                { $group: { _id: "$status", count: { $sum: 1 } } }
                            ],
                            categoryStats: [
                                {
                                    $group: {
                                        _id: { category: "$category", status: "$status" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ],
                            blockStats: [
                                {
                                    $group: {
                                        _id: { wing: "$wing", status: "$status" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ],
                            recentActivity: [
                                { $sort: { updatedAt: -1 } },
                                { $limit: 5 },
                                {
                                    $project: {
                                        complaintId: 1,
                                        title: 1,
                                        residentName: 1,
                                        wing: 1,
                                        flatNo: 1,
                                        status: 1,
                                        updatedAt: 1,
                                        assignedStaff: 1
                                    }
                                }
                            ],
                            total: [
                                { $count: "count" }
                            ]
                        }
                    }
                ]),
                Residents.countDocuments().catch(() => 0),
                Staff.countDocuments().catch(() => 0)
            ]);

            const facet = (aggResult && aggResult[0]) ? aggResult[0] : {};

            // Parse status counts
            const statusMap = {};
            if (facet.statusCounts) {
                facet.statusCounts.forEach(s => {
                    if (s._id) statusMap[s._id] = s.count;
                });
            }

            const totalComplaints = (facet.total && facet.total[0]) ? facet.total[0].count : 0;
            const pendingComplaints = statusMap["Pending"] || 0;
            const assignedComplaints = statusMap["Assigned"] || 0;
            const inProgressComplaints = statusMap["In Progress"] || 0;
            const resolvedComplaints = statusMap["Resolved"] || 0;
            const rejectedComplaints = statusMap["Rejected"] || 0;

            // Parse Category breakdown
            const categoryStatsMap = {};
            if (facet.categoryStats) {
                facet.categoryStats.forEach(item => {
                    if (item._id && item._id.category) {
                        const cat = item._id.category;
                        if (!categoryStatsMap[cat]) {
                            categoryStatsMap[cat] = { count: 0, resolved: 0 };
                        }
                        categoryStatsMap[cat].count += item.count;
                        if (item._id.status === "Resolved") {
                            categoryStatsMap[cat].resolved += item.count;
                        }
                    }
                });
            }

            const categoryBreakdown = categories.map(cat => {
                const stat = categoryStatsMap[cat] || { count: 0, resolved: 0 };
                return {
                    category: cat,
                    count: stat.count,
                    resolved: stat.resolved,
                    pending: stat.count - stat.resolved
                };
            });

            // Parse Block breakdown
            const blockStatsMap = {};
            if (facet.blockStats) {
                facet.blockStats.forEach(item => {
                    if (item._id && item._id.wing) {
                        const wing = item._id.wing;
                        if (!blockStatsMap[wing]) {
                            blockStatsMap[wing] = { count: 0, resolved: 0, pending: 0 };
                        }
                        blockStatsMap[wing].count += item.count;
                        if (item._id.status === "Resolved") {
                            blockStatsMap[wing].resolved += item.count;
                        } else {
                            blockStatsMap[wing].pending += item.count;
                        }
                    }
                });
            }

            const blockBreakdown = blocks.map(block => {
                const stat = blockStatsMap[block] || { count: 0, resolved: 0, pending: 0 };
                return {
                    block: "Block " + block,
                    wing: block,
                    count: stat.count,
                    pending: stat.pending,
                    resolved: stat.resolved
                };
            });

            const recentActivity = facet.recentActivity || [];

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
            console.error("Error loading dashboard:", err);
            res.render("home.ejs", {
                stats: { totalComplaints: 0, pendingComplaints: 0, assignedComplaints: 0, inProgressComplaints: 0, resolvedComplaints: 0, rejectedComplaints: 0, totalResidents: 0, totalStaff: 0 },
                categoryBreakdown: [],
                blockBreakdown: [],
                recentActivity: []
            });
        }
    },

    getdata: async (req, res) => {
        try {
            await connectDB();
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

            const [complaint, staffList] = await Promise.all([
                Complaints.find(filter).sort({ createdAt: -1 }).lean().catch(() => []),
                Staff.find().select("name specialty staffId availability").lean().catch(() => [])
            ]);

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
            console.error("Error fetching complaints:", err);
            res.render("complaints.ejs", {
                complaint: [],
                staffList: [],
                notification: "Database connection initializing... Please refresh in a moment.",
                filter: { status: "All", priority: "All", category: "All", wing: "All", search: "" }
            });
        }
    },

    addpage: async (req, res) => {
        try {
            await connectDB();
            const staffList = await Staff.find().select("name specialty staffId availability").lean().catch(() => []);
            res.render("complaintform.ejs", { staffList });
        } catch (err) {
            res.render("complaintform.ejs", { staffList: [] });
        }
    },

    adddata: async (req, res) => {
        try {
            await connectDB();

            if (!req.session || (!req.session.user && req.session.role !== "admin" && req.session.role !== "staff")) {
                return res.redirect("/login?msg=" + encodeURIComponent("Please log in or register to submit a maintenance complaint.") + "&returnTo=/add");
            }

            const currentUser = req.session.user || {};
            req.body.userId = currentUser.id || null;
            if (!req.body.residentName && currentUser.name) req.body.residentName = currentUser.name;
            if (!req.body.email && currentUser.email) req.body.email = currentUser.email;
            if (!req.body.phone && currentUser.phone) req.body.phone = currentUser.phone;
            if (!req.body.wing && currentUser.wing) req.body.wing = currentUser.wing;
            if (!req.body.flatNo && currentUser.flatNo) req.body.flatNo = currentUser.flatNo;

            if (!req.body.complaintId || req.body.complaintId.trim() === "") {
                const count = await Complaints.countDocuments().catch(() => 0);
                req.body.complaintId = "CMP-" + String(1001 + count);
            }

            req.body.timeline = [
                {
                    status: req.body.status || "Pending",
                    note: "Complaint registered by " + (req.body.residentName || "resident") + ".",
                    updatedAt: new Date()
                }
            ];

            if (req.body.assignedStaff && req.body.assignedStaff !== "Unassigned" && req.body.status === "Pending") {
                req.body.status = "Assigned";
                req.body.timeline.push({
                    status: "Assigned",
                    note: `Assigned to ${req.body.assignedStaff}`,
                    updatedAt: new Date()
                });
            }

            await Complaints.create(req.body);

            // If resident user, redirect to their profile to view the submitted complaint
            if (req.session.role === "resident") {
                return res.redirect("/profile?msg=" + encodeURIComponent(`Complaint #${req.body.complaintId} submitted successfully! Track progress below.`));
            }

            res.redirect("/view?msg=" + encodeURIComponent(`Complaint #${req.body.complaintId} submitted successfully!`));
        } catch (err) {
            console.error("Error adding complaint:", err);
            res.redirect("/view?msg=" + encodeURIComponent("Error registering complaint: " + err.message));
        }
    },


    editpage: async (req, res) => {
        try {
            await connectDB();
            const [complaint, staffList] = await Promise.all([
                Complaints.findById(req.params.id).lean(),
                Staff.find().select("name specialty staffId availability").lean().catch(() => [])
            ]);

            if (!complaint) {
                return res.status(404).send("Complaint ticket not found. <a href='/view'>Back to list</a>");
            }

            res.render("complaintedit.ejs", { complaint, staffList });
        } catch (err) {
            console.error("Error finding complaint:", err);
            res.status(500).send("Error loading ticket details. <a href='/view'>Back to list</a>");
        }
    },

    updatedata: async (req, res) => {
        try {
            await connectDB();
            const existing = await Complaints.findById(req.params.id);
            if (!existing) {
                return res.status(404).send("Complaint ticket not found");
            }

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
            res.redirect("/view?msg=" + encodeURIComponent("Error updating ticket: " + err.message));
        }
    },

    deletedata: async (req, res) => {
        try {
            await connectDB();
            const complaint = await Complaints.findByIdAndDelete(req.params.id);
            const ref = complaint ? complaint.complaintId : "Record";
            res.redirect("/view?msg=" + encodeURIComponent(`${ref} deleted successfully.`));
        } catch (err) {
            console.error("Error deleting complaint:", err);
            res.redirect("/view?msg=" + encodeURIComponent("Error deleting complaint."));
        }
    },

    quickStatus: async (req, res) => {
        try {
            await connectDB();
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
                    note: `Status updated to ${status}`,
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
            res.redirect("/view?msg=" + encodeURIComponent("Error updating status."));
        }
    }
};

module.exports = complaintController;

