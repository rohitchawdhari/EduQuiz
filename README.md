# 🎓 EduQuiz — Online Examination & Real-Time Multiplayer Quiz Platform

> **Full-Stack MERN + Socket.IO Platform for Examinations, Custom Question Banks, and Live Multiplayer Quiz Battles.**

---

## 🌟 Key Highlights & Standout Features

### 1. 🎲 2-Source Question & Randomization Engine
- **Online Questions Mode**: Fetches curated questions across Computer Science, Python, DBMS, Computer Networks, Operating Systems, Data Structures, and Aptitude.
- **Custom Question Bank Mode**: Teachers can create subject banks and import questions via **Excel (`.xlsx`) or CSV spreadsheets** in bulk, or add questions manually.
- **Smart Difficulty Balancing**: Supports exact distributions (e.g. 10 Easy, 7 Medium, 3 Hard) or Mixed shuffle with zero invented questions.

### 2. 🔥 Live Multiplayer Quiz Battle (Socket.IO)
- **Room Code Joining**: Instant room generation (e.g., `DBMS-7K29`).
- **Waiting Room Lobby**: 4, 5, 10+ classmates join simultaneously with ready states.
- **Synchronized Question Flow**: Synchronized per-question timer (e.g. 20s).
- **Speed Bonus Scoring**: Fast answers earn points bonuses based on remaining response time.
- **Live Dynamic Leaderboard**: Re-orders positions in real time as players submit!
- **Winner Podium & Celebration**: 🥇 1st, 🥈 2nd, 🥉 3rd podium with confetti animation!

### 3. 🛡️ Solo Examination Engine & Anti-Cheating
- **Full Question Palette**: 1 to N grid with color coding (Answered, Marked for Review, Unvisited).
- **Security Guard**: Detects browser tab switches and window loss. Emits warnings and auto-submits upon 3 violations.
- **Server-Side Evaluation**: Correct answers are never sent to the client during the exam, preventing inspect-element inspection.

### 4. 📜 Certificates & Leaderboards
- **Verified Certificates**: Passing with 40%+ score automatically issues an official digital credential with unique ID (e.g. `EQ-2026-00091`) and print/PDF support.
- **Dynamic Leaderboards**: Global Overall, Subject Drills, and Multiplayer Champions.

### 5. 👑 Role-Based Access Control
- **Student**: Attempt solo quizzes, join multiplayer battles, view scorecards and certificates.
- **Teacher**: Create question banks, bulk import Excel/CSV files, generate exams.
- **Admin**: System-wide health metrics, user moderation, and platform management.

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000` with WebSocket support enabled.

#### Environment Variables (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=eduquiz_super_secure_jwt_secret_token_key_2026
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eduquiz?retryWrites=true&w=majority
```
> **Note for MongoDB Atlas**: In your MongoDB Atlas dashboard under **Network Access**, ensure your current IP or `0.0.0.0/0` (Allow from Anywhere) is whitelisted.

---

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 📁 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti, Axios, Socket.IO Client.
- **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.IO, JWT, bcryptjs, Multer, XLSX.
