import mongoose from "mongoose";
 
const jdSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
 
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // HR
      required: true,
    },
 
    jobSummary: {
      type: String,
      required: true,
    },
 
    responsibilities: {
      type: [String],
      required: true,
    },
 
    requirements: {
      type: [String],
      required: true,
    },
 
    benefits: {
      type: [String],
      default: [],
    },
 
    additionalNotes: {
      type: String,
      default: "",
    },

    // New fields for AI-generated JD
    generatedByAI: {
      type: Boolean,
      default: false,
    },

    companyName: {
      type: String,
      default: "",
    },

    // department: {
    //   type: String,
    //   default: "",
    // },

    // reportingManager: {
    //   type: String,
    //   default: "",
    // },

    keyResponsibilities: {
      type: String,
      default: "",
    },

    requiredQualifications: {
      type: String,
      default: "",
    },

    additionalInfo: {
      type: String,
      default: "",
    },

    aiGenerationDetails: {
      generatedAt: {
        type: Date,
        default: null,
      },
      rawAIResponse: {
        type: String,
        default: "",
      },
    },

    // Unique public token for JD link
    publicToken: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // Candidate application and filtering fields
    appliedCandidates: [
      {
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
        resume: String,
        name: String,
        email: String,
        phone: String,
        reallocate: { type: Boolean, default: false },
        appliedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["pending", "filtered", "unfiltered"], default: "pending" },
        aiScore: Number,
        aiExplanation: String,
      },
    ],
    filteredCandidates: [
      {
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
        aiScore: Number,
        aiExplanation: String,
      },
    ],
    unfilteredCandidates: [
      {
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
        aiScore: Number,
        aiExplanation: String,
      },
    ],
  },
  { timestamps: true }
);
 
export default mongoose.model("JD", jdSchema);