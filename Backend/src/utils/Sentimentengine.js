const { spawn } = require("child_process");
const path = require("path");

/**
 * Strip form field labels so sentiment is based on student message content.
 * Example: "Cleanliness: poor" -> "poor"
 */
const extractSemanticText = (text = "") =>
  text
    .split(/\r?\n/)
    .map((line) => {
      const idx = line.indexOf(":");
      return idx >= 0 ? line.slice(idx + 1).trim() : line.trim();
    })
    .filter(Boolean)
    .join(" ");

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Weighted keyword heuristic used as a guardrail around ML output.
 */
const keywordHeuristic = (text = "") => {
  const semanticText = extractSemanticText(text);
  const tokens = tokenize(semanticText);
  const lower = semanticText.toLowerCase();

  const positiveWeights = {
    excellent: 3,
    awesome: 3,
    great: 2,
    good: 1,
    clean: 2,
    hygienic: 2,
    fresh: 2,
    safe: 2,
    supportive: 2,
    helpful: 2,
    engaging: 2,
    clear: 1,
    satisfied: 2,
    punctual: 1,
    maintained: 1
  };
  const negativeWeights = {
    terrible: 3,
    worst: 3,
    bad: 2,
    poor: 2,
    dirty: 2,
    unhygienic: 3,
    stale: 2,
    lukewarm: 2,
    smelly: 2,
    smell: 2,
    broken: 2,
    leaking: 2,
    unsafe: 3,
    boring: 2,
    confusing: 2,
    unclear: 2,
    slow: 1,
    late: 1,
    issue: 1,
    problem: 1,
    dissatisfied: 2,
    frustrated: 2
  };

  const negationPatterns = [
    { pattern: /\bnot\s+(good|clean|safe|helpful|supportive|clear|engaging)\b/g, delta: -2 },
    { pattern: /\b(no|lack of)\s+(support|clarity|hygiene|cleanliness|safety)\b/g, delta: -2 },
    { pattern: /\bnot\s+(bad|dirty|poor|confusing)\b/g, delta: 2 }
  ];

  let score = 0;

  for (const token of tokens) {
    if (positiveWeights[token]) score += positiveWeights[token];
    if (negativeWeights[token]) score -= negativeWeights[token];
  }

  for (const { pattern, delta } of negationPatterns) {
    const matches = lower.match(pattern);
    if (matches) score += delta * matches.length;
  }

  if (score <= -2) return { label: "negative", strength: Math.abs(score) };
  if (score >= 2) return { label: "positive", strength: score };
  return { label: "neutral", strength: Math.abs(score) };
};

/**
 * Final sentiment chooser:
 * - Trust strong heuristic signals from content-heavy feedback
 * - Use model confidence when available
 * - Fall back to heuristic if model output is invalid
 */
const chooseFinalSentiment = (text = "", modelResult = null) => {
  const heuristic = keywordHeuristic(text);
  const modelLabel = modelResult?.label;
  const confidence = typeof modelResult?.confidence === "number" ? modelResult.confidence : null;

  if (!modelLabel) return heuristic.label;
  if (heuristic.label === "neutral" && confidence !== null && confidence < 0.62) return "neutral";
  if (heuristic.label !== "neutral" && heuristic.strength >= 4) return heuristic.label;
  if (heuristic.label !== "neutral" && modelLabel === "neutral") return heuristic.label;
  if (heuristic.label !== "neutral" && modelLabel !== heuristic.label && confidence !== null && confidence < 0.72) {
    return heuristic.label;
  }
  if (heuristic.label !== "neutral" && modelLabel !== heuristic.label && confidence === null && heuristic.strength >= 3) {
    return heuristic.label;
  }

  return modelLabel;
};

/**
 * Try running the sentiment model using a list of python commands.
 * Falls back to heuristic so the API never breaks.
 */
function getSentiment(text) {
  const scriptPath = path.join(__dirname, "../ml/predict.py");
  const commands = [
    ["python", [scriptPath, text]],
    ["py", ["-3", scriptPath, text]],
    ["py", ["-3.11", scriptPath, text]],
    ["python3", [scriptPath, text]],
  ];

  const validSentiments = ["positive", "neutral", "negative"];
  const heuristic = keywordHeuristic(text);

  // Fast path for clear polarity feedback.
  if (heuristic.label !== "neutral" && heuristic.strength >= 5) {
    return Promise.resolve(heuristic.label);
  }

  return new Promise((resolve) => {
    const tryNext = (idx, lastError) => {
      if (idx >= commands.length) {
        if (lastError) console.error("Sentiment model failed, using heuristic:", lastError);
        return resolve(heuristic.label);
      }

      const [cmd, args] = commands[idx];
      let result = "";
      let errorOutput = "";

      const proc = spawn(cmd, args);

      proc.stdout.on("data", (d) => (result += d.toString().trim()));
      proc.stderr.on("data", (e) => (errorOutput += e.toString()));

      proc.on("close", (code) => {
        if (code === 0 && result) {
          // Backward compatible: python can return plain label or JSON payload.
          let parsed = null;
          try {
            parsed = JSON.parse(result);
          } catch {
            parsed = null;
          }

          if (parsed && typeof parsed === "object") {
            const label = String(parsed.label || "").toLowerCase();
            if (validSentiments.includes(label)) {
              return resolve(
                chooseFinalSentiment(text, {
                  label,
                  confidence: Number(parsed.confidence)
                })
              );
            }
          }

          const lowered = result.toLowerCase();
          if (validSentiments.includes(lowered)) {
            return resolve(
              chooseFinalSentiment(text, { label: lowered, confidence: null })
            );
          }
          console.warn("Invalid sentiment from model:", result);
          return resolve(keywordHeuristic(text).label);
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
