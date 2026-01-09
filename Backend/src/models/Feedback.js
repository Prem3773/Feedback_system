console.log("Loaded Gemini API Key:", process.env.GEMINI_API_KEY);

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['hostel', 'teacher', 'campus'],
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.category === 'teacher';
    }
  },
  responses: {
    type: Object,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  aiAnalysis: {
    type: Object,
    default: {}
  },
  learningType: {
    type: String,
    enum: ['Fast Learner', 'Slow Learner'],
    required: true
  }
}, {
  timestamps: true
});


// ✅ FIXED: load .env correctly
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// initialize Gemini with key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(text);
    return result.response.text();

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "AI analysis failed";
  }
}

module.exports = mongoose.model('Feedback', feedbackSchema);
