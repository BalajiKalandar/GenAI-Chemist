import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch"; // for HuggingFace + OpenRouter

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Correct SDK object
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ====================================================================
// 1️⃣ Route to generate brand idea (your existing code)
// ====================================================================
app.post("/generate-brand-idea", async (req, res) => {
  const {
    brandName,
    category,
    subCategory,
    competitors: rawCompetitors = [],
    focusAudience,
    theme,
    targetPricePoint,
    region,
    location,
    coreValues,
    mission,
    vision,
  } = req.body;

  const competitors = Array.isArray(rawCompetitors) ? rawCompetitors : [];

  const prompt = `
You are a senior brand strategist and marketing analyst.

Use the following brand details:

- Brand Name: "${brandName}"
- Category: "${category}"
- Sub-Category: "${subCategory}"
- Competitors: ${
    competitors.length > 0
      ? competitors.map((c) => `"${c}"`).join(", ")
      : "None"
  }
- Focus Audience: "${focusAudience}"
- Theme: "${theme}"
- Target Price Point: "${targetPricePoint}"
- Region: "${region}"
- Location: "${location}"
- Core Values: "${coreValues}"
- Mission: "${mission}"
- Vision: "${vision}"

Based on this information, perform the following tasks:

1. Create a futuristic and visionary brand idea that strongly differentiates "${brandName}" from its competitors (${
    competitors.length > 0
      ? competitors.map((c) => `"${c}"`).join(", ")
      : "no listed competitors"
  }). Focus on innovation, future market trends, and emotional connection with the "${focusAudience}" audience.

2. Generate a professional 3-page marketing performance report for "${brandName}", focused on the "${category}" and "${subCategory}" industry sectors, and the "${focusAudience}" target audience.

**Format the final output strictly in valid JSON, separated into these sections:**
- "title": A powerful and professional title for the report.
- "summary": A 400–500 word executive summary about "${brandName}"'s brand position, market strategy, and future vision.
**Instructions:**
- Ensure all sections are filled thoughtfully.
- Keep the tone innovative, inspiring, yet professional.
- Do not output anything outside the JSON structure.
- Please provide the most detailed, comprehensive, and extensive response possible, utilizing the maximum output capacity allowed. 
- Do not summarize or shorten unnecessarily. Be exhaustive and cover every point thoroughly.
`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = await response.text();

    res.json({ idea: text });
  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({ error: "Failed to generate brand idea." });
  }
});

// ====================================================================
// 3️⃣ NEW Route: Get competitors list (OpenRouter - LLM generated)
// ====================================================================

function extractJsonArray(text) {
  text = text.trim();
  if (text.startsWith("```json") || text.startsWith("```")) {
    text = text.replace(/^```json\s*/, ""); // remove ```json and any spaces
    text = text.replace(/^```\s*/, ""); // remove ``` if directly starts
    if (text.endsWith("```")) {
      text = text.slice(0, -3); // remove trailing ```
    }
  }
  return text.trim();
}

app.post("/get-competitors", async (req, res) => {
  const { brandName, category, subCategory } = req.body;
  console.log("req body ", req.body);

  if (!brandName || !category || !subCategory) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prompt = `
Suggest exactly 8 competitor company names for a brand called "${brandName}" in the "${category}" industry, specifically under "${subCategory}" subcategory.

Important Instructions:
- Only list companies that are registered on a stock exchange.
- Return only a valid JSON array of company names, like:
["Microsoft", "Sony", "Alphabet", "Amazon", "IBM", "Intel", "Cisco", "Samsung"]
- No other text or explanation, only pure JSON array.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();
    let cleanedText = extractJsonArray(rawText);

    let competitors = [];

    if (typeof cleanedText === "string" && cleanedText.length > 0) {
      try {
        competitors = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse cleaned JSON response:", cleanedText);
        competitors = [];
      }
    } else {
      console.error("AI response is not a valid string:", cleanedText);
      competitors = [];
    }

    console.log("⚡ Gemini competitors:", competitors);

    res.status(200).json({ competitors });
  } catch (error) {
    console.error("Error fetching competitors from Gemini:", error);
    res.status(500).json({ error: "Failed to fetch competitors" });
  }
});

// ====================================================================
// 4️⃣ Server listening
// ====================================================================
app.listen(3002, () => {
  console.log("🚀 Server running at http://localhost:3002");
});
