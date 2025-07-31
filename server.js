import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

import authmiddleware from "./middlewares/auth.middleware.js";
import { upload } from "./middlewares/multer.middleware.js";

import User from "./models/user.model.js";
import Employee from "./models/employee.model.js";
import Job from "./models/jobPost.model.js";
import blacklistTokenModel from "./models/blacklist.model.js";

import userService from "./services/user.service.js";
import employeeService from "./services/employee.service.js";
import jobPostService from "./services/job.service.js";

dotenv.config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middlewares =====
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ===== DB Connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

// ===== Cloudinary Config =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== Upload Resume to Cloudinary =====
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
    });
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
};

const { authUser, authEmployee, authAnyUser } = authmiddleware;

// ===== Auth & User Routes =====
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, city, companyType, workField, role, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User with this email is already exists" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: "User with this mobile number is already exists" });

    const hashed = await User.hashPassword(password);
    const user = await userService.createUser({ fullName, email, password: hashed, phone, city, companyType, workField, role, address });

    const token = user.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = user.generateAuthToken();
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.status(200).json({ token, user });
});

app.post("/employee-signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, city, gender, languages, type } = req.body;
    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: "Employee already exists" });

    const hashed = await Employee.hashPassword(password);
    const employee = await employeeService.createEmployee({ fullName, email, password: hashed, phone, city, gender, languages, type });

    const token = employee.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(201).json({ token, user: employee });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/employee-login", async (req, res) => {
  const { email, password } = req.body;
  const employee = await Employee.findOne({ email });
  if (!employee || !(await employee.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = employee.generateAuthToken();
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.status(200).json({ token, user: employee });
});

app.get("/logout", authAnyUser, async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  await blacklistTokenModel.create({ token });
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/me", authAnyUser, (req, res) => {
  if (req.user) return res.json({ ...req.user.toObject(), userType: "employer" });
  if (req.employee) return res.status(401).json({ message: "Unauthorized" });
  return res.status(401).json({ message: "Unauthorized" });
});

// ===== Profile Routes =====
app.get("/profile", authUser, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.put("/profile", authUser, async (req, res) => {
  const updates = { ...req.body };
  delete updates.email;
  delete updates.password;

  const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
  res.json(updated);
});

app.get("/employee-profile", authEmployee, async (req, res) => {
  const employee = await Employee.findById(req.employee._id).select("-password");
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json(employee);
});

app.put("/employee-profile", authEmployee, async (req, res) => {
  const updates = { ...req.body };
  delete updates.email;
  delete updates.password;

  const updated = await Employee.findByIdAndUpdate(req.employee._id, { $set: updates }, { new: true });
  res.json(updated);
});

app.post("/employee-profile/upload-resume", authEmployee, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file || !req.file.mimetype.includes("pdf")) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Only PDF files allowed" });
    }
    const result = await uploadOnCloudinary(req.file.path);
    if (!result?.secure_url) return res.status(500).json({ message: "Upload failed" });

    const updated = await Employee.findByIdAndUpdate(req.employee._id, { resume: result.secure_url }, { new: true });
    res.json({ message: "Resume uploaded", resumeUrl: result.secure_url, employee: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/employee-profile/delete-resume", authEmployee, async (req, res) => {
  await Employee.findByIdAndUpdate(req.employee._id, { resume: "" });
  res.json({ message: "Resume deleted" });
});

// ===== Job Routes =====
app.post("/post-job", authUser, async (req, res) => {
  try {
    const { company, jobTitle, skills, location, salary, experience, jobType, postedOn, description } = req.body;
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

app.get("/jobs", async (req, res) => {
  const jobs = await Job.find().sort({ postedOn: -1 });
  res.json(jobs);
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/my-jobs", authUser, async (req, res) => {
  const jobs = await Job.find({ companyId: req.user._id }).sort({ postedOn: -1 });
  res.json(jobs);
});

app.delete("/jobs/:id", authUser, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.companyId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
