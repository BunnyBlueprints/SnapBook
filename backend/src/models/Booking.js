const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    show_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    user_name:    { type: String, required: true, trim: true },
    user_email:   { type: String, required: true, trim: true, lowercase: true },
    user_phone:   { type: String, required: true, trim: true },
    seat_ids:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
    seat_codes:   [{ type: String }],                // e.g. ["A1","A2"]
    total_amount: { type: Number, required: true, min: 0 },
    status:       {
      type: String,
      enum: ['PENDING','CONFIRMED','FAILED','CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
