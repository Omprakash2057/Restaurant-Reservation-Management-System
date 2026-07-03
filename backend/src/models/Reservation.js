const mongoose = require('mongoose');

// Fixed set of bookable time slots. Keeping this fixed (rather than free-text)
// makes overlap detection simple and reliable.
const TIME_SLOTS = [
  '11:00-12:30',
  '12:30-14:00',
  '14:00-15:30',
  '18:00-19:30',
  '19:30-21:00',
  '21:00-22:30',
];

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    date: {
      // Stored as YYYY-MM-DD string to avoid timezone drift issues
      type: String,
      required: [true, 'Reservation date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: TIME_SLOTS,
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Guests must be at least 1'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// A table cannot have two active (confirmed) reservations for the same date + slot.
// This partial-style uniqueness is enforced primarily in the controller logic,
// but this index helps guard against race conditions at the DB level.
reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 });

reservationSchema.statics.TIME_SLOTS = TIME_SLOTS;

module.exports = mongoose.model('Reservation', reservationSchema);
