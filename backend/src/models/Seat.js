const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    seat_code: { type: String, required: true },   // e.g. "A1", "B12"
    row_label: { type: String, required: true },   // e.g. "A"
    seat_num:  { type: Number, required: true },   // e.g. 1
    status:    { type: String, enum: ['AVAILABLE','BOOKED'], default: 'AVAILABLE' },
  },
  { timestamps: false }
);

// Composite unique: no duplicate seat codes per show
seatSchema.index({ show_id: 1, seat_code: 1 }, { unique: true });
// Query pattern: "all available seats for show X"
seatSchema.index({ show_id: 1, status: 1 });

module.exports = mongoose.model('Seat', seatSchema);
