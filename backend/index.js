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

**The report must include:**
- A **pie chart** showing audience distribution across different regions (e.g., Americas, EMEA, APAC).
- A **bar chart** showing revenue growth trend over the last 6 months.

**Format the final output strictly in valid JSON, separated into these sections:**
- "title": A powerful and professional title for the report.
- "summary": A 200–300 word executive summary about "${brandName}"'s brand position, market strategy, and future vision.
- "charts": A JSON object containing:
  - "audienceDistributionPieChart": with a description and simulated data points.
  - "revenueGrowthBarChart": with a description and simulated data points.

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
// 2️⃣ Route to get summarized market trends (your existing code)
// ====================================================================
const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

app.post("/get-market-trends", async (req, res) => {
  const { marketPrompt } = req.body;
  console.log("res req success " + marketPrompt);

  try {
    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: marketPrompt }),
    });

    const data = await hfRes.json();

    if (data.error) {
      console.error("HuggingFace Error:", data.error);
      return res.status(500).json({ error: "Hugging Face API error" });
    }

    const summary = data[0]?.summary_text || "No summary returned.";
    console.log("hugging face Response " + summary);
    res.json({ summary });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: "Failed to get market summary." });
  }
});

// ====================================================================
// 3️⃣ NEW Route: Get competitors list (OpenRouter - LLM generated)
// ====================================================================
// app.post("/get-competitors", async (req, res) => {
//   const { brandName, category, subCategory } = req.body;
//   console.log("req body ", req.body);

//   if (!brandName || !category || !subCategory) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const prompt = `
//   Suggest exactly 8 competitor company names for a brand called "${brandName}" in the "${category}" industry, specifically under "${subCategory}" subcategory, dont give any description just give compitor names .

//   Important Instructions:
//   - Competitor should be registered with any stock-exchange
//   - Only return competitor names.
//   - competitors name should be display in content inside messages
//   - Only comma-separated names, like this format:
//   Nike, Adidas, Puma, Reebok, Under Armour

//   `;

//     const response = await fetch(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // Use from your .env
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "deepseek/deepseek-r1:free", // <-- updated model
//           messages: [{ role: "user", content: prompt }],
//           temperature: 0.7,
//           max_tokens: 300, // you can increase token limit slightly
//         }),
//       }
//     );
//     //************************************************************************************** */
//     // const data = await response.json();

//     // const aiText = data?.choices?.[0]?.message?.content || "";

//     // const competitors = aiText
//     //   .split(",")
//     //   .map((c) => c.trim())
//     //   .filter((c) => c.length > 0);
//     // console.log("data ser", competitors);
//     // res.status(200).json({ competitors });

//     //*********************************************************************************** */
//     const data = await response.json();
//     console.log("⚡ Full OpenRouter response:", JSON.stringify(data, null, 2));

//     const aiText = data?.choices?.[0]?.message?.content || "";

//     let competitors = [];

//     if (typeof aiText === "string") {
//       competitors = aiText
//         .split(",")
//         .map((c) => c.trim())
//         .filter((c) => c.length > 0);
//     } else {
//       console.error("AI response is not a string:", aiText);
//       competitors = [];
//     }

//     res.status(200).json({ competitors });
//   } catch (error) {
//     console.error("Error fetching from OpenRouter:", error);
//     res.status(500).json({ error: "Failed to fetch competitors" });
//   }
// });

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
