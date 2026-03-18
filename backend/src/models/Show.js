const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    type:        { type: String, enum: ['MOVIE','BUS','CONCERT','SPORT','OTHER'], default: 'MOVIE' },
    venue:       { type: String, trim: true },
    description: { type: String },
    start_time:  { type: Date, required: true },
    end_time:    { type: Date },
    total_seats: { type: Number, required: true, min: 1, max: 500 },
    booked_seats:{ type: Number, default: 0, min: 0 },
    price:       { type: Number, required: true, min: 0, default: 0 },
    poster_url:  { type: String },
    status:      { type: String, enum: ['ACTIVE','CANCELLED','COMPLETED'], default: 'ACTIVE' },
  },
  { timestamps: true }   // adds createdAt / updatedAt automatically
);

// Virtual: available_seats
showSchema.virtual('available_seats').get(function () {
  return this.total_seats - this.booked_seats;
});

showSchema.set('toJSON',   { virtuals: true });
showSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Show', showSchema);
