import express from "express";
import Mentorship from "../models/Mentorship.js";
import { appendMentorshipToGoogleSheet } from "../utils/googleSheet.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { concerns, selectedDate, selectedTime } = req.body;

    if (!concerns || !selectedDate || !selectedTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const mentorship = await Mentorship.create({
      concerns,
      selectedDate,
      selectedTime,
    });

    await appendMentorshipToGoogleSheet(mentorship);

    return res.status(201).json({
      message: "Mentorship form saved successfully",
      mentorship,
    });
  } catch (error) {
    console.log("Booking API Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
