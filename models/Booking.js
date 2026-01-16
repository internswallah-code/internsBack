import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    concerns: { type: String, required: true },
    selectedDate: { type: String, required: true }, // you are sending dateString
    selectedTime: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
