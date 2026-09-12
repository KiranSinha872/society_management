const isAuthenticated = (req, res, next) => {
    if (req.session && (req.session.user || req.session.role)) {
        return next();
    }
    const returnTo = encodeURIComponent(req.originalUrl || "/add");
    const msg = encodeURIComponent("Please log in or register an account to continue.");
    return res.redirect(`/login?msg=${msg}&returnTo=${returnTo}`);
};

const isAdmin = (req, res, next) => {
    if (!req.session || !req.session.role) {
        const returnTo = encodeURIComponent(req.originalUrl || "/admin");
        return res.redirect(`/login?msg=${encodeURIComponent("Please login as Admin.")}&returnTo=${returnTo}`);
    }
    if (req.session.role === "admin") {
        return next();
    }
    if (req.session.role === "staff") {
        return res.redirect("/staff?msg=" + encodeURIComponent("Access denied to Admin portal. Redirected to Staff Workspace."));
    }
    return res.redirect("/user?msg=" + encodeURIComponent("Access denied to Admin portal. Redirected to User Dashboard."));
};

const isStaff = (req, res, next) => {
    if (!req.session || !req.session.role) {
        const returnTo = encodeURIComponent(req.originalUrl || "/staff");
        return res.redirect(`/login?msg=${encodeURIComponent("Please login as Maintenance Staff.")}&returnTo=${returnTo}`);
    }
    if (req.session.role === "staff") {
        return next();
    }
    if (req.session.role === "admin") {
        return res.redirect("/admin?msg=" + encodeURIComponent("Admin redirected to Admin Dashboard."));
    }
    return res.redirect("/user?msg=" + encodeURIComponent("Access denied to Staff portal. Redirected to User Dashboard."));
};

const isUser = (req, res, next) => {
    if (!req.session || !req.session.role) {
        const returnTo = encodeURIComponent(req.originalUrl || "/user");
        return res.redirect(`/login?msg=${encodeURIComponent("Please login to view your account.")}&returnTo=${returnTo}`);
    }
    if (req.session.role === "resident" || req.session.role === "user") {
        return next();
    }
    if (req.session.role === "admin") {
        return res.redirect("/admin");
    }
    if (req.session.role === "staff") {
        return res.redirect("/staff");
    }
    return next();
};

const isStaffOrAdmin = (req, res, next) => {
    if (!req.session || !req.session.role) {
        return res.redirect("/login?msg=" + encodeURIComponent("Please login to proceed."));
    }
    if (req.session.role === "admin" || req.session.role === "staff") {
        return next();
    }
    return res.redirect("/user?msg=" + encodeURIComponent("Access denied."));
};

module.exports = { isAuthenticated, isAdmin, isStaff, isUser, isStaffOrAdmin };


