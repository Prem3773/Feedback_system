const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

console.log("Server env ready. Gemini key loaded:", !!GEMINI_API_KEY);

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const getSentiment = require("../utils/Sentimentengine");
const router = express.Router();

const callGeminiInsights = async (feedbackTexts, teacherName = "Teacher") => {
  if (!GEMINI_API_KEY) {
    return {
      improvementAreas: ["Gemini API key not configured on server."],
      summary: "Gemini API key is missing on the server; please set GEMINI_API_KEY.",
    };
  }

  if (!feedbackTexts || feedbackTexts.length === 0) {
    return {
      improvementAreas: ["Not enough feedback to analyze yet."],
      summary: "More feedback is needed to generate a summary.",
    };
  }

  const prompt = [
    "You are an education analyst. Use ONLY the student feedback text to identify areas the teacher should improve in their teaching.",
    "Do not mention the system/platform. Do not invent issues that are not supported by the feedback.",
    "Return ONLY valid JSON in this format:",
    '{ "summary": "string", "improvementAreas": ["string", "string", "string"] }',
    "Rules:",
    "- Summary should be 3 to 5 sentences.",
    "- Improvement areas should be short, actionable phrases (3 to 5 items).",
    "- Always provide improvement areas even if feedback is positive (give growth opportunities).",
    "- Never return empty fields.",
    "- Do not include markdown or code fences.",
    "",
    `Teacher: ${teacherName}`,
    "Student feedback about teaching:",
    feedbackTexts.map((t) => `- ${t}`).join("\n"),
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  const data = await response.json();
  const outputText = (data?.candidates || [])
    .flatMap((c) => c?.content?.parts || [])
    .map((p) => p?.text || "")
    .join("")
    .trim();

  if (!outputText) {
    return {
      improvementAreas: ["Gemini returned no content."],
      summary: "Gemini did not return any text to summarize.",
    };
  }

  // Try parse JSON first
  const tryParse = (txt) => {
    try {
      return JSON.parse(txt);
    } catch {
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const parsed = tryParse(outputText);
  if (parsed && typeof parsed === "object") {
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const areasRaw = Array.isArray(parsed.improvementAreas)
      ? parsed.improvementAreas
      : Array.isArray(parsed.areas)
      ? parsed.areas
      : [];
    const improvementAreas = areasRaw
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    if (summary || improvementAreas.length > 0) {
      return {
        summary: summary || "Summary not returned by Gemini.",
        improvementAreas:
          improvementAreas.length > 0
            ? improvementAreas
            : ["Gemini did not return improvement areas."],
      };
    }
  }

  return {
    improvementAreas: [],
    summary: outputText,
  };
};

/* ---------------------------------------------
   JWT Authentication Middleware
--------------------------------------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      console.error("JWT verification error:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

const getLearningType = (attendance, marks) => {
  if (attendance >= 85 && marks >= 75) {
    return "Fast Learner";
  }
  return "Slow Learner";
};

/* ---------------------------------------------
   SUBMIT FEEDBACK (Sentiment & Learning Pace)
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
        message: "Attendance criteria not met for feedback submission.",
      });
    }

    // Get learning type
    const learningType = getLearningType(student.attendance, student.marks);

    // Update student's learning type
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
      learningType, // Add learning type to feedback
      ...(category === "teacher" && { teacherId }),
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      sentiment,
      learningType,
      feedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------
   TEACHER STATS (Optimized with Aggregation & Lean Response)
--------------------------------------------- */
router.get("/teacher/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const teacherId = req.user.userId;
    const { learningType } = req.query;

    const matchQuery = {
      category: "teacher",
      teacherId: new mongoose.Types.ObjectId(teacherId),
    };

    if (learningType === "Fast Learner") {
      matchQuery.learningType = "Fast Learner";
    } else if (learningType === "Slow Learner") {
      matchQuery.$or = [
        { learningType: "Slow Learner" },
        { learningType: { $exists: false } },
        { learningType: null }
      ];
    }

    const statsPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          positive: { $sum: { $cond: [{ $eq: ["$sentiment", "positive"] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ["$sentiment", "neutral"] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ["$sentiment", "negative"] }, 1, 0] } },
          feedbacks: { $push: "$$ROOT" } // Keep feedbacks for AI summary
        }
      }
    ];

    const statsResult = await Feedback.aggregate(statsPipeline);
    const stats = statsResult[0] || { totalFeedback: 0, positive: 0, neutral: 0, negative: 0, feedbacks: [] };

    // Fetch recent 5 feedbacks separately for lean payload
    const recentFeedback = await Feedback.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "username role");

    // Monthly Trend Aggregation
    const monthlyTrendPipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } },
        { 
          $project: {
            _id: 0,
            month: { 
              $let: {
                vars: {
                  monthsInYear: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
                },
                in: { $arrayElemAt: [ "$$monthsInYear", { $subtract: [ "$_id", 1 ] } ] }
              }
            },
            count: 1
          }
        }
    ];

    const monthlyTrend = await Feedback.aggregate(monthlyTrendPipeline);

    const feedbackTexts = stats.feedbacks.map((f) => {
      return `
Teaching Quality: ${f.responses.teachingQuality}
Clarity: ${f.responses.clarity}
Support: ${f.responses.support}
Engagement: ${f.responses.engagement}
Comments: ${f.responses.additionalComments}
`;
    });

    let aiOutput = {
      improvementAreas: ["Not enough data for analysis."],
      summary: "Not enough data for a summary.",
    };

    if (feedbackTexts.length > 0) {
      try {
        aiOutput = await callGeminiInsights(feedbackTexts, req.user.username || "Teacher");
      } catch (err) {
        console.error("Gemini processing error:", err);
        aiOutput = {
          improvementAreas: ["Gemini error: " + (err?.message || "Unknown error")],
          summary: "Gemini could not generate a summary.",
        };
      }
    }

    return res.json({
      totalFeedback: stats.totalFeedback,
      positive: stats.positive,
      neutral: stats.neutral,
      negative: stats.negative,
      improvementAreas: aiOutput.improvementAreas,
      summary: aiOutput.summary,
      feedbacks: recentFeedback, // Send only recent feedback
      monthlyTrend: monthlyTrend, // Send calculated monthly trend
    });

  } catch (error) {
    console.error("Teacher stats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------
   ADMIN STATS
--------------------------------------------- */
router.get("/admin/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const feedback = await Feedback.find().populate("userId", "username role");
    const uniqueStudents = await Feedback.distinct("userId");

    res.json({
      totalStudentsWithFeedback: uniqueStudents.length,
      totalFeedback: feedback.length,
      teacherFeedback: feedback.filter((f) => f.category === "teacher"),
      hostelFeedback: feedback.filter((f) => f.category === "hostel"),
      campusFeedback: feedback.filter((f) => f.category === "campus"),
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/test-sentiment", async (req, res) => {
  try {
    // Test text (you can change this anytime)
    const testText = `
      Teaching Quality: Very bad
      Clarity: Confusing
      Support: Poor
      Engagement: Boring
      Comments: Not satisfied
    `;

    // Call your ML sentiment engine
    const result = await getSentiment(testText);

    // Log it for debugging
    console.log("🔥 Sentiment Test Input:", testText);
    console.log("🔥 Sentiment Test Output:", result);

    // Return result to browser
    res.json({
      message: "Sentiment model test successful",
      input: testText,
      sentiment: result
    });

  } catch (error) {
    console.error("Sentiment Test Error:", error);
    res.status(500).json({ error: "Sentiment test failed" });
  }
});

module.exports = router;
