import express from "express";
import Internship from "../models/Internship.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authUser, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      duration,
      stipendValue,
      isRemote,
      isPartTime,
      skills,
      description,
    } = req.body;

    const internship = await Internship.create({
      createdBy: req.user._id,
      title,
      company,
      location,
      duration,
      stipendValue,
      isRemote,
      isPartTime,
      skills,
      description,
    });

    res.status(201).json(internship);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to create internship" });
  }
});

router.get("/", async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch internships" });
  }
});

router.get("/my", authUser, async (req, res) => {
  try {
    const internships = await Internship.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your internships" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    res.json(internship);
  } catch (err) {
    res.status(400).json({ message: "Invalid internship ID" });
  }
});

router.delete("/:id", authUser, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    if (internship.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Internship.findByIdAndDelete(req.params.id);

    res.json({ message: "Internship deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid internship ID" });
  }
});

export default router;
