const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  getUserDetails,
  toggleBlockUser,
  changeUserRole,
  deleteUser,
  getAllQuizzesAdmin,
  deleteQuizAdmin,
  getAllAttemptsAdmin,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All admin routes strictly require authentication and 'admin' role
router.use(protect, authorize("admin"));

// Statistics & Metrics
router.get("/stats", getAdminStats);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/block", toggleBlockUser);
router.put("/users/:id/role", changeUserRole);
router.delete("/users/:id", deleteUser);

// Quiz Oversight & Moderation
router.get("/quizzes", getAllQuizzesAdmin);
router.delete("/quizzes/:id", deleteQuizAdmin);

// System Audit Activity Log
router.get("/attempts", getAllAttemptsAdmin);

module.exports = router;
