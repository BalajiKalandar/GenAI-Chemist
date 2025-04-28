import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Correct SDK object
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate-brand-idea", async (req, res) => {
  const { brandName, industry, audience } = req.body;

  const prompt = `Create a futuristic and visionary brand idea for a brand named "${brandName}", working in the "${industry}" industry. The target audience is "${audience}". this promt I am going to send hugging face model for comparision to other competiror , so make accordingly because it will use your promt as my input
  "Generate a 3-page marketing performance report for "${brandName}" focused on "${industry}"and "${audience}".

Include a pie chart showing audience distribution across regions, and a bar chart showing revenue growth over the past 6 months.

Structure the report in JSON format, separating 'title', 'summary', and 'charts'.
"
 `;

  //   const prompt =
  //     "give me report genereted based on market competitiors for soft drink industry , my brand name will be my first colding brand. focus will be on families. region:India";

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

//**************************************************************************************************************** */
// Route to get summarized market trends


// const HF_API_URL =
//   "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
// const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
// app.post("/get-market-trends", async (req, res) => {
//   const { marketPrompt } = req.body;
//   console.log("res req success " + marketPrompt);

//   try {
//     const hfRes = await fetch(HF_API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${HF_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         inputs: marketPrompt,
//       }),
//     });

//     const data = await hfRes.json();

//     if (data.error) {
//       console.error("HuggingFace Error:", data.error);
//       return res.status(500).json({ error: "Hugging Face API error" });
//     }

//     const summary = data[0]?.summary_text || "No summary returned.";
//     console.log("hugging face  Response " + summary);
//     res.json({ summary });
//   } catch (err) {
//     console.error("Server Error:", err.message);
//     res.status(500).json({ error: "Failed to get market summary." });
//   }
// });

//****************************************************************************************************************** */
app.listen(3002, () => {
  console.log("Hey Server running at http://localhost:3002");
});
