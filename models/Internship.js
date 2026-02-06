import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    stipendValue: {
      type: Number,
      required: true,
    },

    isRemote: {
      type: Boolean,
      default: false,
    },

    isPartTime: {
      type: Boolean,
      default: false,
    },

    skills: {
      type: [String],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  },
);

export default mongoose.model("Internship", internshipSchema);
