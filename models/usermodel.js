const mongoose = require("mongoose");

const usermodel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    wing: {
        type: String,
        enum: ["A", "B", "C", "D", "E"],
        default: "A"
    },

    flatNo: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        enum: ["resident", "staff", "admin"],
        default: "resident"
    }
}, {
    timestamps: true
});

// Production indexes
usermodel.index({ wing: 1, flatNo: 1 });

module.exports = mongoose.model("user", usermodel);

