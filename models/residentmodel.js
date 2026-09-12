const mongoose = require("mongoose");

const residentmodel = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    flatNo: {
        type: String,
        required: true,
        unique: true
    },

    wing: {
        type: String,
        required: true
    },

    floor: {
        type: Number,
        required: true
    },

    residentType: {
        type: String,
        enum: ["Owner", "Tenant"],
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        required: true
    },

    emergencyContact: {
        type: String,
        required: true
    },

    membersCount: {
        type: Number,
        required: true
    },

    vehicleNo: {
        type: String,
        default: "None"
    },

    ownershipSince: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

// Production Indexes for resident listing and lookups
residentmodel.index({ wing: 1, flatNo: 1 });
residentmodel.index({ residentType: 1 });

module.exports = mongoose.model("resident", residentmodel);

