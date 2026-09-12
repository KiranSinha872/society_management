const User = require("../models/usermodel");
const Staff = require("../models/staffmodel");
const Complaints = require("../models/complaintmodel");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");

const authController = {

    registerPage: (req, res) => {
        if (req.session && req.session.user) {
            if (req.session.role === "admin") return res.redirect("/");
            if (req.session.role === "staff") return res.redirect("/staff/portal");
            return res.redirect("/profile");
        }
        const error = req.query.error || null;
        const msg = req.query.msg || null;
        res.render("register.ejs", { error, msg, formData: {} });
    },

    register: async (req, res) => {
        try {
            await connectDB();
            const { name, email, password, confirmPassword, wing, flatNo, phone } = req.body;

            const trimmedName = (name || "").trim();
            const trimmedEmail = (email || "").trim().toLowerCase();
            const trimmedPassword = (password || "").trim();
            const trimmedConfirm = (confirmPassword || "").trim();
            const selectedWing = (wing || "A").trim().toUpperCase();
            const trimmedFlat = (flatNo || "").trim();
            const trimmedPhone = (phone || "").trim();

            const formData = { name: trimmedName, email: trimmedEmail, wing: selectedWing, flatNo: trimmedFlat, phone: trimmedPhone };

            // 1. Validation
            if (!trimmedName || !trimmedEmail || !trimmedPassword) {
                return res.render("register.ejs", {
                    error: "Please provide your name, email address, and a secure password.",
                    msg: null,
                    formData
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.render("register.ejs", {
                    error: "Please enter a valid email address.",
                    msg: null,
                    formData
                });
            }

            if (trimmedPassword.length < 6) {
                return res.render("register.ejs", {
                    error: "Password must be at least 6 characters long.",
                    msg: null,
                    formData
                });
            }

            if (trimmedPassword !== trimmedConfirm) {
                return res.render("register.ejs", {
                    error: "Passwords do not match. Please re-enter both passwords.",
                    msg: null,
                    formData
                });
            }

            // 2. Prevent duplicate email registration
            const adminEmail = (process.env.ADMIN_EMAIL || "sinhakiran872@gmail.com").toLowerCase();
            if (trimmedEmail === adminEmail) {
                return res.render("register.ejs", {
                    error: "This email is reserved for system administration. Please use another email or log in.",
                    msg: null,
                    formData
                });
            }

            const existingUser = await User.findOne({ email: trimmedEmail });
            if (existingUser) {
                return res.render("register.ejs", {
                    error: "An account with this email already exists. Please log in instead.",
                    msg: null,
                    formData
                });
            }

            // 3. Hash password with bcrypt
            const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

            // 4. Create User Record
            const newUser = await User.create({
                name: trimmedName,
                email: trimmedEmail,
                password: hashedPassword,
                wing: selectedWing,
                flatNo: trimmedFlat,
                phone: trimmedPhone,
                role: "resident"
            });

            // 5. Initialize session for seamless login
            req.session.role = "resident";
            req.session.user = {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: "resident",
                wing: newUser.wing,
                flatNo: newUser.flatNo,
                phone: newUser.phone
            };

            return res.redirect("/profile?msg=" + encodeURIComponent(`Account created successfully! Welcome to the society portal, ${newUser.name}.`));
        } catch (err) {
            console.error("Registration error:", err.message || err);
            return res.render("register.ejs", {
                error: "Failed to complete registration: " + (err.message || "An unexpected error occurred"),
                msg: null,
                formData: req.body || {}
            });
        }
    },

    loginPage: (req, res) => {
        if (req.session && req.session.user) {
            if (req.session.role === "admin") return res.redirect("/");
            if (req.session.role === "staff") return res.redirect("/staff/portal");
            return res.redirect("/profile");
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

            if (!inputEmail || !inputPassword) {
                return res.render("login.ejs", {
                    error: "Please enter both email and password.",
                    msg: null
                });
            }

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
                }
            }

            // 3. Check Resident / User Credentials with bcrypt
            const user = await User.findOne({ email: inputEmail });
            if (user) {
                const isMatch = await bcrypt.compare(inputPassword, user.password);
                if (isMatch) {
                    req.session.role = "resident";
                    req.session.user = {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: "resident",
                        wing: user.wing,
                        flatNo: user.flatNo,
                        phone: user.phone
                    };
                    return res.redirect("/profile?msg=" + encodeURIComponent(`Welcome back, ${user.name}!`));
                }
            }

            // 4. Invalid credentials
            return res.render("login.ejs", {
                error: "Invalid email or password. Please check your credentials or register for an account.",
                msg: null
            });
        } catch (err) {
            console.error("Login error:", err.message || err);
            return res.render("login.ejs", {
                error: "An unexpected error occurred during login. Please try again.",
                msg: null
            });
        }
    },

    profilePage: async (req, res) => {
        try {
            await connectDB();
            const sessionUser = req.session.user;
            if (!sessionUser) {
                return res.redirect("/login?msg=" + encodeURIComponent("Please login to view your profile."));
            }

            // If Admin
            if (req.session.role === "admin") {
                return res.redirect("/?msg=" + encodeURIComponent("Welcome Admin!"));
            }

            // If Staff
            if (req.session.role === "staff") {
                return res.redirect("/staff/portal");
            }

            // Resident Profile - fetch user details and their filed complaints
            const [userData, userComplaints] = await Promise.all([
                User.findById(sessionUser.id).lean().catch(() => sessionUser),
                Complaints.find({ email: sessionUser.email.toLowerCase() }).sort({ createdAt: -1 }).lean().catch(() => [])
            ]);

            const currentUser = userData || sessionUser;

            const totalFiled = userComplaints.length;
            const resolvedCount = userComplaints.filter(c => c.status === "Resolved").length;
            const pendingCount = userComplaints.filter(c => c.status === "Pending" || c.status === "Assigned").length;
            const inProgressCount = userComplaints.filter(c => c.status === "In Progress").length;

            const msg = req.query.msg || null;

            res.render("profile.ejs", {
                user: currentUser,
                complaints: userComplaints,
                stats: {
                    totalFiled,
                    resolvedCount,
                    pendingCount,
                    inProgressCount
                },
                msg
            });
        } catch (err) {
            console.error("Profile page error:", err.message || err);
            res.redirect("/?msg=" + encodeURIComponent("Unable to load profile."));
        }
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
            }
            res.clearCookie("connect.sid");
            res.redirect("/login?msg=" + encodeURIComponent("You have logged out successfully."));
        });
    }
};

module.exports = authController;

