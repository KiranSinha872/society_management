const Residents = require("../models/residentmodel");
const Complaints = require("../models/complaintmodel");

const residentController = {

    home: (req, res) => {
        res.redirect("/");
    },

    getdata: async (req, res) => {
        try {
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

            const resident = await Residents.find(filter).sort({ wing: 1, flatNo: 1 });
            res.render("residents.ejs", { 
                resident,
                filter: { wing: wing || "All", residentType: residentType || "All", search: search || "" }
            });
        } catch (err) {
            console.log("Error fetching residents:", err);
            res.send("Error fetching residents");
        }
    },

    addpage: (req, res) => {
        res.render("residentform.ejs");
    },

    adddata: async (req, res) => {
        try {
            await Residents.create(req.body);
            res.redirect("/residents/view");
        } catch (err) {
            console.log("Error adding resident:", err);
            res.send("Error adding resident: " + err.message);
        }
    },

    editpage: async (req, res) => {
        try {
            const resident = await Residents.findById(req.params.id);
            if (!resident) {
                return res.status(404).send("Resident not found");
            }
            res.render("residentedit.ejs", { resident });
        } catch (err) {
            console.error("Error finding resident:", err);
            res.status(500).send("Resident not found or invalid ID");
        }
    },

    updatedata: async (req, res) => {
        try {
            await Residents.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
            res.redirect("/residents/view");
        } catch (err) {
            console.error("Error updating resident:", err);
            res.status(500).send("Error updating resident: " + err.message);
        }
    },

    deletedata: async (req, res) => {
        try {
            await Residents.findByIdAndDelete(req.params.id);
            res.redirect("/residents/view");
        } catch (err) {
            console.error("Error deleting resident:", err);
            res.status(500).send("Error deleting resident");
        }
    }
};

module.exports = residentController;
