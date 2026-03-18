const mongoose = require('mongoose');
const Show    = require('../models/Show');
const Seat    = require('../models/Seat');
const Booking = require('../models/Booking');

/* ── Book seats for a show ─────────────────────────────────────────────── */
const bookSeats = async ({ show_id, seat_ids, user_name, user_email, user_phone }) => {
  if (!show_id || !seat_ids?.length || !user_name || !user_email || !user_phone)
    throw { status: 400, message: 'show_id, seat_ids, user_name, user_email, user_phone are required' };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* 1 ── Verify show is active ─────────────────────────────────────── */
    const show = await Show.findOne(
      { _id: show_id, status: 'ACTIVE' },
      null,
      { session }
    );
    if (!show) throw { status: 404, message: 'Show not found or no longer active' };

    /* 2 ── Check capacity ────────────────────────────────────────────── */
    if (show.booked_seats + seat_ids.length > show.total_seats)
      throw { status: 409, message: 'Not enough seats available' };

    /* 3 ── Atomically claim each seat (findOneAndUpdate with status filter) */
    const claimed = [];
    for (const seatId of seat_ids) {
      const seat = await Seat.findOneAndUpdate(
        { _id: seatId, show_id: show_id, status: 'AVAILABLE' },  // ← the lock
        { $set: { status: 'BOOKED' } },
        { new: true, session }
      );
      if (!seat) {
        // This seat was taken — abort everything, release already-claimed seats
        await session.abortTransaction();
        // Record a FAILED booking for audit
        await Booking.create({
          show_id, user_name, user_email, user_phone,
          seat_ids, seat_codes: [],
          total_amount: seat_ids.length * show.price,
          status: 'FAILED',
        });
        return { status: 'FAILED', message: 'One or more seats were just taken by another user', booking: null };
      }
      claimed.push(seat);
    }

    /* 4 ── Increment show.booked_seats atomically ────────────────────── */
    await Show.findByIdAndUpdate(
      show_id,
      { $inc: { booked_seats: seat_ids.length } },
      { session }
    );

    /* 5 ── Create CONFIRMED booking inside the transaction ───────────── */
    const [booking] = await Booking.create(
      [{
        show_id,
        user_name, user_email, user_phone,
        seat_ids:     claimed.map(s => s._id),
        seat_codes:   claimed.map(s => s.seat_code),
        total_amount: claimed.length * show.price,
        status: 'CONFIRMED',
        expires_at: new Date(Date.now() + 365 * 24 * 3600_000),
      }],
      { session }
    );

    await session.commitTransaction();

    // Return a plain object with string `id` for the frontend
    const bookingObj = booking.toObject();
    return {
      status: 'CONFIRMED',
      booking: {
        ...bookingObj,
        id:       bookingObj._id.toString(),
        show_id:  bookingObj.show_id.toString(),
        seat_ids: bookingObj.seat_ids.map(id => id.toString()),
      },
      message: 'Booking confirmed!',
    };

  } catch (err) {
    // Only abort if transaction is still active (not already aborted above)
    if (session.inTransaction()) await session.abortTransaction();
    if (err.status) throw err;
    throw { status: 500, message: 'Booking failed — please try again', detail: err.message };
  } finally {
    session.endSession();
  }
};

/* ── Cancel booking + release seats ─────────────────────────────────────── */
const cancelBooking = async (bookingId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findOne({ _id: bookingId }, null, { session });
    if (!booking) throw { status: 404, message: 'Booking not found' };
    if (!['PENDING','CONFIRMED'].includes(booking.status))
      throw { status: 400, message: `Cannot cancel a booking with status ${booking.status}` };

    booking.status = 'CANCELLED';
    await booking.save({ session });

    // Release seats
    await Seat.updateMany(
      { _id: { $in: booking.seat_ids } },
      { $set: { status: 'AVAILABLE' } },
      { session }
    );

    // Decrement show count
    await Show.findByIdAndUpdate(
      booking.show_id,
      { $inc: { booked_seats: -booking.seat_ids.length } },
      { session }
    );

    await session.commitTransaction();
    return booking;

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    if (err.status) throw err;
    throw { status: 500, message: 'Cancellation failed', detail: err.message };
  } finally {
    session.endSession();
  }
};

/* ── Cron: expire stale PENDING bookings ─────────────────────────────────── */
const expireStaleBookings = async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const stale = await Booking.find(
      { status: 'PENDING', expires_at: { $lt: new Date() } },
      null,
      { session }
    );

    if (stale.length === 0) { await session.commitTransaction(); return; }

    for (const b of stale) {
      b.status = 'FAILED';
      await b.save({ session });

      await Seat.updateMany(
        { _id: { $in: b.seat_ids } },
        { $set: { status: 'AVAILABLE' } },
        { session }
      );

      await Show.findByIdAndUpdate(
        b.show_id,
        { $inc: { booked_seats: -b.seat_ids.length } },
        { session }
      );
    }

    await session.commitTransaction();
    console.log(`[CRON] Expired ${stale.length} stale bookings, seats released`);

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('[CRON] expireStaleBookings failed:', err.message);
  } finally {
    session.endSession();
  }
};

module.exports = { bookSeats, cancelBooking, expireStaleBookings };
