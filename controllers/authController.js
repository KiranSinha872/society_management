const User = require("../models/usermodel");
const Staff = require("../models/staffmodel");
const Complaints = require("../models/complaintmodel");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");

const authController = {

    registerPage: (req, res) => {
        const returnTo = req.query.returnTo || null;
        if (req.session && req.session.user) {
            if (req.session.role === "admin") return res.redirect(returnTo || "/");
            if (req.session.role === "staff") return res.redirect(returnTo || "/staff/portal");
            return res.redirect(returnTo || "/profile");
        }
        const error = req.query.error || null;
        const msg = req.query.msg || null;
        res.render("register.ejs", { error, msg, formData: {}, returnTo });
    },

    register: async (req, res) => {
        try {
            await connectDB();
            const { name, email, password, confirmPassword, wing, flatNo, phone, returnTo } = req.body;

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
                    formData,
                    returnTo
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.render("register.ejs", {
                    error: "Please enter a valid email address.",
                    msg: null,
                    formData,
                    returnTo
                });
            }

            if (trimmedPassword.length < 6) {
                return res.render("register.ejs", {
                    error: "Password must be at least 6 characters long.",
                    msg: null,
                    formData,
                    returnTo
                });
            }

            if (trimmedPassword !== trimmedConfirm) {
                return res.render("register.ejs", {
                    error: "Passwords do not match. Please re-enter both passwords.",
                    msg: null,
                    formData,
                    returnTo
                });
            }

            // 2. Prevent duplicate email registration
            const adminEmail = (process.env.ADMIN_EMAIL || "sinhakiran872@gmail.com").toLowerCase();
            if (trimmedEmail === adminEmail) {
                return res.render("register.ejs", {
                    error: "This email is reserved for system administration. Please use another email or log in.",
                    msg: null,
                    formData,
                    returnTo
                });
            }

            const existingUser = await User.findOne({ email: trimmedEmail });
            if (existingUser) {
                return res.render("register.ejs", {
                    error: "An account with this email already exists. Please log in instead.",
                    msg: null,
                    formData,
                    returnTo
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

            const redirectTarget = returnTo || "/profile";
            const welcomeMsg = encodeURIComponent(`Account created successfully! Welcome, ${newUser.name}.`);
            const delim = redirectTarget.includes("?") ? "&" : "?";
            return res.redirect(`${redirectTarget}${delim}msg=${welcomeMsg}`);
        } catch (err) {
            console.error("Registration error:", err.message || err);
            return res.render("register.ejs", {
                error: "Failed to complete registration: " + (err.message || "An unexpected error occurred"),
                msg: null,
                formData: req.body || {},
                returnTo: req.body.returnTo || null
            });
        }
    },

    loginPage: (req, res) => {
        const returnTo = req.query.returnTo || null;
        if (req.session && req.session.user) {
            if (req.session.role === "admin") return res.redirect(returnTo || "/");
            if (req.session.role === "staff") return res.redirect(returnTo || "/staff/portal");
            return res.redirect(returnTo || "/profile");
        }
        const error = req.query.error || null;
        const msg = req.query.msg || null;
        res.render("login.ejs", { error, msg, returnTo });
    },

    login: async (req, res) => {
        try {
            await connectDB();
            const { email, password, returnTo } = req.body;
            const inputEmail = (email || "").trim().toLowerCase();
            const inputPassword = (password || "").trim();

            if (!inputEmail || !inputPassword) {
                return res.render("login.ejs", {
                    error: "Please enter both email and password.",
                    msg: null,
                    returnTo
                });
            }

            const adminEmail = (process.env.ADMIN_EMAIL || "sinhakiran872@gmail.com").toLowerCase();
            const adminPassword = process.env.ADMIN_PASSWORD || "Kiran@2006";

            // 1. Check Admin Credentials
            if (inputEmail === adminEmail && inputPassword === adminPassword) {
                req.session.role = "admin";
                req.session.adminEmail = adminEmail;
                req.session.user = { name: "Society Admin", email: adminEmail, role: "admin" };
                return res.redirect((returnTo || "/") + "?msg=" + encodeURIComponent("Welcome back, Admin!"));
            }

            // 2. Check Maintenance Staff Credentials
            const staffMember = await Staff.findOne({ email: inputEmail });
            if (staffMember) {
                let isStaffMatch = false;
                if (staffMember.password.startsWith("$2a$") || staffMember.password.startsWith("$2b$")) {
                    isStaffMatch = await bcrypt.compare(inputPassword, staffMember.password);
                } else {
                    isStaffMatch = (staffMember.password === inputPassword);
                    // Upgrade legacy plaintext staff password to bcrypt hash
                    if (isStaffMatch) {
                        const upgradedHash = await bcrypt.hash(inputPassword, 10);
                        await Staff.findByIdAndUpdate(staffMember._id, { password: upgradedHash });
                        staffMember.password = upgradedHash;
                    }
                }

                if (isStaffMatch) {
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
                    return res.redirect((returnTo || "/staff/portal") + "?msg=" + encodeURIComponent(`Welcome back, ${staffMember.name}!`));
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
                    const target = returnTo || "/profile";
                    const delim = target.includes("?") ? "&" : "?";
                    return res.redirect(`${target}${delim}msg=` + encodeURIComponent(`Welcome back, ${user.name}!`));
                }
            }

            // 4. Invalid credentials
            return res.render("login.ejs", {
                error: "Invalid email or password. Please check your credentials or register for an account.",
                msg: null,
                returnTo
            });
        } catch (err) {
            console.error("Login error:", err.message || err);
            return res.render("login.ejs", {
                error: "An unexpected error occurred during login. Please try again.",
                msg: null,
                returnTo: req.body.returnTo || null
            });
        }
    },

    profilePage: async (req, res) => {
        try {
            await connectDB();
            const sessionUser = req.session.user;
            if (!sessionUser) {
                return res.redirect("/login?msg=" + encodeURIComponent("Please login to view your profile.") + "&returnTo=/profile");
            }

            // If Admin
            if (req.session.role === "admin") {
                return res.redirect("/?msg=" + encodeURIComponent("Welcome Admin!"));
            }

            // If Staff
            if (req.session.role === "staff") {
                return res.redirect("/staff/portal");
            }

            // Resident Profile - fetch user details and their filed complaints (by userId OR email)
            const queryFilter = {
                $or: [
                    { userId: sessionUser.id },
                    { email: sessionUser.email.toLowerCase() }
                ]
            };

            const [userData, userComplaints] = await Promise.all([
                User.findById(sessionUser.id).lean().catch(() => sessionUser),
                Complaints.find(queryFilter).sort({ createdAt: -1 }).lean().catch(() => [])
            ]);

            const currentUser = userData || sessionUser;

            const totalFiled = userComplaints.length;
            const resolvedCount = userComplaints.filter(c => c.status === "Resolved").length;
            const pendingCount = userComplaints.filter(c => c.status === "Pending" || c.status === "Assigned").length;
            const inProgressCount = userComplaints.filter(c => c.status === "In Progress").length;

            const msg = req.query.msg || null;
            const error = req.query.error || null;

            res.render("profile.ejs", {
                user: currentUser,
                complaints: userComplaints,
                stats: {
                    totalFiled,
                    resolvedCount,
                    pendingCount,
                    inProgressCount
                },
                msg,
                error
            });
        } catch (err) {
            console.error("Profile page error:", err.message || err);
            res.redirect("/?msg=" + encodeURIComponent("Unable to load profile."));
        }
    },

    changePassword: async (req, res) => {
        try {
            await connectDB();
            const sessionUser = req.session.user;
            if (!sessionUser) {
                return res.redirect("/login?msg=" + encodeURIComponent("Please log in to change your password."));
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const trimmedCurrent = (currentPassword || "").trim();
            const trimmedNew = (newPassword || "").trim();
            const trimmedConfirm = (confirmPassword || "").trim();

            if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
                return res.redirect("/profile?error=" + encodeURIComponent("All password fields are required."));
            }

            if (trimmedNew.length < 6) {
                return res.redirect("/profile?error=" + encodeURIComponent("New password must be at least 6 characters long."));
            }

            if (trimmedNew !== trimmedConfirm) {
                return res.redirect("/profile?error=" + encodeURIComponent("New passwords do not match. Please re-enter both."));
            }

            const user = await User.findById(sessionUser.id);
            if (!user) {
                return res.redirect("/login?msg=" + encodeURIComponent("User account not found. Please log in again."));
            }

            const isCurrentMatch = await bcrypt.compare(trimmedCurrent, user.password);
            if (!isCurrentMatch) {
                return res.redirect("/profile?error=" + encodeURIComponent("Current password is incorrect. Please try again."));
            }

            const hashedNewPassword = await bcrypt.hash(trimmedNew, 10);
            user.password = hashedNewPassword;
            await user.save();

            return res.redirect("/profile?msg=" + encodeURIComponent("Your password has been changed successfully!"));
        } catch (err) {
            console.error("User change password error:", err);
            return res.redirect("/profile?error=" + encodeURIComponent("Failed to change password: " + (err.message || "Server error")));
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

