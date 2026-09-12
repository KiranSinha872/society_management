const Staff = require("../models/staffmodel");
const { connectDB } = require("../config/db");

const authController = {

    loginPage: (req, res) => {
        if (req.session && req.session.role === "admin") {
            return res.redirect("/");
        }
        if (req.session && req.session.role === "staff") {
            return res.redirect("/staff/portal");
        }
        const error = req.query.error || null;
        const msg = req.query.msg || null;
        res.render("login.ejs", { error, msg });
    },

    login: async (req, res) => {
        try {
            await connectDB();
            const { email, password } = req.body;
            const inputEmail = (email || "").trim().toLowerCase();
            const inputPassword = (password || "").trim();

            const adminEmail = (process.env.ADMIN_EMAIL || "sinhakiran872@gmail.com").toLowerCase();
            const adminPassword = process.env.ADMIN_PASSWORD || "Kiran@2006";

            // 1. Check Admin Credentials
            if (inputEmail === adminEmail && inputPassword === adminPassword) {
                req.session.role = "admin";
                req.session.adminEmail = adminEmail;
                req.session.user = { name: "Society Admin", email: adminEmail, role: "admin" };
                return res.redirect("/?msg=" + encodeURIComponent("Welcome back, Admin!"));
            }

            // 2. Check Maintenance Staff Credentials
            const staffMember = await Staff.findOne({ email: inputEmail });
            if (staffMember) {
                if (staffMember.password === inputPassword) {
                    req.session.role = "staff";
                    req.session.staffUser = staffMember;
                    req.session.user = { 
                        id: staffMember._id,
                        name: staffMember.name, 
                        email: staffMember.email, 
                        specialty: staffMember.specialty,
                        staffId: staffMember.staffId,
                        role: "staff" 
                    };
                    return res.redirect("/staff/portal?msg=" + encodeURIComponent(`Welcome back, ${staffMember.name}!`));
                } else {
                    return res.render("login.ejs", {
                        error: "Incorrect password for staff account.",
                        msg: null
                    });
                }
            }

            // 3. User not found
            return res.render("login.ejs", {
                error: "Invalid email or password. Only registered admins and admin-approved maintenance staff can log in.",
                msg: null
            });
        } catch (err) {
            console.error("Login error:", err);
            return res.render("login.ejs", {
                error: "An unexpected error occurred during login.",
                msg: null
            });
        }
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
            }
            res.redirect("/login?msg=" + encodeURIComponent("You have logged out successfully."));
        });
    }
};

module.exports = authController;
