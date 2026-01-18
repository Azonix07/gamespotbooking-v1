# GameSpot Web - System Architecture

## Project Overview
Full-stack booking system for gaming center with PS5 consoles and driving simulator.

## Technology Stack
- **Frontend**: React 18+ with React Router
- **Backend**: PHP 8+ (REST API)
- **Database**: MySQL 8+
- **Server**: Apache/Nginx with PHP-FPM

---

## Folder Structure
```
gamespotweb/
├── frontend/               # React application
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Helper functions
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend/               # PHP REST API
│   ├── config/           # Database configuration
│   ├── api/              # API endpoints
│   │   ├── bookings.php
│   │   ├── slots.php
│   │   ├── admin.php
│   │   └── pricing.php
│   ├── models/           # Data models
│   ├── utils/            # Helper functions
│   └── .htaccess
│
├── database/             # SQL schema and migrations
│   ├── schema.sql
│   └── seed.sql
│
└── ARCHITECTURE.md       # This file
```

---

## Database Schema

### Table: `bookings`
Primary table storing all booking information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY AUTO_INCREMENT | Unique booking ID |
| customer_name | VARCHAR(100) NOT NULL | Customer name |
| customer_phone | VARCHAR(20) NOT NULL | Customer phone |
| booking_date | DATE NOT NULL | Date of booking |
| start_time | TIME NOT NULL | Start time (e.g., 09:00:00) |
| duration_minutes | INT NOT NULL | Duration in minutes (30, 60, 90, 120) |
| total_price | DECIMAL(10,2) NOT NULL | Total booking price |
| driving_after_ps5 | BOOLEAN DEFAULT FALSE | Driving sim after PS5? |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When booking was created |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update |

**Indexes:**
- INDEX on (booking_date, start_time)
- INDEX on (booking_date)

---

### Table: `booking_devices`
Stores which devices and players are booked for each booking.

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY AUTO_INCREMENT | Unique ID |
| booking_id | INT NOT NULL | Foreign key to bookings.id |
| device_type | ENUM('ps5', 'driving_sim') NOT NULL | Device type |
| device_number | INT | PS5 unit number (1, 2, or 3), NULL for driving_sim |
| player_count | INT NOT NULL | Number of players |
| price | DECIMAL(10,2) NOT NULL | Price for this device booking |

**Foreign Keys:**
- booking_id REFERENCES bookings(id) ON DELETE CASCADE

**Indexes:**
- INDEX on (booking_id)

---

### Table: `admin_users`
Admin authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY AUTO_INCREMENT | Unique ID |
| username | VARCHAR(50) UNIQUE NOT NULL | Admin username |
| password_hash | VARCHAR(255) NOT NULL | Hashed password |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Default Admin:**
- Username: admin
- Password: admin (hashed with password_hash())

---

## API Endpoints

### Base URL: `/backend/api/`

### 1. Get Available Slots
**Endpoint:** `GET /slots.php?date=YYYY-MM-DD`

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "time": "09:00",
      "status": "available", // available, partial, full
      "available_ps5": 3,
      "available_driving": true
    },
    ...
  ]
}
```

---

### 2. Get Slot Details
**Endpoint:** `GET /slots.php?date=YYYY-MM-DD&time=HH:MM&duration=30`

**Response:**
```json
{
  "success": true,
  "available_ps5_units": [1, 2, 3],
  "available_driving": true,
  "affected_slots": ["09:00", "09:30"],
  "total_ps5_players_booked": 4
}
```

---

### 3. Calculate Price
**Endpoint:** `POST /pricing.php`

**Request:**
```json
{
  "ps5_bookings": [
    {"device_number": 1, "player_count": 4},
    {"device_number": 2, "player_count": 2}
  ],
  "driving_sim": true,
  "duration_minutes": 60
}
```

**Response:**
```json
{
  "success": true,
  "ps5_price": 360,
  "driving_price": 170,
  "total_price": 530,
  "breakdown": [...]
}
```

---

### 4. Create Booking
**Endpoint:** `POST /bookings.php`

**Request:**
```json
{
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "booking_date": "2025-12-25",
  "start_time": "14:00",
  "duration_minutes": 60,
  "ps5_bookings": [
    {"device_number": 1, "player_count": 4}
  ],
  "driving_sim": true,
  "driving_after_ps5": false,
  "total_price": 380
}
```

**Response:**
```json
{
  "success": true,
  "booking_id": 123,
  "message": "Booking created successfully"
}
```

---

### 5. Get All Bookings (Admin)
**Endpoint:** `GET /bookings.php` (requires session)

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_phone": "1234567890",
      "booking_date": "2025-12-25",
      "start_time": "14:00",
      "duration_minutes": 60,
      "total_price": 380,
      "devices": [
        {"device_type": "ps5", "device_number": 1, "player_count": 4},
        {"device_type": "driving_sim", "player_count": 1}
      ]
    }
  ]
}
```

---

### 6. Update Booking (Admin)
**Endpoint:** `PUT /bookings.php?id=123` (requires session)

**Request:**
```json
{
  "start_time": "15:00",
  "duration_minutes": 90,
  "total_price": 450
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully"
}
```

---

### 7. Admin Login
**Endpoint:** `POST /admin.php?action=login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful"
}
```

---

### 8. Admin Logout
**Endpoint:** `POST /admin.php?action=logout`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 9. Check Admin Session
**Endpoint:** `GET /admin.php?action=check`

**Response:**
```json
{
  "success": true,
  "authenticated": true
}
```

---

## Booking Logic

### Time Slot Generation
- Start: 9:00 AM (09:00)
- End: 10:00 PM (22:00)
- Interval: 30 minutes
- Total slots: 26 slots per day

### Slot Status Calculation
1. **Available (Green)**: No bookings OR (available PS5 > 0 AND driving_sim available)
2. **Partial (Yellow)**: Some devices booked but not all
3. **Full (Red)**: All 3 PS5 units booked AND driving_sim booked

### PS5 Player Limits
- Max players per PS5: 4
- Max total players across all 3 PS5s at same time: 10
- Validation must check existing bookings + new booking

### Slot Blocking
When a booking is created with duration > 30 minutes:
- Calculate all affected time slots
- Example: 2:00 PM booking for 90 minutes blocks: 14:00, 14:30, 15:00

### Real-time Availability Check
Before confirming a booking:
1. Check all affected time slots
2. Verify PS5 units are available for entire duration
3. Verify total player count doesn't exceed 10 at any slot
4. Verify driving sim availability if selected
5. Lock and reserve if all checks pass

---

## Pricing Logic

### PS5 Pricing Matrix
```
Players | 30min | 60min | 90min | 120min
--------|-------|-------|-------|--------
   1    |  70   |  130  |  170  |  210
   2    |  90   |  150  |  200  |  240
   3    |  90   |  150  |  200  |  240
   4    | 150   |  210  |  270  |  300
```

### Driving Simulator Pricing
```
Duration | Price
---------|------
30min    | 100
60min    | 170
90min    | 200
120min   | 200 (same as 90min)
```

### Total Calculation
- Sum of all PS5 bookings (can book multiple units)
- Plus driving sim (if selected)
- Display live as user selects options

---

## Security Considerations

1. **SQL Injection Prevention**: Use prepared statements
2. **Session Management**: Secure session handling for admin
3. **Input Validation**: Validate all inputs server-side
4. **CORS Configuration**: Allow frontend domain
5. **Password Hashing**: Use PHP password_hash() and password_verify()

---

## Frontend Pages & Routes

### Routes
- `/` - Home Page
- `/booking` - Booking Page
- `/admin/login` - Admin Login
- `/admin/dashboard` - Admin Dashboard (protected)

### State Management
- Use React hooks (useState, useEffect)
- API calls via fetch/axios
- Real-time price calculation on client-side

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- PHP 8.0+
- MySQL 8.0+
- Apache/Nginx web server

### Installation Steps
1. Clone repository
2. Setup database: `mysql < database/schema.sql`
3. Configure backend: Update `backend/config/database.php`
4. Install frontend: `cd frontend && npm install`
5. Start frontend: `npm start` (dev) or `npm run build` (prod)
6. Configure Apache/Nginx to serve backend API

---

## Testing Checklist

- [ ] Book single PS5 with 1 player
- [ ] Book multiple PS5 units with different player counts
- [ ] Book driving sim only
- [ ] Book PS5 + driving sim
- [ ] Verify max 10 players enforcement
- [ ] Test slot blocking for multi-hour bookings
- [ ] Verify color coding (green/yellow/red)
- [ ] Test price calculation for all combinations
- [ ] Admin login/logout
- [ ] Admin edit booking
- [ ] Verify database updates after edits
- [ ] Test responsive design on mobile
- [ ] Test concurrent booking conflicts

---

**Last Updated:** December 24, 2025
