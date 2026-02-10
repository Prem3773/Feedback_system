const { spawn } = require("child_process");
const path = require("path");

/**
 * Lightweight keyword-based heuristic so we still return a useful sentiment
 * even if the Python model is missing or fails.
 */
const keywordHeuristic = (text = "") => {
  const positive = [
    "clean", "tidy", "good", "great", "excellent", "fresh", "fast",
    "stable", "working", "happy", "satisfied", "love", "balanced",
    "delicious", "awesome", "nice", "well maintained"
  ];
  const negative = [
    "dirty", "filthy", "bad", "poor", "worst", "broken", "leaking",
    "smell", "smelly", "stink", "late", "slow", "unstable", "dropped",
    "issue", "problem", "hair", "lukewarm", "stale", "frustrated",
    "unhygienic", "overflow", "standing water"
  ];

  const lower = text.toLowerCase();
  const posHits = positive.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
  const negHits = negative.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
  if (negHits - posHits >= 1) return "negative";
  if (posHits - negHits >= 1) return "positive";
  return "neutral";
};

/**
 * Try running the sentiment model using a list of python commands.
 * Falls back to heuristic so the API never breaks.
 */
function getSentiment(text) {
  const scriptPath = path.join(__dirname, "../ml/predict.py");
  const commands = [
    ["python3", [scriptPath, text]],
    ["python", [scriptPath, text]],
    ["py", ["-3.11", scriptPath, text]],
    ["py", ["-3", scriptPath, text]],
  ];

  const validSentiments = ["positive", "neutral", "negative"];

  return new Promise((resolve) => {
    const tryNext = (idx, lastError) => {
      if (idx >= commands.length) {
        const heuristic = keywordHeuristic(text);
        if (lastError) console.error("Sentiment model failed, using heuristic:", lastError);
        return resolve(heuristic);
      }

      const [cmd, args] = commands[idx];
      let result = "";
      let errorOutput = "";

      const proc = spawn(cmd, args);

      proc.stdout.on("data", (d) => (result += d.toString().trim()));
      proc.stderr.on("data", (e) => (errorOutput += e.toString()));

      proc.on("close", (code) => {
        if (code === 0 && result) {
          const lowered = result.toLowerCase();
          if (validSentiments.includes(lowered)) {
            return resolve(lowered);
          }
          console.warn("Invalid sentiment from model:", result);
          return resolve(keywordHeuristic(text));
        }
        console.warn(`Sentiment command "${cmd}" failed (code ${code}). stderr: ${errorOutput.trim()}`);
        tryNext(idx + 1, errorOutput || `exit ${code}`);
      });

      proc.on("error", (err) => {
        console.warn(`Sentiment command "${cmd}" could not start:`, err.message);
        tryNext(idx + 1, err.message);
      });
    };

    tryNext(0, null);
  });
}

module.exports = getSentiment;
