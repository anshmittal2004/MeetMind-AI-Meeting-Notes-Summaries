import express from 'express';
import { promises as fs } from 'fs';
import multer from 'multer';
import mammoth from 'mammoth';
import Groq from "groq-sdk";
import parsePdf from '../pdf-parse-wrapper.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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
  }
  return groq;
};

router.post("/", upload.single("file"), async (req, res) => {
  console.log('File received at 01:22 PM IST, August 19, 2025:', req.file);
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = await fs.readFile(req.file.path);
    let text = '';

    switch (req.file.mimetype) {
      case 'application/pdf':
        console.log('Processing PDF at 01:22 PM IST, August 19, 2025...');
        const pdfData = await parsePdf(fileBuffer);
        text = pdfData.text;
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        console.log('Processing DOCX at 01:22 PM IST, August 19, 2025...');
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        text = docxResult.value;
        break;
      case 'text/plain':
        console.log('Processing TXT at 01:22 PM IST, August 19, 2025...');
        text = fileBuffer.toString('utf8');
        break;
      default:
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: "Unsupported file type" });
    }

    if (!text) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: "No text extracted from file" });
    }
    console.log('Extracted text length at 01:22 PM IST, August 19, 2025:', text.length);

    const groqClient = getGroqClient();
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Summarize this meeting:\n${text}`
        }
      ],
      model: "llama3-8b-8192", // You can change this to other Groq models
      temperature: 0.7,
      max_tokens: 2048,
    });

    await fs.unlink(req.file.path);

    res.json({
      success: true,
      transcript: text,
      summary: chatCompletion.choices[0].message.content
    });

  } catch (error) {
    console.error("Server Error at 01:22 PM IST, August 19, 2025:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;