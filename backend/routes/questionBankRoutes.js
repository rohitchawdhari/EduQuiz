const express = require("express");
const router = express.Router();
const {
  createBank,
  getBanks,
  getBankById,
  uploadToBank,
  addManualQuestion,
  updateBank,
  deleteBank,
  deleteQuestion,
  updateQuestion,
} = require("../controllers/questionBankController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.route("/")
  .post(protect, authorize("teacher", "admin"), createBank)
  .get(protect, getBanks);

router.route("/:id")
  .get(protect, getBankById)
  .put(protect, authorize("teacher", "admin"), updateBank)
  .delete(protect, authorize("teacher", "admin"), deleteBank);

router.post(
  "/:id/upload",
  protect,
  authorize("teacher", "admin"),
  upload.single("file"),
  uploadToBank
);

router.post(
  "/:id/questions",
  protect,
  authorize("teacher", "admin"),
  addManualQuestion
);

router.route("/questions/:questionId")
  .put(protect, authorize("teacher", "admin"), updateQuestion)
  .delete(protect, authorize("teacher", "admin"), deleteQuestion);

module.exports = router;
