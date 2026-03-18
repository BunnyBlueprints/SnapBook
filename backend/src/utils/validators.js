const isObjectId = s => /^[a-f\d]{24}$/i.test(s);
const isEmail    = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const validateBooking = ({ show_id, seat_ids, user_name, user_email, user_phone }) => {
  const e = [];
  if (!show_id)              e.push('show_id is required');
  else if (!isObjectId(show_id)) e.push('show_id must be a valid MongoDB ObjectId');
  if (!seat_ids?.length)     e.push('seat_ids must be a non-empty array');
  else if (seat_ids.length > 10) e.push('Cannot book more than 10 seats at once');
  else if (seat_ids.some(id => !isObjectId(id))) e.push('All seat_ids must be valid MongoDB ObjectIds');
  if (!user_name?.trim())    e.push('user_name is required');
  if (!user_email?.trim())   e.push('user_email is required');
  else if (!isEmail(user_email)) e.push('user_email must be a valid email');
  if (!user_phone?.trim())   e.push('user_phone is required');
  return e;
};

const validateShow = ({ name, start_time, total_seats, price }) => {
  const e = [];
  if (!name?.trim())     e.push('name is required');
  if (!start_time)       e.push('start_time is required');
  else if (isNaN(Date.parse(start_time))) e.push('start_time must be a valid date');
  else if (new Date(start_time) <= new Date()) e.push('start_time must be in the future');
  if (!total_seats)      e.push('total_seats is required');
  else if (Number(total_seats) < 1 || Number(total_seats) > 500)
    e.push('total_seats must be between 1 and 500');
  if (price !== undefined && Number(price) < 0) e.push('price must be >= 0');
  return e;
};

const validateBody = fn => (req, res, next) => {
  const errors = fn(req.body);
  if (errors.length)
    return res.status(400).json({ success: false, message: errors[0], errors });
  next();
};

module.exports = { validateBooking, validateShow, validateBody };
