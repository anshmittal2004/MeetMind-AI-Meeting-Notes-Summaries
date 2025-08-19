import express from "express";
import { sendSummaryEmail } from "../utils/email.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { to, subject, summary } = req.body || {};
    if (!to || !summary) return res.status(400).json({ error: "to and summary are required" });
    const messageId = await sendSummaryEmail({ to, subject, summary });
    res.json({ ok: true, messageId });
  } catch (err) {
    next(err);
  }
});

export default router;