const Booking = require('../models/Booking');
const { bookSeats, cancelBooking } = require('../services/bookingService');

const fmtBooking = (b) => {
  const obj = b.toObject ? b.toObject() : b;
  const { _id, __v, show_id, ...rest } = obj;
  return {
    id:         _id.toString(),
    show_id:    (show_id?._id || show_id)?.toString(),
    show_name:  show_id?.name,
    show_type:  show_id?.type,
    venue:      show_id?.venue,
    start_time: show_id?.start_time,
    price:      show_id?.price,
    ...rest,
    seat_ids:   (rest.seat_ids || []).map(id => id.toString()),
  };
};

/* POST /api/bookings */
const createBooking = async (req, res, next) => {
  try {
    const result = await bookSeats(req.body);
    const code = result.status === 'CONFIRMED' ? 201 : 409;
    const booking = result.booking ? fmtBooking(result.booking) : null;
    res.status(code).json({ success: result.status === 'CONFIRMED', status: result.status, message: result.message, booking });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/* GET /api/bookings/:id */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('show_id', 'name type venue start_time price');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: fmtBooking(booking) });
  } catch (err) { next(err); }
};

/* DELETE /api/bookings/:id */
const cancelBookingHandler = async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id);
    res.json({ success: true, data: fmtBooking(booking), message: 'Booking cancelled' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/* GET /api/admin/bookings */
const listAllBookings = async (req, res, next) => {
  try {
    const { show_id, status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (show_id) filter.show_id = show_id;
    if (status)  filter.status  = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('show_id', 'name type start_time'),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: bookings.map(fmtBooking),
      pagination: { page: +page, limit: +limit, total },
    });
  } catch (err) { next(err); }
};

module.exports = { createBooking, getBookingById, cancelBookingHandler, listAllBookings };
