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
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT =
  process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";

console.log("Server env ready. Groq key loaded:", !!GROQ_API_KEY);

/* ---------------------------------------------
   GROQ AI FUNCTION
--------------------------------------------- */
const callGroqInsights = async (feedbackTexts, options = {}) => {
  const opts = typeof options === "string"
    ? { entityName: options, entityType: "Teacher" }
    : options || {};

  const entityType = opts.entityType || "Teacher";
  const entityName = opts.entityName || "Teacher";
  const roleDescriptor = opts.roleDescriptor || "academic service quality analyst";

  const systemPrompt = [
    `You are an ${roleDescriptor} focused on ${entityType.toLowerCase()} feedback.`,
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
    `${entityType}: ${entityName}`,
    "Student Feedback:",
    feedbackTexts.map((t) => "- " + t).join("\n")
  ].join("\n");

  const localFallback = () => {
    const joined = feedbackTexts.join(" ");
    const summary = joined
      ? `Student highlights: ${joined.slice(0, 400)}`
      : "Not enough feedback to summarize.";

    const negativeMarkers = ["bad", "poor", "issue", "problem", "dirty", "leak", "broken", "smell", "smelly", "lukewarm", "stale", "hair"];
    const improvementAreas = Array.from(
      new Set(
        feedbackTexts
          .flatMap((t) =>
            t
              .split(/[\.\!\?\n]/)
              .map((s) => s.trim())
              .filter((s) => s && negativeMarkers.some((m) => s.toLowerCase().includes(m)))
          )
      )
    ).filter(Boolean);

    const finalAreas = improvementAreas.length
      ? improvementAreas.slice(0, 5)
      : ["Collect more detailed feedback to generate AI improvement areas."];

    return {
      summary,
      improvementAreas: finalAreas
    };
  };

  const baseBody = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" }
  };

  // If no key is configured, fall back to a lightweight local summarizer.
  if (!GROQ_API_KEY) {
    return localFallback();
  }

  const callGroq = async (body) => {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    const errText = !response.ok ? await response.text() : null;
    return { ok: response.ok, status: response.status, errText, data: response.ok ? await response.json() : null };
  };

  let resp = await callGroq(baseBody);

  // Auto-retry with fallback if model is decommissioned
  if (!resp.ok && resp.errText && resp.errText.includes("model `llama-3.1-70b-versatile` has been decommissioned")) {
    const retryBody = { ...baseBody, model: GROQ_FALLBACK_MODEL };
    console.warn("Groq model deprecated, retrying with fallback:", GROQ_FALLBACK_MODEL);
    resp = await callGroq(retryBody);
  }

  if (!resp.ok) {
    console.error("Groq HTTP Error:", resp.status, resp.errText);
    return localFallback();
  }

  const data = resp.data;
  const outputText = data?.choices?.[0]?.message?.content || "";

  if (!outputText) {
    return localFallback();
  }

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    const match = outputText.match(/\{[\s\S]*\}/);
    if (!match) return localFallback();
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

const buildFeedbackText = (category = "", responses = {}) => {
  const safe = responses || {};
  const lowerCategory = (category || "").toLowerCase();

  if (lowerCategory === "hostel") {
    return [
      `Cleanliness: ${safe.cleanliness || ""}`,
      `Facilities: ${safe.facilities || ""}`,
      `Food Quality: ${safe.foodQuality || ""}`,
      `Maintenance: ${safe.maintenance || ""}`,
      `Comments: ${safe.additionalComments || ""}`
    ].join("\n");
  }

  if (lowerCategory === "campus") {
    return [
      `Cleaning: ${safe.cleaning || safe.cleanliness || ""}`,
      `Water Purity: ${safe.waterPurity || ""}`,
      `Infrastructure: ${safe.infrastructure || ""}`,
      `Safety: ${safe.safety || ""}`,
      `Comments: ${safe.additionalComments || ""}`
    ].join("\n");
  }

  return [
    `Teaching Quality: ${safe.teachingQuality || ""}`,
    `Clarity: ${safe.clarity || ""}`,
    `Support: ${safe.support || ""}`,
    `Engagement: ${safe.engagement || ""}`,
    `Comments: ${safe.additionalComments || ""}`
  ].join("\n");
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
   SUBMIT FEEDBACK
--------------------------------------------- */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { responses = {}, teacherId } = req.body;
    const category = (req.body.category || "").toLowerCase();
    const userId = req.user.userId;

    if (!["teacher", "hostel", "campus"].includes(category)) {
      return res.status(400).json({ message: "Invalid feedback category" });
    }

    if (category === "teacher" && (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId))) {
      return res.status(400).json({ message: "Invalid teacherId" });
    }

    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ message: "User not found" });

    const shouldEnforceAttendance =
      category === "teacher" &&
      student.role === "student" &&
      student.attendanceVerified !== false;

    if (shouldEnforceAttendance && student.attendance < 75) {
      return res.status(403).json({
        message: "Attendance criteria not met for feedback submission"
      });
    }

    const textToAnalyze = buildFeedbackText(category, responses);
    const sentiment = await getSentiment(textToAnalyze);

    const feedback = new Feedback({
      userId,
      category,
      responses,
      sentiment,
      ...(category === "teacher" && { teacherId })
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      sentiment,
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

    const teacherFeedback = feedback.filter((f) => f.category === "teacher");
    const hostelFeedback = feedback.filter((f) => f.category === "hostel");
    const campusFeedback = feedback.filter((f) => f.category === "campus");

    const countSentiment = (items = []) =>
      items.reduce(
        (acc, curr) => {
          const key = (curr.sentiment || "").toLowerCase();
          if (acc[key] !== undefined) acc[key]++;
          return acc;
        },
        { positive: 0, neutral: 0, negative: 0 }
      );

    const buildAiSummary = async (items, entityType, entityName) => {
      if (!items.length) {
        return {
          summary: `No ${entityType.toLowerCase()} feedback yet.`,
          improvementAreas: []
        };
      }
      const texts = items.map((f) => buildFeedbackText(f.category, f.responses));
      try {
        return await callGroqInsights(texts, {
          entityType,
          entityName,
          roleDescriptor: `analyst reviewing ${entityType.toLowerCase()} experience`
        });
      } catch (err) {
        console.error(`AI analysis failed for ${entityType}:`, err.message);
        return {
          summary: `AI analysis failed: ${err.message || "unknown error"}`,
          improvementAreas: []
        };
      }
    };

    const [hostelAiSummary, campusAiSummary] = await Promise.all([
      buildAiSummary(hostelFeedback, "Hostel", "Hostel services"),
      buildAiSummary(campusFeedback, "Campus", "Campus facilities")
    ]);

    res.json({
      totalStudentsWithFeedback: uniqueStudents.length,
      totalFeedback: feedback.length,
      teacherFeedback,
      hostelFeedback,
      campusFeedback,
      hostelSentiment: countSentiment(hostelFeedback),
      campusSentiment: countSentiment(campusFeedback),
      hostelAiSummary,
      campusAiSummary
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
