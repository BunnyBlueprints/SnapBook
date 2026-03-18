require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connect = require('./db');
const Show    = require('../models/Show');
const Seat    = require('../models/Seat');
const Booking = require('../models/Booking');

const generateSeats = (showId, totalSeats, type) => {
  const seatsPerRow = type === 'BUS' ? 4 : 10;
  const seats = [];
  let count = 0;
  for (let r = 0; count < totalSeats; r++) {
    const rowLabel = String.fromCharCode(65 + r); // A, B, C…
    for (let n = 1; n <= seatsPerRow && count < totalSeats; n++, count++) {
      seats.push({ show_id: showId, seat_code: `${rowLabel}${n}`, row_label: rowLabel, seat_num: n });
    }
  }
  return seats;
};

const SEEDS = [
  { name: 'Kalki 2898 AD',                  type: 'MOVIE',   venue: 'PVR IMAX Mumbai',          price: 350,  seats: 40, hoursFromNow: 48 },
  { name: 'Coldplay: Music of the Spheres',  type: 'CONCERT', venue: 'DY Patil Stadium Mumbai',  price: 2500, seats: 30, hoursFromNow: 72 },
  { name: 'Mumbai → Pune Volvo AC',          type: 'BUS',     venue: 'Dadar Bus Terminal',        price: 280,  seats: 44, hoursFromNow: 6  },
  { name: 'IPL 2025 Final',                  type: 'SPORT',   venue: 'Wankhede Stadium Mumbai',  price: 1500, seats: 60, hoursFromNow: 96 },
  { name: 'Stree 2',                         type: 'MOVIE',   venue: 'Cinepolis Thane',           price: 250,  seats: 35, hoursFromNow: 24 },
  { name: 'Chennai → Bangalore Express',     type: 'BUS',     venue: 'Chennai CMBT',              price: 650,  seats: 36, hoursFromNow: 12 },
];

const seed = async () => {
  await connect();

  const existing = await Show.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️   Database already has ${existing} shows — skipping seed.`);
    console.log('    To re-seed, drop the database first.');
    process.exit(0);
  }

  console.log('🌱  Seeding database…');

  for (const s of SEEDS) {
    const start = new Date(Date.now() + s.hoursFromNow * 3600_000);
    const show  = await Show.create({
      name: s.name, type: s.type, venue: s.venue,
      start_time: start, total_seats: s.seats, price: s.price,
      description: `${s.type} — ${s.name}`,
    });
    const seats = generateSeats(show._id, s.seats, s.type);
    await Seat.insertMany(seats);
    console.log(`  ✅  ${s.name} (${s.seats} seats)`);
  }

  console.log('\n✨  Seed complete — 6 shows created.\n');
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
