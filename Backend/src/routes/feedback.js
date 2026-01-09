console.log("OpenAI key loaded:", !!process.env.OPENAI_API_KEY);

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const getSentiment = require("../utils/Sentimentengine");
const OpenAI = require("openai");
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const prompt = `
      You are an AI trained to analyze student feedback for teachers.
      Analyze the following feedback and provide:
      1. A list of key "improvementAreas" as an array of strings.
      2. A concise "summary" (4-6 sentences).
      
      Output MUST be in strict JSON format like this:
      {
        "improvementAreas": ["Suggestion 1.", "Suggestion 2."],
        "summary": "Your summary here."
      }

      Student Feedback:
      ${feedbackTexts.join("\n")}
    `;

    let aiOutput = {
      improvementAreas: ["Not enough data for analysis."],
      summary: "Not enough data for a summary.",
    };

    if (feedbackTexts.length > 0) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        aiOutput = JSON.parse(result);
      } catch (err) {
        console.error("OpenAI processing error:", err);
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
