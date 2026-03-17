/**
 * Jivaka Backend Server
 * Express server for handling API requests, chatbot interactions, and health calculations
 */
// @ts-nocheck


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require("fs");
require('dotenv').config();
console.log("✅ Groq Key Loaded:", process.env.GROQ_API_KEY ? "Yes" : "No");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS to allow frontend domain in production



const allowedOrigins = [
  "http://localhost:3000",
  "https://jivakafinal-8jdr.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    // allow main domain + all Vercel preview URLs
    if (
      allowedOrigins.includes(origin) ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  credentials: true,
}));


app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ============================================
// API Routes
// ============================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jivaka API is running' });
});

/**
 * Chatbot endpoint - handles text messages
 * TODO: Connect to OpenAI API, Dialogflow, or Hugging Face for AI responses
 * Example: const response = await openai.chat.completions.create({...})
 */
const Groq = require("groq-sdk");
const groq = new Groq.Groq({ apiKey: process.env.GROQ_API_KEY });



app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ response: "No message provided." });
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Groq’s best model for chat
      messages: [
        {
          role: "system",
          content:
            "You are Jivaka, an AI healthcare assistant. Provide helpful, empathetic, and accurate health guidance — but always remind users that you are not a substitute for professional medical advice.",
        },
        ...(conversationHistory || []).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: message },
      ],
    });

    const botResponse = chatCompletion.choices[0]?.message?.content || "I'm not sure how to respond to that.";
    res.json({ response: botResponse });

  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ response: "I'm sorry, I encountered an error. Please try again." });
  }
});


/**
 * Image analysis endpoint - handles image uploads
 * TODO: Connect to OpenAI Vision API, Google Cloud Vision, or similar for image analysis
 * Example: const result = await openai.chat.completions.create({ vision model... })
 */
// ===============================================
// 🧠 Image Analysis Endpoint (Groq Vision Model)
// ===============================================
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log("🖼️ Image received:", req.file.originalname, req.file.mimetype);

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    console.log("📸 Sending image to Groq model...");

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",


      messages: [
        {
          role: "system",
          content:
            "You are Jivaka, an AI healthcare assistant. You analyze medical and wellness-related images and give general insights. Always remind users this is not a medical diagnosis.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this image and explain what it might show." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }, // ✅ fixed
            },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const aiResponse =
      response.choices?.[0]?.message?.content ||
      "I analyzed the image, but couldn’t generate a detailed description.";

    console.log("🤖 AI Image Analysis Done.");

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Image analysis error:", error);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});





/**
 * BMI calculation endpoint
 */
app.post('/api/calculate-bmi', (req, res) => {
  try {
    const { weight, height } = req.body;

    if (!weight || !height || weight <= 0 || height <= 0) {
      return res.status(400).json({ error: 'Valid weight (kg) and height (cm) are required' });
    }

    // Convert height from cm to meters
    const heightInMeters = height / 100;
    
    // Calculate BMI: weight (kg) / height (m)²
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Determine category
    let category = '';
    let suggestion = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      suggestion = 'Consider consulting with a nutritionist to ensure you\'re getting adequate nutrition. Focus on nutrient-dense foods and gradual, healthy weight gain.';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Normal';
      suggestion = 'Great! You\'re in a healthy weight range. Maintain a balanced diet and regular exercise to stay healthy.';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      suggestion = 'Consider focusing on a balanced diet with portion control and regular physical activity. Small, sustainable changes can make a big difference.';
    } else {
      category = 'Obese';
      suggestion = 'It\'s important to work with healthcare professionals to develop a safe and effective weight management plan. Focus on gradual, sustainable lifestyle changes.';
    }

    res.json({
      bmi: parseFloat(bmi.toFixed(1)),
      category: category,
      suggestion: suggestion,
      weight: weight,
      height: height
    });
  } catch (error) {
    console.error('BMI calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate BMI' });
  }
});

/**
 * Vitals checker endpoint
 */
app.post('/api/check-vitals', (req, res) => {
  try {
    const { heartRate, pulseRate, systolicBP, diastolicBP } = req.body;

    const results = {
      heartRate: null,
      pulseRate: null,
      bloodPressure: null,
      overallStatus: 'normal',
      suggestions: []
    };

    // Check Heart Rate (normal: 60-100 bpm for adults at rest)
    if (heartRate) {
      if (heartRate < 60) {
        results.heartRate = {
          value: heartRate,
          status: 'low',
          normalRange: '60-100 bpm',
          message: 'Your heart rate is below the normal resting range.'
        };
        results.suggestions.push('If you\'re an athlete or very active, a lower resting heart rate can be normal. If concerned, consult a healthcare provider.');
      } else if (heartRate > 100) {
        results.heartRate = {
          value: heartRate,
          status: 'high',
          normalRange: '60-100 bpm',
          message: 'Your heart rate is above the normal resting range.'
        };
        results.suggestions.push('Try deep breathing exercises, stay hydrated, and avoid stimulants. If persistent, consult a healthcare provider.');
      } else {
        results.heartRate = {
          value: heartRate,
          status: 'normal',
          normalRange: '60-100 bpm',
          message: 'Your heart rate is within the normal range.'
        };
      }
    }

    // Check Pulse Rate (usually same as heart rate, normal: 60-100 bpm)
    if (pulseRate) {
      if (pulseRate < 60) {
        results.pulseRate = {
          value: pulseRate,
          status: 'low',
          normalRange: '60-100 bpm',
          message: 'Your pulse rate is below normal.'
        };
      } else if (pulseRate > 100) {
        results.pulseRate = {
          value: pulseRate,
          status: 'high',
          normalRange: '60-100 bpm',
          message: 'Your pulse rate is above normal.'
        };
      } else {
        results.pulseRate = {
          value: pulseRate,
          status: 'normal',
          normalRange: '60-100 bpm',
          message: 'Your pulse rate is within normal range.'
        };
      }
    }

    // Check Blood Pressure (normal: <120/<80 mmHg)
    if (systolicBP && diastolicBP) {
      if (systolicBP < 120 && diastolicBP < 80) {
        results.bloodPressure = {
          systolic: systolicBP,
          diastolic: diastolicBP,
          status: 'normal',
          normalRange: '<120/<80 mmHg',
          message: 'Your blood pressure is within the normal range.'
        };
      } else if (systolicBP >= 120 && systolicBP < 130 && diastolicBP < 80) {
        results.bloodPressure = {
          systolic: systolicBP,
          diastolic: diastolicBP,
          status: 'elevated',
          normalRange: '<120/<80 mmHg',
          message: 'Your blood pressure is elevated.'
        };
        results.suggestions.push('Try reducing salt intake, practicing deep breathing, and maintaining regular exercise. Monitor regularly.');
        results.overallStatus = 'attention';
      } else if (systolicBP >= 130 || diastolicBP >= 80) {
        results.bloodPressure = {
          systolic: systolicBP,
          diastolic: diastolicBP,
          status: 'high',
          normalRange: '<120/<80 mmHg',
          message: 'Your blood pressure is above normal.'
        };
        results.suggestions.push('Consider consulting with a healthcare provider. Reduce salt intake, manage stress, and maintain a healthy lifestyle.');
        results.overallStatus = 'attention';
      }
    }

    // Default suggestion if all is normal
    if (results.suggestions.length === 0) {
      results.suggestions.push('Keep up the good work! Maintain a balanced diet, regular exercise, and adequate sleep.');
    }

    res.json(results);
  } catch (error) {
    console.error('Vitals check error:', error);
    res.status(500).json({ error: 'Failed to check vitals' });
  }
});

/**
 * Contact form endpoint
 */
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // In production, send email using nodemailer, SendGrid, or similar
    // For now, just log and return success
    console.log('Contact form submission:', { name, email, message });

    res.json({
      success: true,
      message: 'Thank you for contacting Jivaka! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Serve static files in production (React build)
// Note: This is disabled for Vercel deployment
// Vercel serves frontend separately
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/build')));
//   
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
//   });
// }

// Health check for root path (for Vercel)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Jivaka API is running',
    endpoints: {
      health: '/api/health',
      chatbot: '/api/chatbot',
      calculateBMI: '/api/calculate-bmi',
      checkVitals: '/api/check-vitals',
      contact: '/api/contact'
    }
  });
});

// Start server (only if not in Vercel environment)
// Vercel uses serverless functions, so we export the app instead
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Jivaka server is running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for Vercel serverless function
module.exports = app;

