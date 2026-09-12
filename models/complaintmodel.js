const mongoose = require("mongoose");

const complaintmodel = new mongoose.Schema({

    complaintId: {
        type: String,
        required: true,
        unique: true
    },

    title: {
        type: String,
        required: true
    },

    residentName: {
        type: String,
        required: true
    },

    flatNo: {
        type: String,
        required: true
    },

    wing: {
        type: String,
        required: true
    },

    location: {
        type: String,
        default: "Flat Interior"
    },

    category: {
        type: String,
        enum: [
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
        ],
        required: true
    },

    priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium",
        required: true
    },

    status: {
        type: String,
        enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"],
        default: "Pending",
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    assignedStaff: {
        type: String,
        default: "Unassigned"
    },

    imageUrl: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        required: true
    },

    resolutionNotes: {
        type: String,
        default: ""
    },

    timeline: [
        {
            status: String,
            note: String,
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]

}, {
    timestamps: true
});

module.exports = mongoose.model("complaint", complaintmodel);
