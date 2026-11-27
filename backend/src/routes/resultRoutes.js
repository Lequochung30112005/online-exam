const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyHistory, getResultDetail } = require('../controllers/resultController');

router.get('/my-history', protect, getMyHistory);
router.get('/:id', protect, getResultDetail);

module.exports = router;