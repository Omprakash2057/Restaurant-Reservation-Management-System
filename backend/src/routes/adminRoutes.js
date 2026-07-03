const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllReservations,
  adminUpdateReservation,
  adminCancelReservation,
} = require('../controllers/reservationController');
const {
  getAllTablesAdmin,
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// Reservations management
router.get('/reservations', getAllReservations);
router.put('/reservations/:id', adminUpdateReservation);
router.patch('/reservations/:id/cancel', adminCancelReservation);

// Table management
router.get('/tables', getAllTablesAdmin);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);

module.exports = router;
