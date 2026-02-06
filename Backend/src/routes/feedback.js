const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const getSentiment = require("../utils/Sentimentengine");

const router = express.Router();

/* ---------------------------------------------
   ENV CONFIG
--------------------------------------------- */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

console.log("Server env ready. Gemini key loaded:", !!GEMINI_API_KEY);

/* ---------------------------------------------
   GEMINI AI FUNCTION (100% FIXED)
--------------------------------------------- */
const callGeminiInsights = async (feedbackTexts, teacherName = "Teacher") => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key missing on server");
  }

  const prompt = `
You are an academic teaching performance analyst.

Analyze the following student feedback and generate:
1) A concise summary (5–7 sentences)
2) Actionable areas for improvement (target 5–7 short bullets; use only what feedback supports)

Rules:
- Always give improvement areas even if feedback is positive
- Use ONLY the feedback text
- Do NOT mention any system or platform
- Return ONLY valid JSON
- No markdown, no code fences

Output format:
{
  "summary": "string",
  "improvementAreas": ["string", "string", "string"]
}

Teacher: ${teacherName}

Student Feedback:
${feedbackTexts.map((t) => "- " + t).join("\n")}
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini HTTP Error:", response.status, errText);
    throw new Error("Gemini API failed");
  }

  const data = await response.json();
  const outputText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!outputText) {
    throw new Error("Empty Gemini response");
  }

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    const match = outputText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid Gemini JSON");
    parsed = JSON.parse(match[0]);
  }

  return {
    summary: parsed.summary || "Summary not available.",
    improvementAreas: (() => {
      const raw = Array.isArray(parsed.improvementAreas)
        ? parsed.improvementAreas
        : [];
      const cleaned = raw
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
      return cleaned.length
        ? Array.from(new Set(cleaned))
        : ["Gemini did not return improvement areas"];
    })()
  };
};

/* ---------------------------------------------
   JWT AUTH MIDDLEWARE
--------------------------------------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

/* ---------------------------------------------
   LEARNING TYPE LOGIC
--------------------------------------------- */
const getLearningType = (attendance, marks) => {
  if (attendance >= 85 && marks >= 75) return "Fast Learner";
  return "Slow Learner";
};

/* ---------------------------------------------
   SUBMIT FEEDBACK
--------------------------------------------- */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { category, responses, teacherId } = req.body;
    const userId = req.user.userId;

    if (teacherId && !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacherId" });
    }

    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ message: "User not found" });

    if (student.role === "student" && student.attendance < 75) {
      return res.status(403).json({
        message: "Attendance criteria not met for feedback submission"
      });
    }

    const learningType = getLearningType(
      student.attendance,
      student.marks
    );

    student.learningType = learningType;
    await student.save();

    const textToAnalyze = `
Teaching Quality: ${responses.teachingQuality}
Clarity: ${responses.clarity}
Support: ${responses.support}
Engagement: ${responses.engagement}
Comments: ${responses.additionalComments}
`;

    const sentiment = await getSentiment(textToAnalyze);

    const feedback = new Feedback({
      userId,
      category,
      responses,
      sentiment,
      learningType,
      ...(category === "teacher" && { teacherId })
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      sentiment,
      learningType,
      feedback
    });
  } catch (err) {
    console.error("Feedback submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------
   TEACHER STATS + AI SUMMARY
--------------------------------------------- */
router.get("/teacher/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const teacherId = req.user.userId;

    const feedbacks = await Feedback.find({
      category: "teacher",
      teacherId
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username role");

    const sentimentCount = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    feedbacks.forEach((f) => {
      if (sentimentCount[f.sentiment] !== undefined) {
        sentimentCount[f.sentiment]++;
      }
    });

    const feedbackTexts = feedbacks.map((f) => `
Teaching Quality: ${f.responses.teachingQuality}
Clarity: ${f.responses.clarity}
Support: ${f.responses.support}
Engagement: ${f.responses.engagement}
Comments: ${f.responses.additionalComments}
`);

    let aiOutput = { summary: "", improvementAreas: [] };

    if (feedbackTexts.length > 0) {
      try {
        aiOutput = await callGeminiInsights(
          feedbackTexts,
          req.user.username || "Teacher"
        );
      } catch (err) {
        console.error("Gemini failed:", err.message);
      }
    }

    res.json({
      totalFeedback: feedbacks.length,
      positive: sentimentCount.positive,
      neutral: sentimentCount.neutral,
      negative: sentimentCount.negative,
      improvementAreas: aiOutput.improvementAreas,
      summary: aiOutput.summary,
      feedbacks: feedbacks.slice(0, 5)
    });
  } catch (err) {
    console.error("Teacher stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------
   ADMIN STATS
--------------------------------------------- */
router.get("/admin/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const feedback = await Feedback.find().populate("userId", "username role");
    const uniqueStudents = await Feedback.distinct("userId");

    res.json({
      totalStudentsWithFeedback: uniqueStudents.length,
      totalFeedback: feedback.length,
      teacherFeedback: feedback.filter((f) => f.category === "teacher"),
      hostelFeedback: feedback.filter((f) => f.category === "hostel"),
      campusFeedback: feedback.filter((f) => f.category === "campus")
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------
   SENTIMENT TEST ROUTE
--------------------------------------------- */
router.get("/test-sentiment", async (req, res) => {
  try {
    const testText = `
Teaching Quality: Very bad
Clarity: Confusing
Support: Poor
Engagement: Boring
Comments: Not satisfied
`;

    const result = await getSentiment(testText);

    res.json({
      message: "Sentiment model test successful",
      sentiment: result
    });
  } catch (err) {
    console.error("Sentiment test error:", err);
    res.status(500).json({ error: "Sentiment test failed" });
  }
});

module.exports = router;
