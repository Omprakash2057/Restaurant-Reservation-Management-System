const express = require('express');
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('customer', 'admin'), createReservation);
router.get('/my', protect, authorize('customer', 'admin'), getMyReservations);
router.patch('/:id/cancel', protect, authorize('customer', 'admin'), cancelMyReservation);

module.exports = router;
