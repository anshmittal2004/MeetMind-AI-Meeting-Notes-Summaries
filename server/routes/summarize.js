import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

// Initialize Groq client lazily to ensure env vars are loaded
let groq;
const getGroqClient = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    console.log("✅ Groq client initialized with API key:", process.env.GROQ_API_KEY.substring(0, 5) + "...");
  }
  return groq;
};

router.post("/", async (req, res) => {
  console.log("Received data at 02:11 PM IST, August 19, 2025:", req.body);
  try {
    const { text, prompt = "Summarize this content:" } = req.body;
    
    if (!text || !text.trim()) {
      console.log("Validation failed: Text is empty or invalid at 02:11 PM IST, August 19, 2025");
      return res.status(400).json({ error: "Text content is required and cannot be empty" });
    }

    console.log("Processing text of length:", text.length);
    
    const groqClient = getGroqClient();
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n${text}`
        }
      ],
      model: "llama3-8b-8192", // You can change this to other Groq models like "mixtral-8x7b-32768" or "llama3-70b-8192"
      temperature: 0.7,
      max_tokens: 2048,
    });

    if (!chatCompletion.choices || !chatCompletion.choices[0]?.message?.content) {
      throw new Error("No response from Groq API");
    }

    res.json({ 
      success: true,
      summary: chatCompletion.choices[0].message.content
    });

  } catch (err) {
    console.error("❌ Summarization error at 02:11 PM IST, August 19, 2025:", err);
    if (err.message.includes("API key") || err.status === 401) {
      res.status(500).json({ 
        success: false,
        error: "Invalid Groq API key. Please verify .env or regenerate the key.",
        details: err.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: "Summarization failed",
        details: err.message 
      });
    }
  }
});

export default router;