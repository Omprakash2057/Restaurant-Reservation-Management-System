const express = require('express');
const { getTables, getAvailability } = require('../controllers/tableController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getTables);
router.get('/availability', protect, getAvailability);

module.exports = router;
