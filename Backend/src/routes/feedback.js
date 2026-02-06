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
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
const GROQ_ENDPOINT =
  process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";

console.log("Server env ready. Groq key loaded:", !!GROQ_API_KEY);

/* ---------------------------------------------
   GROQ AI FUNCTION
--------------------------------------------- */
const callGroqInsights = async (feedbackTexts, teacherName = "Teacher") => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key missing on server");
  }

  const systemPrompt = [
    "You are an academic teaching performance analyst.",
    "Analyze student feedback and generate:",
    "1) A concise summary (5-7 sentences)",
    "2) Actionable areas for improvement (target 5-7 short bullets; use only what feedback supports)",
    "Rules:",
    "- Always give improvement areas even if feedback is positive.",
    "- Use ONLY the feedback text.",
    "- Do NOT mention any system or platform.",
    "- Return ONLY valid JSON (no markdown, no code fences).",
    "Output format:",
    '{ "summary": "string", "improvementAreas": ["string", "string", "string"] }'
  ].join("\n");

  const userPrompt = [
    `Teacher: ${teacherName}`,
    "Student Feedback:",
    feedbackTexts.map((t) => "- " + t).join("\n")
  ].join("\n");

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 1024
  };

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Groq HTTP Error:", response.status, errText);
    throw new Error("Groq API failed");
  }

  const data = await response.json();
  const outputText = data?.choices?.[0]?.message?.content || "";

  if (!outputText) {
    throw new Error("Empty Groq response");
  }

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    const match = outputText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid Groq JSON");
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
        : ["Groq did not return improvement areas"];
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

    let aiOutput = {
      summary: "",
      improvementAreas: []
    };

    // Generate AI insights when at least one feedback exists
    if (feedbackTexts.length >= 1) {
      try {
        aiOutput = await callGroqInsights(
          feedbackTexts,
          req.user.username || "Teacher"
        );
      } catch (err) {
        console.error("Groq failed:", err.message);
        aiOutput = {
          summary: `Groq error: ${err.message || "unknown error"}`,
          improvementAreas: []
        };
      }
    } else {
      aiOutput = {
        summary: "No feedback yet to analyze.",
        improvementAreas: []
      };
    }

    // Ensure non-empty strings/arrays so frontend won't show "unavailable"
    if (!aiOutput.summary || !aiOutput.summary.trim()) {
      aiOutput.summary = "AI did not return a summary. Try adding more detailed feedback.";
    }
    if (!Array.isArray(aiOutput.improvementAreas) || aiOutput.improvementAreas.length === 0) {
      aiOutput.improvementAreas = ["AI did not return improvement areas. Try adding more detailed feedback."];
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
