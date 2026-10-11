const Competition = require("../models/Competition");
const User = require("../models/User");
const { sendCompetitionResultEmail } = require("../services/emailService");

// Active server-side synchronized room timers: roomCode -> { timeout, deadline, questionIndex }
const activeRoomTimers = new Map();

/**
 * Helper to emit a complete, sanitized, stringified room update
 */
const emitRoomUpdated = (io, competition) => {
  io.to(competition.roomCode).emit("room_updated", {
    competitionId: competition._id,
    roomCode: competition.roomCode,
    title: competition.title,
    subject: competition.subject,
    status: competition.status,
    hostId: competition.host ? competition.host.toString() : null,
    players: competition.players.map((p) => ({
      user: p.user ? p.user.toString() : p.socketId,
      name: p.name || "Competitor",
      isReady: !!p.isReady,
      score: p.score || 0,
      correctCount: p.correctCount || 0,
      socketId: p.socketId,
    })),
  });
};

const registerCompetitionHandlers = (io, socket) => {
  // 1. Join Competition Room
  socket.on("join_room", async ({ roomCode, userId: fallbackId, name: fallbackName }) => {
    try {
      const code = roomCode.trim().toUpperCase();
      const competition = await Competition.findOne({ roomCode: code });

      if (!competition) {
        return socket.emit("error_message", "Room not found");
      }

      if (competition.status === "COMPLETED") {
        return socket.emit("error_message", "This competition has already finished");
      }

      // SECURITY: Prefer authenticated socket user ID, fallback to provided ID
      const verifiedUserId = socket.userId || fallbackId;
      if (!verifiedUserId) {
        return socket.emit("error_message", "Authentication required to join room");
      }

      // Fetch user profile for name accuracy
      let playerName = fallbackName || "Scholar";
      const dbUser = await User.findById(verifiedUserId);
      if (dbUser) playerName = dbUser.name;

      socket.join(code);
      socket.roomCode = code;
      socket.verifiedUserId = verifiedUserId;

      // Find player by user ID
      const existingPlayerIndex = competition.players.findIndex(
        (p) => p.user && p.user.toString() === verifiedUserId.toString()
      );

      if (existingPlayerIndex === -1) {
        if (competition.players.length >= competition.maxPlayers) {
          return socket.emit("error_message", "Room is already full!");
        }
        competition.players.push({
          user: verifiedUserId,
          name: playerName,
          socketId: socket.id,
          isReady: false,
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          totalTimeTakenSeconds: 0,
        });
      } else {
        // Update existing player's active socketId and name
        competition.players[existingPlayerIndex].socketId = socket.id;
        competition.players[existingPlayerIndex].name = playerName;
      }

      // STRICT DEDUPLICATION: Purge any duplicate player entries across the room
      const uniquePlayersMap = new Map();
      for (const pl of competition.players) {
        const uKey = pl.user ? pl.user.toString() : null;
        if (uKey && !uniquePlayersMap.has(uKey)) {
          uniquePlayersMap.set(uKey, pl);
        }
      }
      competition.players = Array.from(uniquePlayersMap.values());
      await competition.save();

      // Broadcast room update to all players
      emitRoomUpdated(io, competition);

      console.log(`⚡ Player ${playerName} joined room ${code}`);
    } catch (error) {
      console.error("Socket join_room error:", error);
      socket.emit("error_message", error.message);
    }
  });

  // 2. Toggle Ready Status
  socket.on("toggle_ready", async ({ roomCode, userId: fallbackId }) => {
    try {
      const code = roomCode.trim().toUpperCase();
      const verifiedUserId = socket.verifiedUserId || socket.userId || fallbackId;
      const competition = await Competition.findOne({ roomCode: code });
      if (!competition) return;

      const player = competition.players.find(
        (p) => p.user && p.user.toString() === verifiedUserId.toString()
      );
      if (player) {
        player.isReady = !player.isReady;
        await competition.save();

        emitRoomUpdated(io, competition);
      }
    } catch (error) {
      console.error("Socket toggle_ready error:", error);
    }
  });

  // 3. Host starts quiz
  socket.on("start_quiz", async ({ roomCode, hostId: fallbackHostId }) => {
    try {
      const code = roomCode.trim().toUpperCase();
      const verifiedUserId = socket.verifiedUserId || socket.userId || fallbackHostId;
      const competition = await Competition.findOne({ roomCode: code });
      if (!competition) return;

      // SECURITY: Verify that caller is the true room host
      if (competition.host.toString() !== verifiedUserId.toString()) {
        return socket.emit("error_message", "Only the host can start the competition");
      }

      competition.status = "IN_PROGRESS";
      competition.currentQuestionIndex = 0;
      await competition.save();

      // Launch 1st question with server-side countdown
      dispatchQuestionWithServerTimer(io, code, 0);
    } catch (error) {
      console.error("Socket start_quiz error:", error);
    }
  });

  // 4. Submit Answer for current question
  socket.on(
    "submit_answer",
    async ({ roomCode, userId: fallbackId, questionIndex, selectedOption }) => {
      try {
        const code = roomCode.trim().toUpperCase();
        const verifiedUserId = socket.verifiedUserId || socket.userId || fallbackId;
        const competition = await Competition.findOne({ roomCode: code });
        if (!competition) return;

        const currentQ = competition.questions[questionIndex];
        if (!currentQ) return;

        const player = competition.players.find(
          (p) => p.user.toString() === verifiedUserId.toString()
        );
        if (!player) return;

        // Prevent double submit for same question
        const alreadyAnswered = player.answers.some((a) => a.questionIndex === questionIndex);
        if (alreadyAnswered) return;

        // SECURE SERVER-SIDE TIMING: Calculate time remaining from server deadline
        const roomTimer = activeRoomTimers.get(code);
        let serverTimeRemaining = 0;
        if (roomTimer) {
          serverTimeRemaining = Math.max(0, Math.round((roomTimer.deadline - Date.now()) / 1000));
        }

        const timeTaken = (competition.perQuestionTimeSeconds || 20) - serverTimeRemaining;
        player.totalTimeTakenSeconds = (player.totalTimeTakenSeconds || 0) + timeTaken;

        const isCorrect = selectedOption === currentQ.correctAnswer;
        const baseScore = 100;
        // Speed bonus derived purely from server clock!
        const speedBonus = isCorrect ? Math.round(serverTimeRemaining * 2.5) : 0;
        const points = isCorrect ? baseScore + speedBonus : -20;

        player.score = Math.max(0, player.score + points);
        if (isCorrect) player.correctCount += 1;
        else player.wrongCount += 1;

        player.answers.push({
          questionIndex,
          selectedOption,
          isCorrect,
          timeTaken,
          pointsEarned: points,
        });

        await competition.save();

        // Sort leaderboard with Tie-Breaker: Score -> Correct Count -> Least Time Taken
        const sortedLeaderboard = getSortedLeaderboard(competition.players);

        // Emit live score update to room
        io.to(code).emit("live_leaderboard_update", {
          leaderboard: sortedLeaderboard,
          lastAnsweredBy: player.name,
          isCorrect,
        });
      } catch (error) {
        console.error("Socket submit_answer error:", error);
      }
    }
  );

  // 5. Host advances to Next Question
  socket.on("next_question", async ({ roomCode }) => {
    try {
      const code = roomCode.trim().toUpperCase();
      const verifiedUserId = socket.verifiedUserId || socket.userId;
      const competition = await Competition.findOne({ roomCode: code });
      if (!competition) return;

      // SECURITY: Host check
      if (verifiedUserId && competition.host.toString() !== verifiedUserId.toString()) {
        return socket.emit("error_message", "Only the host can advance to the next question");
      }

      // Clear existing timer if any
      const existingTimer = activeRoomTimers.get(code);
      if (existingTimer && existingTimer.timeout) {
        clearTimeout(existingTimer.timeout);
      }

      const nextIndex = competition.currentQuestionIndex + 1;
      if (nextIndex < competition.questions.length) {
        dispatchQuestionWithServerTimer(io, code, nextIndex);
      } else {
        finishCompetition(io, code);
      }
    } catch (error) {
      console.error("Socket next_question error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
};

/**
 * Dispatch Question with True Synchronized Server-Side Timer
 */
const dispatchQuestionWithServerTimer = async (io, roomCode, questionIndex) => {
  const competition = await Competition.findOne({ roomCode });
  if (!competition) return;

  const currentQ = competition.questions[questionIndex];
  if (!currentQ) return;

  competition.currentQuestionIndex = questionIndex;
  competition.status = "IN_PROGRESS";
  await competition.save();

  const perQuestionSeconds = competition.perQuestionTimeSeconds || 20;
  const deadline = Date.now() + perQuestionSeconds * 1000;

  // Clear previous timer if any
  const prevTimer = activeRoomTimers.get(roomCode);
  if (prevTimer && prevTimer.timeout) {
    clearTimeout(prevTimer.timeout);
  }

  // Set automatic question expiration timeout on server
  const timeout = setTimeout(async () => {
    // When time expires on server:
    io.to(roomCode).emit("question_time_expired", { questionIndex });

    // Wait 3 seconds for players to view round result, then auto-advance
    setTimeout(async () => {
      const comp = await Competition.findOne({ roomCode });
      if (comp && comp.status !== "COMPLETED") {
        const nextIdx = questionIndex + 1;
        if (nextIdx < comp.questions.length) {
          dispatchQuestionWithServerTimer(io, roomCode, nextIdx);
        } else {
          finishCompetition(io, roomCode);
        }
      }
    }, 3500);
  }, perQuestionSeconds * 1000);

  activeRoomTimers.set(roomCode, { timeout, deadline, questionIndex });

  // Sanitize question payload
  const questionPayload = {
    questionIndex,
    totalQuestions: competition.questions.length,
    questionText: currentQ.questionText,
    options: currentQ.options,
    difficulty: currentQ.difficulty,
    perQuestionTimeSeconds: perQuestionSeconds,
    serverDeadline: deadline,
    timestamp: Date.now(),
  };

  io.to(roomCode).emit("question_started", questionPayload);
};

/**
 * Helper: Sort leaderboard with 3-tier tie breaker
 */
const getSortedLeaderboard = (players) => {
  return [...players]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
    })
    .map((p, idx) => ({
      userId: p.user,
      name: p.name,
      score: p.score,
      correctCount: p.correctCount,
      totalTime: p.totalTimeTakenSeconds,
      rank: idx + 1,
    }));
};

/**
 * Helper: Finish competition, declare winner, update user totalPoints
 */
const finishCompetition = async (io, roomCode) => {
  // Clear any running timers
  const timerData = activeRoomTimers.get(roomCode);
  if (timerData && timerData.timeout) {
    clearTimeout(timerData.timeout);
  }
  activeRoomTimers.delete(roomCode);

  const competition = await Competition.findOne({ roomCode });
  if (!competition) return;

  competition.status = "COMPLETED";

  // Sort with complete tie-breaker
  const sortedPlayers = [...competition.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
  });

  if (sortedPlayers.length > 0) {
    competition.winner = {
      user: sortedPlayers[0].user,
      name: sortedPlayers[0].name,
      score: sortedPlayers[0].score,
    };
  }

  // Update stats & totalPoints for ALL players
  for (let idx = 0; idx < sortedPlayers.length; idx++) {
    const pl = sortedPlayers[idx];
    const u = await User.findById(pl.user);
    if (u) {
      u.stats.competitionsPlayed = (u.stats.competitionsPlayed || 0) + 1;
      u.stats.totalPoints = (u.stats.totalPoints || 0) + (pl.score || 0);
      if (idx === 0) {
        u.stats.competitionsWon = (u.stats.competitionsWon || 0) + 1;
      }
      await u.save();

      // Dispatch Live Competition Result Email asynchronously
      if (u.email) {
        sendCompetitionResultEmail({
          to: u.email,
          name: u.name,
          roomCode,
          quizTitle: competition.title || "Live Battle Arena",
          rank: idx + 1,
          totalPlayers: sortedPlayers.length,
          score: pl.score || 0,
          correctCount: pl.correctCount || 0,
        }).catch((err) => console.error("Competition result email error:", err.message));
      }
    }
  }

  await competition.save();

  io.to(roomCode).emit("competition_finished", {
    winner: competition.winner,
    podium: sortedPlayers.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      score: p.score,
      correctCount: p.correctCount,
    })),
    fullResults: sortedPlayers,
  });
};

module.exports = {
  registerCompetitionHandlers,
};
