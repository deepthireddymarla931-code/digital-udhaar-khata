const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/parse-nlp', aiController.parseNlp);
router.post('/generate-reminder', aiController.generateReminder);
router.get('/risk-assessment/:id', aiController.riskAssessment);
router.get('/cashflow-insights', aiController.cashflowInsights);

module.exports = router;
