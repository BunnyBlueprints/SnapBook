require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const mongoose  = require('mongoose');
const Show    = require('../models/Show');
const Seat    = require('../models/Seat');
const Booking = require('../models/Booking');
const { bookSeats, cancelBooking } = require('../services/bookingService');

const PASS = '\x1b[32m✓\x1b[0m', FAIL = '\x1b[31m✗\x1b[0m';
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { console.log(`  ${PASS} ${msg}`); pass++; } else { console.log(`  ${FAIL} ${msg}`); fail++; } };

const makeShow = async (seats) => {
  const show = await Show.create({ name: 'Test Show', type: 'MOVIE', start_time: new Date(Date.now() + 86400000), total_seats: seats, price: 100 });
  const perRow = 10;
  const docs = [];
  for (let i = 0; i < seats; i++) {
    const row = String.fromCharCode(65 + Math.floor(i / perRow));
    const num = (i % perRow) + 1;
    docs.push({ show_id: show._id, seat_code: `${row}${num}`, row_label: row, seat_num: num });
  }
  await Seat.insertMany(docs);
  const seatDocs = await Seat.find({ show_id: show._id });
  return { showId: show._id.toString(), seatIds: seatDocs.map(s => s._id.toString()) };
};

const clean = async (showId) => {
  await Booking.deleteMany({ show_id: showId });
  await Seat.deleteMany({ show_id: showId });
  await Show.findByIdAndDelete(showId);
};

const user = i => ({ user_name: `User ${i}`, user_email: `u${i}@test.com`, user_phone: `9${String(i).padStart(9,'0')}` });

const run = async () => {
  await connectDB();
  console.log('\n\x1b[1m🎟  Modex Concurrency Test Suite (MongoDB)\x1b[0m\n');

  // Test 1 — basic happy path
  console.log('Test 1: Basic single booking');
  const s1 = await makeShow(10);
  const r1 = await bookSeats({ show_id: s1.showId, seat_ids: [s1.seatIds[0]], ...user(1) });
  ok(r1.status === 'CONFIRMED', 'Single booking confirmed');
  ok(r1.booking.seat_codes.length === 1, 'One seat code in booking');
  await clean(s1.showId);

  // Test 2 — 10 concurrent on same seat → only 1 wins
  console.log('\nTest 2: 10 concurrent requests on same single seat');
  const s2 = await makeShow(5);
  const res2 = await Promise.allSettled(
    Array.from({ length: 10 }, (_, i) =>
      bookSeats({ show_id: s2.showId, seat_ids: [s2.seatIds[0]], ...user(10 + i) })
    )
  );
  const v2 = res2.map(r => r.status === 'fulfilled' ? r.value : { status: 'ERROR' });
  ok(v2.filter(r => r.status === 'CONFIRMED').length === 1, 'Exactly 1 CONFIRMED');
  ok(v2.filter(r => r.status === 'FAILED').length   === 9, 'Exactly 9 FAILED');
  const show2 = await Show.findById(s2.showId);
  ok(show2.booked_seats === 1, 'DB booked_seats = 1');
  await clean(s2.showId);

  // Test 3 — 3 distinct seats, 12 concurrent users → max 3 confirmed
  console.log('\nTest 3: 3 seats targeted by 12 concurrent users');
  const s3 = await makeShow(10);
  const res3 = await Promise.allSettled(
    Array.from({ length: 12 }, (_, i) =>
      bookSeats({ show_id: s3.showId, seat_ids: [s3.seatIds[i % 3]], ...user(20 + i) })
    )
  );
  const v3 = res3.map(r => r.status === 'fulfilled' ? r.value : { status: 'ERROR' });
  const c3 = v3.filter(r => r.status === 'CONFIRMED').length;
  ok(c3 <= 3, `No more than 3 confirmed (got ${c3})`);
  ok(c3 >= 1, `At least 1 confirmed (got ${c3})`);
  await clean(s3.showId);

  // Test 4 — cancel releases seat
  console.log('\nTest 4: Cancel and re-book');
  const s4 = await makeShow(5);
  const b4 = await bookSeats({ show_id: s4.showId, seat_ids: [s4.seatIds[0]], ...user(30) });
  ok(b4.status === 'CONFIRMED', 'Initial booking confirmed');
  await cancelBooking(b4.booking._id.toString());
  const seat4 = await Seat.findById(s4.seatIds[0]);
  ok(seat4.status === 'AVAILABLE', 'Seat released after cancel');
  const b4b = await bookSeats({ show_id: s4.showId, seat_ids: [s4.seatIds[0]], ...user(31) });
  ok(b4b.status === 'CONFIRMED', 'Re-booking successful');
  await clean(s4.showId);

  // Test 5 — bad ObjectId
  console.log('\nTest 5: Bad ObjectId returns 400');
  try {
    await bookSeats({ show_id: 'not-an-id', seat_ids: ['also-bad'], ...user(40) });
    ok(false, 'Should have thrown');
  } catch(e) {
    ok(e.status === 400, `Throws 400 (got ${e.status})`);
  }

  // Summary
  console.log('\n' + '─'.repeat(45));
  console.log(`\x1b[1mResults: ${PASS} ${pass} passed   ${FAIL} ${fail} failed\x1b[0m\n`);
  await mongoose.disconnect();
  process.exit(fail > 0 ? 1 : 0);
};

run().catch(err => { console.error(err); process.exit(1); });
