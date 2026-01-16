import express from "express";
import Booking from "../models/Booking.js";
import { appendToGoogleSheet } from "../utils/googleSheet.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { concerns, selectedDate, selectedTime } = req.body;

    if (!concerns || !selectedDate || !selectedTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const booking = await Booking.create({
      concerns,
      selectedDate,
      selectedTime,
    });

    await appendToGoogleSheet(booking);

    return res.status(201).json({
      message: "✅ Booking saved successfully",
      booking,
    });
  } catch (error) {
    console.log("Booking API Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
