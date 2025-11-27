// routes/reminders.js
const express = require("express");
const router = express.Router();
const {
  setReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  deactivateReminder,
  getUpcomingReminders,
} = require("../controllers/remindersController");

router.post("/set-reminder", setReminder);
router.get("/get-all-reminders/:deviceId", getReminders);
router.get("/get-all-upcoming-reminders", getUpcomingReminders);
router.put("/update-reminder/:id", updateReminder);
router.delete("/delete-reminder/:id", deleteReminder);
router.patch("/:id/deactivate-reminder", deactivateReminder);

module.exports = router;
