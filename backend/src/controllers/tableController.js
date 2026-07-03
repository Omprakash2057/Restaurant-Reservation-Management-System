const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all active tables (used by customers to know options)
// @route   GET /api/tables
// @access  Private
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
  res.status(200).json({ success: true, data: tables });
});

// @desc    Get tables available for a specific date + time slot + guest count
// @route   GET /api/tables/availability?date=YYYY-MM-DD&timeSlot=...&guests=2
// @access  Private
const getAvailability = asyncHandler(async (req, res) => {
  const { date, timeSlot, guests } = req.query;

  if (!date || !timeSlot) {
    res.status(400);
    throw new Error('date and timeSlot query parameters are required');
  }

  const guestCount = guests ? Number(guests) : 1;
  if (Number.isNaN(guestCount) || guestCount < 1) {
    res.status(400);
    throw new Error('guests must be a positive number');
  }

  // All active tables with enough capacity
  const candidateTables = await Table.find({
    isActive: true,
    capacity: { $gte: guestCount },
  }).sort({ capacity: 1 });

  // Tables already booked (confirmed) for that date + slot
  const bookedReservations = await Reservation.find({
    date,
    timeSlot,
    status: 'confirmed',
  }).select('table');

  const bookedTableIds = new Set(bookedReservations.map((r) => r.table.toString()));

  const availableTables = candidateTables.filter(
    (t) => !bookedTableIds.has(t._id.toString())
  );

  res.status(200).json({ success: true, data: availableTables });
});

// @desc    Create a new table
// @route   POST /api/admin/tables
// @access  Private/Admin
const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity } = req.body;

  if (tableNumber === undefined || capacity === undefined) {
    res.status(400);
    throw new Error('tableNumber and capacity are required');
  }

  const table = await Table.create({ tableNumber, capacity });
  res.status(201).json({ success: true, data: table });
});

// @desc    Update a table (capacity, active status)
// @route   PUT /api/admin/tables/:id
// @access  Private/Admin
const updateTable = asyncHandler(async (req, res) => {
  const { capacity, isActive, tableNumber } = req.body;

  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error('Table not found');
  }

  if (capacity !== undefined) table.capacity = capacity;
  if (isActive !== undefined) table.isActive = isActive;
  if (tableNumber !== undefined) table.tableNumber = tableNumber;

  await table.save();

  res.status(200).json({ success: true, data: table });
});

// @desc    Delete (deactivate) a table
// @route   DELETE /api/admin/tables/:id
// @access  Private/Admin
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error('Table not found');
  }

  // Soft delete to preserve reservation history integrity
  table.isActive = false;
  await table.save();

  res.status(200).json({ success: true, message: 'Table deactivated successfully' });
});

// @desc    List all tables including inactive ones (admin view)
// @route   GET /api/admin/tables
// @access  Private/Admin
const getAllTablesAdmin = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });
  res.status(200).json({ success: true, data: tables });
});

module.exports = {
  getTables,
  getAvailability,
  createTable,
  updateTable,
  deleteTable,
  getAllTablesAdmin,
};
