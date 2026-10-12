const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.get('/due', reminderController.getDueReminders);
router.get('/logs', reminderController.getReminderLogs);
router.post('/trigger-manual', reminderController.triggerManualReminder);
router.post('/trigger-cron-now', reminderController.triggerCronPass);

module.exports = router;
