const Residents = require("../models/residentmodel");
const { connectDB } = require("../config/db");

const residentController = {

    home: (req, res) => {
        res.redirect("/");
    },

    getdata: async (req, res) => {
        try {
            await connectDB();
            const { wing, residentType, search } = req.query;
            let filter = {};

            if (wing && wing !== "All") {
                filter.wing = wing;
            }
            if (residentType && residentType !== "All") {
                filter.residentType = residentType;
            }
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { flatNo: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ];
            }

            const resident = await Residents.find(filter).sort({ wing: 1, flatNo: 1 }).catch(() => []);
            res.render("residents.ejs", { 
                resident,
                filter: { wing: wing || "All", residentType: residentType || "All", search: search || "" }
            });
        } catch (err) {
            console.error("Error fetching residents:", err);
            res.render("residents.ejs", {
                resident: [],
                filter: { wing: "All", residentType: "All", search: "" }
            });
        }
    },

    addpage: (req, res) => {
        res.render("residentform.ejs");
    },

    adddata: async (req, res) => {
        try {
            await connectDB();
            await Residents.create(req.body);
            res.redirect("/residents/view");
        } catch (err) {
            console.error("Error adding resident:", err);
            res.redirect("/residents/view?msg=" + encodeURIComponent("Error adding resident: " + err.message));
        }
    },

    editpage: async (req, res) => {
        try {
            await connectDB();
            const resident = await Residents.findById(req.params.id);
            if (!resident) {
                return res.status(404).send("Resident record not found. <a href='/residents/view'>Back to list</a>");
            }
            res.render("residentedit.ejs", { resident });
        } catch (err) {
            console.error("Error finding resident:", err);
            res.status(500).send("Resident not found or invalid ID. <a href='/residents/view'>Back to list</a>");
        }
    },

    updatedata: async (req, res) => {
        try {
            await connectDB();
            await Residents.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
            res.redirect("/residents/view");
        } catch (err) {
            console.error("Error updating resident:", err);
            res.redirect("/residents/view?msg=" + encodeURIComponent("Error updating resident: " + err.message));
        }
    },

    deletedata: async (req, res) => {
        try {
            await connectDB();
            await Residents.findByIdAndDelete(req.params.id);
            res.redirect("/residents/view");
        } catch (err) {
            console.error("Error deleting resident:", err);
            res.redirect("/residents/view?msg=" + encodeURIComponent("Error deleting resident."));
        }
    }
};

module.exports = residentController;
