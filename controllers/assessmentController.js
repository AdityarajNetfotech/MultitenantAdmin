// GET /api/finalise/finalized-test?candidateId=...&jdId=...
export const getFinalizedTest = asyncHandler(async (req, res) => {
  const { candidateId, jdId } = req.query;
  if (!candidateId || !jdId) {
    return res.status(400).json({ success: false, error: 'candidateId and jdId are required' });
  }
  const test = await FinalisedTest.find({
    $or: [
      { candidateId, job_id: jdId },
      { job_id: jdId },
      { jdId },
    ]
  });
  if (!test || test.length === 0) {
    return res.status(404).json({ success: false, error: 'Not Found' });
  }
  res.json({ success: true, data: test });
});

import asyncHandler from '../utils/asyncHandler.js';
import FinalisedTest from '../models/finalised_test.js';


// POST /api/assessment/generate-test
export const generateTest = asyncHandler(async (req, res) => {
  // Extract relevant data from request body
  console.log("seeyog testing")
  const { jdId, candidateId, skills, global_settings } = req.body;

  // TODO: Implement logic to generate assessment questions based on JD/candidate/skills
  // For now, return a stubbed response
  const questions = [
    { id: 1, question: 'What is your experience with React?', type: 'text' },
    { id: 2, question: 'Explain async/await in Node.js.', type: 'text' },
    { id: 3, question: 'Rate your MongoDB skills (1-5).', type: 'rating' }
  ];

  res.status(200).json({ success: true, message: 'Assessment generated', data: { jdId, candidateId, questions } });
});

// POST /api/assessment/finalize-test
export const finalizeTest = asyncHandler(async (req, res) => {
  // Accept all finalized test params from frontend
  const testData = req.body;

  // Validate required fields (title, etc.)
  if (!testData.title) {
    return res.status(400).json({ success: false, message: 'Test title is required.' });
  }

  // Save finalized test to DB
  const finalisedTest = new FinalisedTest(testData);
  await finalisedTest.save();

  res.status(201).json({ success: true, message: 'Assessment finalized and saved.', data: finalisedTest });
});
