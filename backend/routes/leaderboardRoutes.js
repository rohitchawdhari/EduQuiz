const express = require("express");
const router = express.Router();
const {
  getGlobalLeaderboard,
  getSubjectLeaderboard,
  getCompetitionLeaderboard,
} = require("../controllers/leaderboardController");

router.get("/global", getGlobalLeaderboard);
router.get("/subject/:subject", getSubjectLeaderboard);
router.get("/competitions", getCompetitionLeaderboard);

module.exports = router;
