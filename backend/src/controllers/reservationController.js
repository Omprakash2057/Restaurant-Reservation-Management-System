const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_TIME_SLOTS = Reservation.TIME_SLOTS;

// @desc    Create a reservation (customer)
// @route   POST /api/reservations
// @access  Private/Customer
const createReservation = asyncHandler(async (req, res) => {
  const { tableId, date, timeSlot, guests } = req.body;

  if (!tableId || !date || !timeSlot || !guests) {
    res.status(400);
    throw new Error('tableId, date, timeSlot, and guests are required');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400);
    throw new Error('date must be in YYYY-MM-DD format');
  }

  if (!VALID_TIME_SLOTS.includes(timeSlot)) {
    res.status(400);
    throw new Error(`timeSlot must be one of: ${VALID_TIME_SLOTS.join(', ')}`);
  }

  const guestCount = Number(guests);
  if (Number.isNaN(guestCount) || guestCount < 1) {
    res.status(400);
    throw new Error('guests must be a positive number');
  }

  // Prevent booking in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(`${date}T00:00:00`);
  if (reservationDate < today) {
    res.status(400);
    throw new Error('Cannot create a reservation for a past date');
  }

  const table = await Table.findById(tableId);
  if (!table || !table.isActive) {
    res.status(404);
    throw new Error('Table not found or inactive');
  }

  if (guestCount > table.capacity) {
    res.status(400);
    throw new Error(
      `Table ${table.tableNumber} only seats ${table.capacity} guests, but ${guestCount} were requested`
    );
  }

  // Conflict check: same table, same date, same time slot, still confirmed
  const conflict = await Reservation.findOne({
    table: tableId,
    date,
    timeSlot,
    status: 'confirmed',
  });

  if (conflict) {
    res.status(409);
    throw new Error('This table is already booked for the selected date and time slot');
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    table: tableId,
    date,
    timeSlot,
    guests: guestCount,
  });

  const populated = await reservation.populate('table', 'tableNumber capacity');

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get the logged-in customer's own reservations
// @route   GET /api/reservations/my
// @access  Private/Customer
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate('table', 'tableNumber capacity')
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({ success: true, data: reservations });
});

// @desc    Cancel own reservation
// @route   PATCH /api/reservations/:id/cancel
// @access  Private/Customer
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  if (reservation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to cancel this reservation');
  }

  if (reservation.status === 'cancelled') {
    res.status(400);
    throw new Error('Reservation is already cancelled');
  }

  reservation.status = 'cancelled';
  await reservation.save();

  res.status(200).json({ success: true, data: reservation });
});

// ---------------------- ADMIN ACTIONS ----------------------

// @desc    Get all reservations, optional ?date=YYYY-MM-DD and ?status= filters
// @route   GET /api/admin/reservations
// @access  Private/Admin
const getAllReservations = asyncHandler(async (req, res) => {
  const { date, status } = req.query;

  const filter = {};
  if (date) filter.date = date;
  if (status) filter.status = status;

  const reservations = await Reservation.find(filter)
    .populate('table', 'tableNumber capacity')
    .populate('user', 'name email')
    .sort({ date: -1, timeSlot: 1 });

  res.status(200).json({ success: true, data: reservations });
});

// @desc    Admin updates any reservation (date, timeSlot, guests, table, status)
// @route   PUT /api/admin/reservations/:id
// @access  Private/Admin
const adminUpdateReservation = asyncHandler(async (req, res) => {
  const { date, timeSlot, guests, tableId, status } = req.body;

  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  const nextDate = date || reservation.date;
  const nextTimeSlot = timeSlot || reservation.timeSlot;
  const nextTableId = tableId || reservation.table.toString();
  const nextGuests = guests !== undefined ? Number(guests) : reservation.guests;

  if (timeSlot && !VALID_TIME_SLOTS.includes(timeSlot)) {
    res.status(400);
    throw new Error(`timeSlot must be one of: ${VALID_TIME_SLOTS.join(', ')}`);
  }

  const table = await Table.findById(nextTableId);
  if (!table) {
    res.status(404);
    throw new Error('Table not found');
  }

  if (nextGuests > table.capacity) {
    res.status(400);
    throw new Error(`Table ${table.tableNumber} only seats ${table.capacity} guests`);
  }

  // Check for conflicts with other reservations (excluding this one)
  if (date || timeSlot || tableId) {
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      table: nextTableId,
      date: nextDate,
      timeSlot: nextTimeSlot,
      status: 'confirmed',
    });

    if (conflict) {
      res.status(409);
      throw new Error('Another reservation already exists for that table, date, and time slot');
    }
  }

  reservation.date = nextDate;
  reservation.timeSlot = nextTimeSlot;
  reservation.table = nextTableId;
  reservation.guests = nextGuests;
  if (status && ['confirmed', 'cancelled'].includes(status)) {
    reservation.status = status;
  }

  await reservation.save();
  const populated = await reservation.populate('table', 'tableNumber capacity');

  res.status(200).json({ success: true, data: populated });
});

// @desc    Admin cancels any reservation
// @route   PATCH /api/admin/reservations/:id/cancel
// @access  Private/Admin
const adminCancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  reservation.status = 'cancelled';
  await reservation.save();

  res.status(200).json({ success: true, data: reservation });
});

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  adminUpdateReservation,
  adminCancelReservation,
  VALID_TIME_SLOTS,
};
