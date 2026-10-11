const express = require("express");
const router = express.Router();
const {
  createCompetition,
  getCompetitionByCode,
  getCompetitions,
  inviteOpponentByEmail,
} = require("../controllers/competitionController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createCompetition)
  .get(protect, getCompetitions);

router.post("/create", protect, createCompetition);
router.post("/invite", protect, inviteOpponentByEmail);
router.get("/code/:code", protect, getCompetitionByCode);

module.exports = router;
