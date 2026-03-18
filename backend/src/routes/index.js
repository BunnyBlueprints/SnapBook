const express = require('express');
const r = express.Router();

const { listShows, getShowById, getShowSeats, createShow, cancelShow, listAllShows } =
  require('../controllers/showController');
const { createBooking, getBookingById, cancelBookingHandler, listAllBookings } =
  require('../controllers/bookingController');
const { validateBody, validateBooking, validateShow } =
  require('../utils/validators');

/* ── Public ── */
r.get('/shows',           listShows);
r.get('/shows/:id',       getShowById);
r.get('/shows/:id/seats', getShowSeats);

r.post('/bookings',       validateBody(validateBooking), createBooking);
r.get('/bookings/:id',    getBookingById);
r.delete('/bookings/:id', cancelBookingHandler);

/* ── Admin ── */
r.get('/admin/shows',         listAllShows);
r.post('/admin/shows',        validateBody(validateShow), createShow);
r.delete('/admin/shows/:id',  cancelShow);
r.get('/admin/bookings',      listAllBookings);

r.get('/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Modex Ticket API (MongoDB)' })
);

module.exports = r;
