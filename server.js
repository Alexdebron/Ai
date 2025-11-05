import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // optional, browser requests cross-origin support

const PORT = process.env.PORT || 3000;
const CREATOR = "Chamod Nimsara";

// PowerBrain API helper
const pwbr = async (text) => {
  const res = await fetch("https://powerbrainai.com/chat.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `message=${encodeURIComponent(text)}&messageCount=1`,
  });

  // Guard: if remote returns non-json, handle gracefully
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch (e) {
    // If it's plain text, return as { reply: ... }
    return { reply: txt };
  }
};

// GET endpoint — viewable in browser
// Example: http://localhost:3000/api/powerbrain?message=hello
app.get("/api/powerbrain", async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'message' is required. Example: /api/powerbrain?message=hello",
        creator: CREATOR,
      });
    }

    const response = await pwbr(message);
    return res.json({
      success: true,
      creator: CREATOR,
      query: message,
      reply: response.reply ?? response,
      raw: response, // full raw response from powerbrain
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      creator: CREATOR,
      error: "Failed to contact PowerBrainAI",
      details: err?.message,
    });
  }
});

// POST endpoint — for programmatic usage
// Send JSON: { "message": "Hello" }
app.post("/api/powerbrain", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required", creator: CREATOR });
    }

    const response = await pwbr(message);
    res.json({
      success: true,
      creator: CREATOR,
      query: message,
      reply: response.reply ?? response,
      raw: response,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Failed to connect to PowerBrainAI", creator: CREATOR });
  }
});

// Simple route to check service
app.get("/", (req, res) => {
  res.send(`<h3>PowerBrain API proxy</h3>
    <p>Use <code>/api/powerbrain?message=hello</code> to get JSON reply (visible in browser)</p>
    <p>Creator: <strong>${CREATOR}</strong></p>`);
});

app.listen(PORT, () => {
  console.log(`✅ PowerBrain API running on port ${PORT}`);
});
