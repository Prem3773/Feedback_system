import React, { useState, useEffect } from "react";
import TeacherSidebar from "./TeacherSidebar";
import TeachingImprovementReport from "./TeachingImprovementReport";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4CAF50", "#FFC107", "#F44336"];

const Teacherdashboard = ({ user }) => {
  const [sentimentStats, setSentimentStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [improvementAreas, setImprovementAreas] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [learningTypeFilter, setLearningTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    document.title = "EduFeed";
    const fetchTeacherStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Append learningType to query if it's not "All"
        const url = new URL("http://localhost:3001/api/feedback/teacher/stats");
        if (learningTypeFilter !== "All") {
          url.searchParams.append("learningType", learningTypeFilter);
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error('Failed to fetch teacher stats:', res.status, res.statusText);
          setLoading(false);
          return;
        }

        const data = await res.json();

        setSentimentStats({
          positive: data.positive,
          neutral: data.neutral,
          negative: data.negative,
        });
        setTotalFeedback(data.totalFeedback);
        setRecentFeedback(data.feedbacks || []); // Now contains only 5 recent
        setImprovementAreas(data.improvementAreas || []);
        setAiSummary(data.summary || "AI summary unavailable.");
        setMonthlyTrend(data.monthlyTrend || []); // Use trend from backend

        setLoading(false);

      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

    fetchTeacherStats();
  }, [learningTypeFilter]);

  const barData = [
    {
      name: "Sentiment",
      Positive: sentimentStats.positive,
      Neutral: sentimentStats.neutral,
      Negative: sentimentStats.negative,
    },
  ];

  const reportData = {
    positive_percent: 75,
    neutral_percent: 15,
    negative_percent: 10,
    fast_positive_points: `- In-depth explanations\n- Challenging assignments`,
    fast_negative_points: `- Pace can be slow at times\n- Lack of advanced topics`,
    slow_positive_points: `- Clear and patient explanations\n- Willingness to re-explain concepts`,
    slow_negative_points: `- Pace can be too fast\n- Assumes prior knowledge`,
    aoi_points: `- Pacing of the class to suit all learners\n- More interactive sessions\n- Use of more real-world examples`
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <TeacherSidebar />

      <div className="flex-1 p-4">

        {/* HEADER */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white">
            Welcome, {user || "Teacher"}
          </h1>
          <p className="text-center text-gray-500 dark:text-gray-300 mt-2">
            AI & ML Powered Teacher Performance Dashboard
          </p>
          <button
            onClick={() => setShowReport(!showReport)}
            className="absolute top-6 right-6 px-4 py-2 rounded-md font-semibold bg-purple-500 text-white hover:bg-purple-600 transition"
          >
            {showReport ? "View Dashboard" : "Generate Report"}
          </button>
        </div>

        {showReport ? (
          <TeachingImprovementReport {...reportData} teacherName={user || "Teacher"} />
        ) : (
          <>
            {/* LEARNER TYPE FILTER */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setLearningTypeFilter("All")}
                className={`px-4 py-2 rounded-md font-semibold ${
                  learningTypeFilter === "All"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setLearningTypeFilter("Fast Learner")}
                className={`px-4 py-2 rounded-md font-semibold ${
                  learningTypeFilter === "Fast Learner"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                Fast Learners
              </button>
              <button
                onClick={() => setLearningTypeFilter("Slow Learner")}
                className={`px-4 py-2 rounded-md font-semibold ${
                  learningTypeFilter === "Slow Learner"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                Slow Learners
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-300">
                Loading...
              </div>
            ) : totalFeedback === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                No feedback found for "{learningTypeFilter}" students.
              </div>
            ) : (
              <>
                {/* SENTIMENT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Positive", value: sentimentStats.positive, color: "green" },
                    { label: "Neutral", value: sentimentStats.neutral, color: "yellow" },
                    { label: "Negative", value: sentimentStats.negative, color: "red" },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md text-center"
                    >
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                        {card.label}
                      </h3>
                      <p className={`text-3xl font-bold mt-2 text-${card.color}-500`}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* BAR CHART */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-3">Sentiment Bar Chart</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Positive" fill="#4CAF50" />
                        <Bar dataKey="Neutral" fill="#FFC107" />
                        <Bar dataKey="Negative" fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* LINE CHART */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-1 lg:col-span-2">
                    <h2 className="text-2xl font-semibold mb-3">Monthly Feedback Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyTrend}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#4F46E5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* IMPROVEMENT AREAS */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
                  <h2 className="text-2xl font-semibold mb-4">
                    Areas for Improvement (Based on {learningTypeFilter} Feedback)
                  </h2>

                  {improvementAreas.length === 0 ? (
                    <p className="text-gray-500">No improvement areas available.</p>
                  ) : (
                    <ul className="space-y-3">
                      {improvementAreas.map((a, i) => (
                        <li key={i} className="bg-gray-200 dark:bg-gray-700 p-3 rounded flex justify-between">
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* RECENT FEEDBACK */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
                  <h2 className="text-2xl font-semibold mb-4">Recent Feedback</h2>
                  {recentFeedback.length === 0 ? (
                    <p className="text-gray-500">No recent feedback.</p>
                  ) : (
                    <ul className="space-y-4">
                      {recentFeedback.map((fb) => (
                        <li key={fb._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="text-gray-800 dark:text-gray-200">
                            {fb.responses.additionalComments}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              - {fb.userId.username}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                fb.sentiment === "positive"
                                  ? "text-green-500"
                                  : fb.sentiment === "negative"
                                  ? "text-red-500"
                                  : "text-yellow-500"
                              }`}
                            >
                              {fb.sentiment}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* AI SUMMARY */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6 mb-10">
                  <h2 className="text-2xl font-semibold mb-4">
                    🤖 AI Summary (Based on {learningTypeFilter} Feedback)
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {aiSummary}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Teacherdashboard;
