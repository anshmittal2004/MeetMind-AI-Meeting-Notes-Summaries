import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import Groq from "groq-sdk";
import dotenv from 'dotenv';
import summarizeRouter from './routes/summarize.js';
import uploadRouter from './routes/upload.js';
import emailRouter from './routes/email.js';

// Try multiple .env paths
const envPaths = [
  'T:/ai-meeting-summarizer-upgraded/server/.env',
  './.env',
  '../.env'
];

let envLoaded = false;
for (const path of envPaths) {
  try {
    dotenv.config({ path });
    if (process.env.GROQ_API_KEY) {
      console.log(`✅ Loaded .env from: ${path}`);
      envLoaded = true;
      break;
    }
  } catch (err) {
    console.log(`⚠️ Could not load .env from: ${path}`);
  }
}

// Also try loading without explicit path
if (!envLoaded) {
  dotenv.config();
  if (process.env.GROQ_API_KEY) {
    console.log("✅ Loaded .env from default location");
    envLoaded = true;
  }
}

console.log("Loaded GROQ_API_KEY at 02:11 PM IST, August 19, 2025:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 5) + "..." : "Not found");
console.log("Current working directory:", process.cwd());
console.log("All environment variables starting with GROQ:", Object.keys(process.env).filter(key => key.startsWith('GROQ')));

if (!process.env.GROQ_API_KEY) {
  console.error("FATAL: GROQ_API_KEY is not loaded at 02:11 PM IST, August 19, 2025. Check .env path or file.");
  console.error("Make sure your .env file contains: GROQ_API_KEY=your_actual_api_key");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Root route to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'Server is running at 02:11 PM IST, August 19, 2025' });
});

// Register routers
app.use('/summarize', summarizeRouter);
app.use('/upload', uploadRouter);
app.use('/email', emailRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} at 02:11 PM IST, August 19, 2025`);
});