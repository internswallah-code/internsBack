import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Application", applicationSchema);
