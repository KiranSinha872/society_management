const mongoose = require("mongoose");

const staffmodel = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    staffId: {
        type: String,
        required: true,
        unique: true
    },

    specialty: {
        type: String,
        enum: [
            "Plumber",
            "Electrician",
            "Lift Technician",
            "Security Guard",
            "Carpenter",
            "Housekeeping",
            "Gardener",
            "General Maintenance"
        ],
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        default: "Staff@123",
        required: true
    },

    availability: {
        type: String,
        enum: ["Available", "On Duty", "On Leave"],
        default: "Available",
        required: true
    },

    shift: {
        type: String,
        default: "Day (8 AM - 6 PM)"
    },

    activeTasksCount: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

// Production Indexes for staff listing, filtering & task assignment
staffmodel.index({ specialty: 1, name: 1 });
staffmodel.index({ availability: 1 });

module.exports = mongoose.model("staff", staffmodel);

