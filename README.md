# 🎟 SnapBook — Ticket Booking System

> A full-stack ticket booking platform for Movies, Bus Trips, Concerts, and Sports events.
> Built with Node.js, Express, MongoDB Atlas, React, and TypeScript.
> Handles high concurrency with **zero overbooking** guaranteed.

![SnapBook](https://img.shields.io/badge/SnapBook-Ticket%20Booking-e8390e?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

---

## 📸 Features

- 🎬 Browse shows — Movies, Bus, Concerts, Sports
- 💺 Interactive seat selection grid
- ⚡ Concurrency-safe booking — zero double booking
- 🌗 Dark / Light theme toggle
- 👤 User & Admin roles
- 📊 Admin dashboard — create shows, manage bookings
- 🔄 Auto-expires stale bookings after 2 minutes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Styling | CSS Variables (Dark/Light theme) |
| State | React Context API |
| Fonts | Syne + Plus Jakarta Sans |

---

## 📁 Project Structure

```
SnapBook/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB connection
│   │   │   └── seed.js             # Sample data seeder
│   │   ├── models/
│   │   │   ├── Show.js             # Show schema
│   │   │   ├── Seat.js             # Seat schema
│   │   │   └── Booking.js          # Booking schema
│   │   ├── controllers/
│   │   │   ├── showController.js
│   │   │   └── bookingController.js
│   │   ├── services/
│   │   │   └── bookingService.js   # Concurrency logic
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   └── validators.js
│   │   ├── tests/
│   │   │   └── concurrency.test.js
│   │   └── index.js                # App entry point
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── api/                    # Axios service layer
    │   ├── components/
    │   │   ├── booking/            # SeatGrid component
    │   │   ├── common/             # Navbar, shared UI
    │   │   └── user/               # ShowCard
    │   ├── context/                # AppContext (auth, theme)
    │   ├── pages/
    │   │   ├── Home.tsx            # Show listing
    │   │   ├── BookingPage.tsx     # Seat selection + booking
    │   │   ├── AdminPage.tsx       # Admin dashboard
    │   │   └── LoginPage.tsx       # Mock auth
    │   ├── styles/                 # Global CSS + theme
    │   └── types/                  # TypeScript interfaces
    ├── package.json
    └── .env
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [MongoDB Atlas](https://cloud.mongodb.com) free account

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/SnapBook.git
cd SnapBook
```

### 2. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in
2. Create a free **M0 cluster**
3. Go to **Database Access** → Add a new user with a password
4. Go to **Network Access** → Add IP Address → Allow Access from Anywhere
5. Click **Connect** → **Drivers** → copy the connection string

---

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/modex_tickets?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
```

Seed the database with sample shows:

```bash
npm run seed
```

Start the backend server:

```bash
npm run dev
```

Backend runs at → `http://localhost:5000`

---

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install --legacy-peer-deps
```

Create a `.env` file in the `frontend` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

Frontend runs at → `http://localhost:3000`

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Shows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shows` | List all upcoming shows |
| GET | `/shows/:id` | Get show by ID |
| GET | `/shows/:id/seats` | Get seat map for a show |
| POST | `/admin/shows` | Create a new show (Admin) |
| DELETE | `/admin/shows/:id` | Cancel a show (Admin) |
| GET | `/admin/shows` | List all shows — Admin view |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Book seats |
| GET | `/bookings/:id` | Get booking details |
| DELETE | `/bookings/:id` | Cancel a booking |
| GET | `/admin/bookings` | List all bookings (Admin) |

### Example — Book seats

**Request:**
```json
POST /api/bookings
{
  "show_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "seat_ids": ["64f1a2b3c4d5e6f7a8b9c0d2"],
  "user_name": "Rahul Mehta",
  "user_email": "rahul@example.com",
  "user_phone": "9876543210"
}
```

**Response (success):**
```json
{
  "success": true,
  "status": "CONFIRMED",
  "booking": {
    "id": "...",
    "seat_codes": ["A1"],
    "total_amount": 350
  }
}
```

**Response (seats taken):**
```json
{
  "success": false,
  "status": "FAILED",
  "message": "One or more seats were just taken by another user"
}
```

---

## 🔀 Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Home — Browse and search shows |
| `/booking/:id` | Seat picker → Details → Confirmation |
| `/admin` | Admin dashboard (Admin role only) |
| `/login` | Sign in — choose User or Admin role |

---

## ⚡ Concurrency & Overbooking Prevention

SnapBook uses **MongoDB ACID transactions** with an atomic `findOneAndUpdate` pattern:

```
User clicks "Book"
    ↓
For each seat → findOneAndUpdate({ status: 'AVAILABLE' }) → { status: 'BOOKED' }
    ↓
If any seat returns null (already taken) → abort entire transaction → rollback ALL seats
    ↓
Only if ALL seats claimed successfully → commit → CONFIRMED
```

Two users booking the same seat simultaneously — only one wins. The other always gets `FAILED`.

### Run concurrency tests

```bash
cd backend
npm run test:concurrency
```

Expected output:
```
✓ Single booking confirmed
✓ Exactly 1 CONFIRMED (from 10 concurrent requests)
✓ Exactly 9 FAILED
✓ DB booked_seats = 1
✓ Seat released after cancel
✓ Re-booking successful
```

---

## 🌗 Dark / Light Theme

- Animated pill toggle in the navbar ☀ / ☽
- Respects OS preference on first load
- Persisted in `localStorage`
- 40+ CSS custom properties for full theming

---

## 🔐 Authentication

This project uses **mock authentication** — no real login required. Simply select a role:

- **User** — browse shows, book tickets
- **Admin** — create shows, view all bookings, cancel shows

> For production, replace with JWT + bcrypt or Auth0.

---

## 🐛 Common Issues

**`npm install` peer dependency error**
```bash
npm install --legacy-peer-deps
```

**PowerShell script execution error (Windows)**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**MongoDB connection refused**
- Check Atlas Network Access — IP must be whitelisted
- Verify `MONGODB_URI` has the correct password

**Port 5000 already in use**
- Change `PORT=5001` in `backend/.env`
- Update `REACT_APP_API_URL=http://localhost:5001/api` in `frontend/.env`

---

## 📋 Scripts

### Backend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm start` | Start in production |
| `npm run seed` | Seed sample shows into Atlas |
| `npm run test:concurrency` | Run concurrency tests |

### Frontend
| Command | Description |
|---------|-------------|
| `npm start` | Start dev server |
| `npm run build` | Build for production |

---

## 📄 License

MIT — free to use and modify.

---

> Built for the **Modex Assessment** — Full Stack Ticket Booking System
