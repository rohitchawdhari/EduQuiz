require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Creates dynamic transporter reading from environment
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Reusable Modern Responsive HTML Email Template
 */
const baseEmailTemplate = ({
  headline,
  subtitle,
  badgeText = "EduQuiz Notification",
  badgeColor = "#6366f1",
  contentHtml,
  ctaText,
  ctaUrl,
}) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const finalCtaUrl = ctaUrl || clientUrl;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
      padding: 32px 28px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .brand-tag {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #a5b4fc;
      margin-top: 4px;
      font-weight: 600;
    }
    .content {
      padding: 36px 32px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 18px;
    }
    .headline {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
    }
    .footer {
      background: #0d1322;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .card-grid {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 20px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Brand Header -->
      <div class="header">
        <div class="brand">✨ EduQuiz</div>
        <div class="brand-tag">Online Examination & Live Arena</div>
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
          ${badgeText}
        </div>
        <h1 class="headline">${headline}</h1>
        <p class="subtitle">${subtitle}</p>

        ${contentHtml}

        ${
          ctaText
            ? `
          <div class="cta-container">
            <a href="${finalCtaUrl}" target="_blank" class="btn">${ctaText} &rarr;</a>
          </div>
        `
            : ""
        }
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">This email was sent by <strong>EduQuiz Automated Notification Engine</strong>.</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} EduQuiz Platform. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generic Dispatcher with Safe Error Handling (Non-blocking)
 */
const sendMailSafe = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("⚠️ Nodemailer: EMAIL_USER or EMAIL_PASS not configured. Skipping email dispatch.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"EduQuiz" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || "EduQuiz Notification",
      html,
    });
    console.log(`📧 Email delivered to [${to}] - MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email delivery failed to [${to}]:`, err.message);
    return false;
  }
};

/**
 * 1. Welcome Email on Registration
 */
const sendWelcomeEmail = async ({ to, name, role = "student" }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const contentHtml = `
    <div class="card-grid">
      <p style="margin: 0 0 12px 0; color: #cbd5e1; font-size: 14px;">
        Hi <strong>${name}</strong>, welcome to <strong>EduQuiz</strong>! You have registered as a <strong>${role.toUpperCase()}</strong>.
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
        <li>🎯 <strong>Smart Solo Exams:</strong> Attempt practice tests with server-synchronized timers and anti-cheating monitoring.</li>
        <li>⚡ <strong>Live Competitions:</strong> Compete in real-time Socket.IO multiplayer arenas with live speed leaderboards.</li>
        <li>📜 <strong>Verified Certificates:</strong> Earn digital credentials with QR validation upon passing exams.</li>
        ${role === "teacher" || role === "admin" ? `<li>📚 <strong>Question Banks:</strong> Upload CSV/Excel spreadsheets and manage institutional question banks.</li>` : ""}
      </ul>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: `Welcome to EduQuiz, ${name}!`,
    subtitle: "Your examination and competition account has been successfully created.",
    badgeText: "Welcome Onboard",
    badgeColor: "#10b981",
    contentHtml,
    ctaText: "Go to Your Dashboard",
    ctaUrl: `${clientUrl}/dashboard`,
  });

  return sendMailSafe({
    to,
    subject: `🎓 Welcome to EduQuiz, ${name}! Your Account is Ready`,
    text: `Hi ${name}, welcome to EduQuiz! Start taking smart quizzes and competing in live battles at ${clientUrl}/dashboard`,
    html,
  });
};

/**
 * 2. Login Notification (Security Alert)
 */
const sendLoginNotification = async ({ to, name, ip = "Unknown", time = new Date() }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const formattedTime = new Date(time).toLocaleString("en-US", { timeZoneName: "short" });

  const contentHtml = `
    <div class="card-grid">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Account:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Login Timestamp:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Source IP:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${ip}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #f59e0b;">
        ⚠️ If you did not initiate this login, please change your password immediately in your account settings.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: "Security Notice: New Login Detected",
    subtitle: `Hi ${name}, a successful login was just recorded for your EduQuiz account.`,
    badgeText: "Security Alert",
    badgeColor: "#3b82f6",
    contentHtml,
    ctaText: "Review Account Security",
    ctaUrl: `${clientUrl}/profile`,
  });

  return sendMailSafe({
    to,
    subject: "🔐 EduQuiz Security Notice: New Login Recorded",
    text: `Hi ${name}, a new login to your EduQuiz account occurred at ${formattedTime}. If this was not you, update your password at ${clientUrl}/profile`,
    html,
  });
};

/**
 * 3. Password Reset Email with 6-digit Code
 */
const sendPasswordResetEmail = async ({ to, name, resetCode }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const contentHtml = `
    <div style="text-align: center; margin: 24px 0;">
      <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 12px;">Use the following 6-digit security code to reset your password:</p>
      <div style="display: inline-block; background: #1e1b4b; border: 2px solid #6366f1; border-radius: 16px; padding: 18px 36px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #c7d2fe;">
        ${resetCode}
      </div>
      <p style="color: #f43f5e; font-size: 13px; margin-top: 14px; font-weight: 600;">
        ⏳ This code will expire in 15 minutes.
      </p>
      <p style="color: #64748b; font-size: 12px; margin-top: 8px;">
        Never share this code with anyone. EduQuiz staff will never ask for your reset code.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: "Reset Your Password",
    subtitle: `Hi ${name}, we received a request to reset the password for your EduQuiz account.`,
    badgeText: "Password Recovery",
    badgeColor: "#ec4899",
    contentHtml,
    ctaText: "Enter Code to Reset Password",
    ctaUrl: `${clientUrl}/forgot-password`,
  });

  return sendMailSafe({
    to,
    subject: `🔑 EduQuiz Password Reset Code: ${resetCode}`,
    text: `Hi ${name}, your password reset code is ${resetCode}. It expires in 15 minutes. Enter it at ${clientUrl}/forgot-password`,
    html,
  });
};

/**
 * 4. Quiz Completion & Result Scorecard Email
 */
const sendQuizResultEmail = async ({
  to,
  name,
  quizTitle,
  subject,
  score,
  maxScore,
  percentage,
  passed,
  correctCount,
  wrongCount,
  skippedCount = 0,
  timeTakenSeconds = 0,
  attemptId,
}) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const durationText = `${Math.floor(timeTakenSeconds / 60)}m ${timeTakenSeconds % 60}s`;

  const statusColor = passed ? "#10b981" : "#f43f5e";
  const statusBadge = passed ? "PASSED ✅" : "NEEDS IMPROVEMENT ⚠️";

  const contentHtml = `
    <div style="background: ${statusColor}15; border: 1px solid ${statusColor}40; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 2px;">
        ${statusBadge}
      </div>
      <div style="font-size: 44px; font-weight: 900; color: #ffffff; margin: 8px 0;">
        ${percentage}%
      </div>
      <div style="font-size: 16px; color: #cbd5e1;">
        Final Score: <strong>${score}</strong> / ${maxScore} marks
      </div>
    </div>

    <div class="card-grid">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Examination:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quizTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Subject:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${subject}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Time Taken:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${durationText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Correct Answers:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #10b981; text-align: right;">${correctCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Incorrect Answers:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #f43f5e; text-align: right;">${wrongCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Skipped / Unanswered:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; text-align: right;">${skippedCount}</td>
        </tr>
      </table>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: `Exam Result: ${quizTitle}`,
    subtitle: `Hi ${name}, your evaluation scorecard has been computed and recorded.`,
    badgeText: "Examination Scorecard",
    badgeColor: statusColor,
    contentHtml,
    ctaText: "View Full Detailed Analysis",
    ctaUrl: `${clientUrl}/quiz/result/${attemptId}`,
  });

  return sendMailSafe({
    to,
    subject: `📊 Examination Result: ${quizTitle} — ${percentage}% (${statusBadge})`,
    text: `Hi ${name}, you scored ${percentage}% (${score}/${maxScore}) in ${quizTitle}. Review your breakdown at ${clientUrl}/quiz/result/${attemptId}`,
    html,
  });
};

/**
 * 5. Certificate Issued Notification Email
 */
const sendCertificateEmail = async ({
  to,
  name,
  quizTitle,
  certificateId,
  percentage,
  issueDate = new Date(),
}) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const contentHtml = `
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 36px; margin-bottom: 8px;">🏆</div>
      <div style="font-size: 13px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px;">
        Official Verified Credential
      </div>
      <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 8px 0;">
        Certificate of Excellence
      </div>
      <div style="font-size: 14px; color: #cbd5e1;">
        Awarded to <strong>${name}</strong> for passing <strong>${quizTitle}</strong> with a score of <strong>${percentage}%</strong>.
      </div>
    </div>

    <div class="card-grid">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Certificate ID:</td>
          <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #fbbf24; text-align: right;">${certificateId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Issue Date:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Verification Status:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #10b981; text-align: right;">Globally Verified ✓</td>
        </tr>
      </table>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: "Congratulations! Certificate Issued",
    subtitle: `You have successfully met all passing requirements for ${quizTitle}.`,
    badgeText: "Achievement Unlocked",
    badgeColor: "#f59e0b",
    contentHtml,
    ctaText: "View & Download Certificate",
    ctaUrl: `${clientUrl}/certificates`,
  });

  return sendMailSafe({
    to,
    subject: `🏆 Certificate Awarded: ${quizTitle} — Verified ID: ${certificateId}`,
    text: `Congratulations ${name}! You have been awarded an official certificate for ${quizTitle} (ID: ${certificateId}). View it at ${clientUrl}/certificates`,
    html,
  });
};

/**
 * 6. Live Multiplayer Battle Result Email
 */
const sendCompetitionResultEmail = async ({
  to,
  name,
  roomCode,
  quizTitle = "Multiplayer Live Arena",
  rank,
  totalPlayers,
  score,
  correctCount = 0,
}) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  let rankEmoji = "🎖️";
  let rankText = `#${rank} Contender`;
  let rankColor = "#6366f1";

  if (rank === 1) {
    rankEmoji = "🥇";
    rankText = "1st Place Winner!";
    rankColor = "#f59e0b";
  } else if (rank === 2) {
    rankEmoji = "🥈";
    rankText = "2nd Place Runner-Up";
    rankColor = "#94a3b8";
  } else if (rank === 3) {
    rankEmoji = "🥉";
    rankText = "3rd Place Podium";
    rankColor = "#d97706";
  }

  const contentHtml = `
    <div style="background: ${rankColor}15; border: 1px solid ${rankColor}40; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 36px; margin-bottom: 4px;">${rankEmoji}</div>
      <div style="font-size: 14px; font-weight: 800; color: ${rankColor}; text-transform: uppercase; letter-spacing: 2px;">
        ${rankText}
      </div>
      <div style="font-size: 36px; font-weight: 900; color: #ffffff; margin: 8px 0;">
        ${score} pts
      </div>
      <div style="font-size: 14px; color: #cbd5e1;">
        Live Arena Room: <strong>#${roomCode}</strong>
      </div>
    </div>

    <div class="card-grid">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Battle Arena:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quizTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Final Placement:</td>
          <td style="padding: 8px 0; font-weight: bold; color: ${rankColor}; text-align: right;">#${rank} of ${totalPlayers} players</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Correct Answers:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #10b981; text-align: right;">${correctCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Points Added to Global Board:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #a855f7; text-align: right;">+${score} pts</td>
        </tr>
      </table>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: `Battle Concluded: Room #${roomCode}`,
    subtitle: `Great game, ${name}! The multiplayer match has concluded.`,
    badgeText: "Multiplayer Arena",
    badgeColor: rankColor,
    contentHtml,
    ctaText: "Join Another Live Battle",
    ctaUrl: `${clientUrl}/competitions`,
  });

  return sendMailSafe({
    to,
    subject: `⚡ Live Battle Results: Room #${roomCode} — You Ranked #${rank}!`,
    text: `Hi ${name}, you ranked #${rank} with ${score} points in battle room #${roomCode}. Join next match at ${clientUrl}/competitions`,
    html,
  });
};

/**
 * 7. Verification Test Email
 */
const sendTestEmail = async (to = process.env.EMAIL_USER) => {
  const contentHtml = `
    <div class="card-grid" style="text-align: center;">
      <p style="color: #10b981; font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">
        ✅ SMTP Connection Verified Successfully!
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">
        All 6 notification channels (Welcome, Login, Password Reset, Exam Results, Certificates, and Live Competitions) are now active.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: "EduQuiz Email System is Online",
    subtitle: "Your Gmail SMTP integration is functioning without errors.",
    badgeText: "System Diagnostic",
    badgeColor: "#10b981",
    contentHtml,
    ctaText: "Visit EduQuiz",
    ctaUrl: process.env.CLIENT_URL || "http://localhost:5173",
  });

  return sendMailSafe({
    to,
    subject: "🚀 EduQuiz Email Notification Engine is Online!",
    text: "EduQuiz email system is operating successfully across all notification pipelines.",
    html,
  });
};

/**
 * 8. Live Battle Invitation Email
 */
const sendBattleInviteEmail = async ({
  to,
  hostName = "A classmate",
  roomCode,
  title = "Live Quiz Battle",
  subject = "General Knowledge",
}) => {
  const clientUrl = process.env.CLIENT_URL || "https://edu-quiz-indol.vercel.app";
  const joinUrl = `${clientUrl}/competitions/arena/${roomCode}`;

  const contentHtml = `
    <div class="card-grid">
      <p style="font-size: 15px; margin: 0 0 16px 0;">
        <strong style="color: #f59e0b;">${hostName}</strong> has challenged you to an exciting <strong>1v1 Live Quiz Battle</strong> on EduQuiz!
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Battle Topic:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #38bdf8;">${subject}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Match Title:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Room Code:</td>
          <td style="padding: 8px 0; font-weight: bold; font-family: monospace; font-size: 18px; color: #ec4899; text-align: right;">${roomCode}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; text-align: center;">
        <span style="font-size: 12px; color: #cbd5e1;">Click below or enter code <strong style="color: #ec4899;">${roomCode}</strong> in the lobby to enter the arena.</span>
      </div>
    </div>
  `;

  const html = baseEmailTemplate({
    headline: "You're Invited to a Live Battle!",
    subtitle: `${hostName} is waiting for you in the arena!`,
    badgeText: "Live Battle Challenge",
    badgeColor: "#ec4899",
    contentHtml,
    ctaText: "⚔️ Enter Battle Room Now",
    ctaUrl: joinUrl,
  });

  return sendMailSafe({
    to,
    subject: `⚔️ Battle Challenge: ${hostName} invited you to room #${roomCode}!`,
    text: `${hostName} invited you to a live quiz battle. Join now at: ${joinUrl}`,
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendQuizResultEmail,
  sendCertificateEmail,
  sendCompetitionResultEmail,
  sendBattleInviteEmail,
  sendTestEmail,
};