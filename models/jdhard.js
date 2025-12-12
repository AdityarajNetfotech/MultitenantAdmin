import mongoose from "mongoose";

const jdSchema = new mongoose.Schema(
  {
    HR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    company: { type: String, required: true },
    experience: { type: Number, required: true },
    skills: { type: [String], required: true },
    location: { type: String, required: true },
    Qualification: { type: String, required: true },
    employmentType: { type: String, required: true },
    salaryRange: { type: String },
    fullJD: { type: String, required: true },
    jobSummary: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("JDHard", jdSchema);
