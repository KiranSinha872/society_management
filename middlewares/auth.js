const isAuthenticated = (req, res, next) => {
    if (req.session && (req.session.user || req.session.role)) {
        return next();
    }
    const returnTo = encodeURIComponent(req.originalUrl || "/add");
    const msg = encodeURIComponent("Please log in or register an account to file and track maintenance complaints.");
    return res.redirect(`/login?msg=${msg}&returnTo=${returnTo}`);
};


const isAdmin = (req, res, next) => {
    if (req.session && req.session.role === "admin") {
        return next();
    }
    return res.redirect("/login?msg=" + encodeURIComponent("Access denied. Please login as Admin."));
};

const isStaff = (req, res, next) => {
    if (req.session && req.session.role === "staff") {
        return next();
    }
    return res.redirect("/login?msg=" + encodeURIComponent("Access denied. Please login as Maintenance Staff."));
};

const isStaffOrAdmin = (req, res, next) => {
    if (req.session && (req.session.role === "admin" || req.session.role === "staff")) {
        return next();
    }
    return res.redirect("/login?msg=" + encodeURIComponent("Please login as Admin or Staff."));
};

module.exports = { isAuthenticated, isAdmin, isStaff, isStaffOrAdmin };

