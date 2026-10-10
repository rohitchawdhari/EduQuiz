const express = require("express");
const router = express.Router();
const {
  createCompetition,
  getCompetitionByCode,
  getCompetitions,
} = require("../controllers/competitionController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createCompetition)
  .get(protect, getCompetitions);

router.post("/create", protect, createCompetition);
router.get("/code/:code", protect, getCompetitionByCode);

module.exports = router;
