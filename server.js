// Load environment variables
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Setup file upload (resume goes to /uploads folder)
const upload = multer({ dest: "uploads/" });

// Serve static files (index.html, style.css, script.js)
app.use(express.static("."));

// Handle application submissions
app.post("/apply", upload.single("resume"), async (req, res) => {
  const { email, age, dob, understandRules, reason } = req.body;
  const resumeFile = req.file;

  if (!email || !age || !dob || !resumeFile) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    // Configure mail transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // from .env
        pass: process.env.EMAIL_PASS  // from .env
      }
    });

    // --- 1. Send confirmation to applicant ---
    await transporter.sendMail({
      from: `"Apeout Moderation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Apeout (Moderation)",
      text: `We are glad you have applied for moderator at Apeout StormChasing.
We are currently reviewing your submission.

(This is a bot email. We will not respond if you email back!)`
    });

    // --- 2. Forward details + resume to staff ---
    await transporter.sendMail({
      from: `"Apeout Applications" <${process.env.EMAIL_USER}>`,
      to: ["traxzzdev@gmail.com", "xmmxxx44@gmail.com"],
      subject: "New Moderator Application",
      text: `
A new moderator application has been submitted.

Email: ${email}
Age: ${age}
Date of Birth: ${dob}
Understands Rules: ${understandRules}
Reason: ${reason}
      `,
      attachments: [
        {
          filename: resumeFile.originalname,
          path: resumeFile.path
        }
      ]
    });

    // Respond to client (website)
    res.status(200).send("Application received!");

    // (Optional) delete resume file after sending
    setTimeout(() => {
      fs.unlink(resumeFile.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }, 30000); // delete after 30s

  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).send("Error processing application.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
