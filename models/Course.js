import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
    },

    description: {
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

    fees: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "Beginner Friendly",
        "Industry Oriented",
        "Project Based",
        "Certificate Course",
        "Advanced",
      ],
      default: "Beginner Friendly",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

export default mongoose.model("Course", courseSchema);
