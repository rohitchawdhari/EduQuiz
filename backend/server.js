const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { registerCompetitionHandlers } = require("./sockets/competitionHandler");
const { sendTestEmail } = require("./services/emailService");

// Routes
const authRoutes = require("./routes/authRoutes");
const questionBankRoutes = require("./routes/questionBankRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/banks", questionBankRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", certificateRoutes);

// Health Check
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    status: "online",
    message: "🚀 EduQuiz API & Real-time Server is running!",
    timestamp: new Date(),
  });
});

// Test Email
app.get(["/test-email", "/api/test-email"], async (req, res) => {
  const targetEmail = req.query.to || process.env.EMAIL_USER || "eduquizofficial@gmail.com";

  const success = await sendTestEmail(targetEmail);

  if (success) {
    return res.json({
      success: true,
      message: `Test email dispatched successfully to ${targetEmail}!`,
    });
  }

  res.status(500).json({
    success: false,
    message: "Test email failed to send. Please check SMTP credentials.",
  });
});

// Socket.IO Handshake Authentication Middleware
const jwt = require("jsonwebtoken");
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "eduquiz_super_secure_jwt_secret_token_key_2026");
      socket.userId = decoded.id;
    } catch (e) {
      console.warn("Socket handshake token invalid, connecting unauthenticated");
    }
  }
  next();
});

// Real-time Socket.IO Connection
io.on("connection", (socket) => {
  console.log(`⚡ Client connected via Socket.IO: ${socket.id} (User: ${socket.userId || 'Guest'})`);

  registerCompetitionHandlers(io, socket);
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
==================================================
🎓 EduQuiz Backend running on port ${PORT}
⚡ Socket.IO Ready for Live Quiz Competitions
📧 Email Service Ready
==================================================
`);
});
