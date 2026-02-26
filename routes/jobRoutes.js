import express from "express";
import Job from "../models/jobPost.model.js";
import User from "../models/user.model.js";
import authmiddleware from "../middlewares/auth.middleware.js";
import jobPostService from "../services/job.service.js";

const { authUser, authEmployee, authAnyUser } = authmiddleware;

const router = express.Router();

router.post("/", authUser, async (req, res) => {
  try {
    const {
      company,
      jobTitle,
      skills,
      location,
      salary,
      experience,
      jobType,
      postedOn,
      description,
    } = req.body;

    const user = await User.findById(req.user._id);

    const job = await jobPostService.createJobPost({
      companyId: user._id,
      company,
      jobTitle,
      skills,
      location,
      salary,
      experience,
      jobType,
      postedOn,
      description,
    });

    await job.save();

    res.status(201).json({ message: "Job posted", job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  const jobs = await Job.find().sort({ postedOn: -1 });
  res.json(jobs);
});

router.get("/my", authUser, async (req, res) => {
  const jobs = await Job.find({ companyId: req.user._id }).sort({
    postedOn: -1,
  });
  res.json(jobs);
});

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authUser, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.companyId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
});

export default router;
