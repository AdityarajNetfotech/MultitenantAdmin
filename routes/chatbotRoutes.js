import express from 'express';
import axios from 'axios';

const router = express.Router();
const CHATBOT_API_BASE = 'http://localhost:8000'; // Update if FastAPI runs elsewhere

// Proxy GET /session
router.get('/session', async (req, res) => {
  try {
    const { language } = req.query;
    const response = await axios.get(`${CHATBOT_API_BASE}/session`, { params: { language } });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Proxy GET /get_next_question
router.get('/get_next_question', async (req, res) => {
  try {
    const { candidate_id, last_answer } = req.query;
    const response = await axios.get(`${CHATBOT_API_BASE}/get_next_question`, { params: { candidate_id, last_answer } });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Proxy POST /save_qa
router.post('/save_qa', async (req, res) => {
  try {
    const response = await axios.post(`${CHATBOT_API_BASE}/save_qa`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Proxy POST /session/complete
router.post('/session/complete', async (req, res) => {
  try {
    const response = await axios.post(`${CHATBOT_API_BASE}/session/complete`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Proxy POST /call
router.post('/call', async (req, res) => {
  try {
    const { to, language } = req.body;
    const response = await axios.post(`${CHATBOT_API_BASE}/call?to=${encodeURIComponent(to)}&language=${encodeURIComponent(language || 'en')}`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

export default router;
