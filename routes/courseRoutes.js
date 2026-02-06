import express from "express";
import Course from "../models/Course.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST /api/courses
router.post("/", authUser, async (req, res) => {
  try {
    const { title, company, description, location, duration, fees, type } =
      req.body;

    const course = await Course.create({
      createdBy: req.user._id, // first — owner
      title,
      company,
      description,
      location,
      duration,
      fees,
      type,
    });

    res.status(201).json(course);
  } catch (error) {
    // console.log(error);
    res.status(400).json({ message: "Failed to create course" });
  }
});

// GET /api/courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// GET /api/courses
router.get("/my", authUser, async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user._id }).sort({
      createdAt: -1, // newest first
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your courses" });
  }
});

// GET /api/courses/:id
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ message: "Invalid course ID" });
  }
});

// DELETE /api/courses/:id
router.delete("/:id", authUser, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    // Only creator can delete
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid course ID" });
  }
});

export default router;
