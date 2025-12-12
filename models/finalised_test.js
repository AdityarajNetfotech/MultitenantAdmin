import mongoose from 'mongoose';

const FinalisedTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, default: 'Unknown Company' },
  location: { type: String, default: 'Remote' },
  workType: { type: String, default: 'Full-time' },
  employmentMode: { type: String, default: 'On-site' },
  skills: { type: [String], default: [] },
  description: { type: String },
  startDate: { type: String },
  startTime: { type: String },
  endDate: { type: String },
  endTime: { type: String },
  isActive: { type: Boolean, default: true },
  questionSetId: { type: String },
  job_id: { type: String },
  total_questions: { type: Number },
  total_duration: { type: Number },
  mini_compensation: { type: Number },
  max_compensation: { type: Number },
  currency: { type: String },
  created_at: { type: Date, default: Date.now },
  expiry_time: { type: Date },
  status: { type: String },
  duration: { type: Number },
});

export default mongoose.model('FinalisedTest', FinalisedTestSchema);
