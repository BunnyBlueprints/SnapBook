const mongoose = require('mongoose');
const Show = require('../models/Show');
const Seat = require('../models/Seat');

/* Convert a Mongoose lean doc so _id becomes a plain `id` string */
const fmt = (doc) => {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};
const fmtAll = (docs) => docs.map(fmt);

const generateSeats = (showId, totalSeats, type) => {
  const perRow = type === 'BUS' ? 4 : 10;
  const seats  = [];
  let count = 0;
  for (let r = 0; count < totalSeats; r++) {
    const row = String.fromCharCode(65 + r);
    for (let n = 1; n <= perRow && count < totalSeats; n++, count++) {
      seats.push({ show_id: showId, seat_code: `${row}${n}`, row_label: row, seat_num: n });
    }
  }
  return seats;
};

/* GET /api/shows */
const listShows = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const filter = { status: 'ACTIVE', start_time: { $gt: new Date() } };
    if (type)   filter.type = type;
    if (search) filter.$or  = [
      { name:  { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } },
    ];
    const raw = await Show.find(filter).sort({ start_time: 1 }).lean();
    const shows = raw.map(s => ({
      ...fmt(s),
      available_seats: s.total_seats - s.booked_seats,
    }));
    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
};

/* GET /api/shows/:id */
const getShowById = async (req, res, next) => {
  try {
    const raw = await Show.findById(req.params.id).lean();
    if (!raw) return res.status(404).json({ success: false, message: 'Show not found' });
    res.json({ success: true, data: { ...fmt(raw), available_seats: raw.total_seats - raw.booked_seats } });
  } catch (err) { next(err); }
};

/* GET /api/shows/:id/seats */
const getShowSeats = async (req, res, next) => {
  try {
    const raw = await Seat.find({ show_id: req.params.id })
      .sort({ row_label: 1, seat_num: 1 })
      .lean();
    const seats = raw.map(s => ({
      id:        s._id.toString(),
      show_id:   s.show_id.toString(),
      seat_code: s.seat_code,
      row_label: s.row_label,
      seat_num:  s.seat_num,
      status:    s.status,
    }));
    res.json({ success: true, data: seats });
  } catch (err) { next(err); }
};

/* POST /api/admin/shows */
const createShow = async (req, res, next) => {
  try {
    const { name, type, venue, description, start_time, end_time, total_seats, price, poster_url } = req.body;
    const show = await Show.create({
      name, type: type || 'MOVIE', venue, description,
      start_time, end_time, total_seats, price: price || 0, poster_url,
    });
    const seats = generateSeats(show._id, total_seats, show.type);
    await Seat.insertMany(seats);
    const raw  = show.toObject();
    res.status(201).json({
      success: true,
      data: { ...fmt(raw), available_seats: raw.total_seats - raw.booked_seats },
      message: 'Show created successfully',
    });
  } catch (err) { next(err); }
};

/* DELETE /api/admin/shows/:id */
const cancelShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      { show_id: req.params.id, status: { $in: ['PENDING', 'CONFIRMED'] } },
      { status: 'CANCELLED' }
    );
    res.json({ success: true, data: fmt(show.toObject()), message: 'Show cancelled' });
  } catch (err) { next(err); }
};

/* GET /api/admin/shows */
const listAllShows = async (req, res, next) => {
  try {
    const raw = await Show.find().sort({ createdAt: -1 }).lean();
    const shows = raw.map(s => ({ ...fmt(s), available_seats: s.total_seats - s.booked_seats }));
    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
};

module.exports = { listShows, getShowById, getShowSeats, createShow, cancelShow, listAllShows };
