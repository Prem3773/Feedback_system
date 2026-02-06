const { spawn } = require("child_process");
const path = require("path");

function getSentiment(text) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../ml/predict.py");

    const pythonProcess = spawn("py", [
      "-3.11",
      scriptPath,
      text
    ]);

    let result = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString().trim();
    });

    pythonProcess.stderr.on("data", (error) => {
      errorOutput += error.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0 && result) {
        // Ensure the result is one of the expected sentiments
        const validSentiments = ["positive", "neutral", "negative"];
        if (validSentiments.includes(result.toLowerCase())) {
          resolve(result.toLowerCase());
        } else {
          console.warn("Invalid sentiment from ML model:", result);
          resolve("neutral");
        }
      } else {
        console.error("PYTHON PROCESS ERROR:", errorOutput);
        resolve("neutral"); // Default to neutral on error
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start Python process:", err);
      resolve("neutral");
    });
  });
}

module.exports = getSentiment;
