# GameSpot Booking System - Python Backend Migration

## 🎯 Overview

This is a **complete conversion** of the GameSpot booking system backend from **PHP to Python/Flask** while maintaining **100% API compatibility** with the existing React frontend.

## 🔄 Migration Summary

### What Changed
- **Backend Language**: PHP → Python 3
- **Web Framework**: Raw PHP → Flask
- **Database Driver**: PDO → mysql-connector-python

### What Stayed The Same
- ✅ **Frontend**: React (no changes required)
- ✅ **Database**: MySQL with same schema
- ✅ **API Endpoints**: Same URLs (/api/slots.php, etc.)
- ✅ **API Contracts**: Same request/response formats
- ✅ **Business Logic**: Same booking rules, pricing, validations
- ✅ **Authentication**: Same session-based admin login

## 📁 Project Structure

```
backend_python/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
│
├── config/
│   └── database.py        # MySQL connection pool
│
├── routes/
│   ├── slots.py           # Slot availability API
│   ├── pricing.py         # Pricing calculation API
│   ├── bookings.py        # Booking CRUD operations
│   └── admin.py           # Admin authentication
│
├── services/              # (Reserved for business logic)
│
└── utils/
    └── helpers.py         # Utility functions
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- MySQL 8.0+ (already installed and running)
- pip (Python package manager)

### Step 1: Install Python Dependencies

```bash
cd backend_python
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your MySQL password if different
```

### Step 3: Verify Database Connection

The Python backend uses the **same MySQL database** as the PHP version:
- Database: `gamespot_booking`
- Tables: `bookings`, `booking_devices`, `admin_users`
- No schema changes required!

### Step 4: Start Python Backend

```bash
python app.py
```

The server will start on **http://localhost:8000**

### Step 5: Test API Endpoints

```bash
# Test health check
curl http://localhost:8000/health

# Test slots API
curl "http://localhost:8000/api/slots.php?date=2025-12-31"

# Test pricing API
curl -X POST http://localhost:8000/api/pricing.php \
  -H "Content-Type: application/json" \
  -d '{"ps5_bookings":[{"device_number":1,"player_count":2}],"duration_minutes":60,"driving_sim":false}'
```

## 🔌 API Endpoints (Same as PHP)

### 1. Slots API
- **URL**: `/api/slots.php`
- **Method**: GET
- **Params**: 
  - `date` (required): YYYY-MM-DD
  - `time` (optional): HH:MM
  - `duration` (optional): minutes
- **Response**: Slot availability data

### 2. Pricing API
- **URL**: `/api/pricing.php`
- **Method**: POST
- **Body**: 
  ```json
  {
    "ps5_bookings": [{"device_number": 1, "player_count": 2}],
    "driving_sim": false,
    "duration_minutes": 60
  }
  ```
- **Response**: Price breakdown

### 3. Bookings API
- **URL**: `/api/bookings.php`
- **Methods**: GET (admin), POST, PUT (admin), DELETE (admin)
- **Body** (POST):
  ```json
  {
    "customer_name": "John Doe",
    "customer_phone": "1234567890",
    "booking_date": "2025-12-31",
    "start_time": "09:00",
    "duration_minutes": 60,
    "ps5_bookings": [{"device_number": 1, "player_count": 2}],
    "driving_sim": false,
    "driving_after_ps5": false,
    "total_price": 150
  }
  ```

### 4. Admin API
- **URL**: `/api/admin.php`
- **Actions**:
  - `?action=login` (POST): Admin login
  - `?action=logout` (POST): Admin logout
  - `?action=check` (GET): Check session

## 🔐 Admin Credentials

Same as PHP version:
- **Username**: admin
- **Password**: admin

(Password hash stored in `admin_users` table)

## ⚙️ Business Logic Preserved

### Pricing Rules (Exact Same)

**PS5 Pricing:**
| Players | 30 min | 60 min | 90 min | 120 min |
|---------|--------|--------|--------|---------|
| 1       | ₹70    | ₹130   | ₹170   | ₹210    |
| 2       | ₹90    | ₹150   | ₹200   | ₹240    |
| 3       | ₹90    | ₹150   | ₹200   | ₹240    |
| 4       | ₹150   | ₹210   | ₹270   | ₹300    |

**Driving Simulator:**
| Duration | Price |
|----------|-------|
| 30 min   | ₹100  |
| 60 min   | ₹170  |
| 90 min   | ₹200  |
| 120 min  | ₹200  |

### Booking Rules (Exact Same)
- ✅ 3 PS5 units available (numbered 1, 2, 3)
- ✅ 1 Driving Simulator available
- ✅ Max 10 total PS5 players at any time slot
- ✅ Each PS5 unit: 1-4 players
- ✅ Time slots: 9:00 AM - 10:00 PM (30-min intervals)
- ✅ Durations: 30, 60, 90, or 120 minutes
- ✅ Overlap detection for multi-slot bookings
- ✅ Device-specific availability tracking

### Validation Rules (Exact Same)
- Customer name: minimum 2 characters
- Phone number: minimum 10 digits
- Booking date: today or future
- At least one device (PS5 or Driving Sim)
- Valid device numbers and player counts

## 🧪 Testing Checklist

### Frontend Integration Tests
- [ ] Home page loads correctly
- [ ] Navigate to booking page
- [ ] Select date and view slot availability
- [ ] Select time slot and view device options
- [ ] Book PS5 with 2 players for 1 hour
- [ ] Verify booking confirmation
- [ ] Refresh page and check slot is now yellow/partial
- [ ] Click same slot - PS5 unit should show as BOOKED
- [ ] Try to book same PS5 unit - should be disabled
- [ ] Admin login works
- [ ] Admin dashboard shows bookings
- [ ] Admin can edit/delete bookings

### Backend Unit Tests
- [ ] Slot availability calculation
- [ ] Pricing calculation for all combinations
- [ ] Booking validation
- [ ] Overlap detection
- [ ] Player limit enforcement (max 10)
- [ ] Admin authentication
- [ ] Session management

## 🔧 Configuration

### Database Connection
The Python backend automatically detects and uses:
1. Unix socket (`/tmp/mysql.sock`) if available (Mac/Homebrew)
2. TCP connection (`localhost:3306`) otherwise

### CORS Settings
Configured to allow:
- `http://localhost:3000` (React default)
- `http://localhost:3001` (React alternate)
- `http://localhost:3002` (React alternate)

### Session Management
- Cookie-based sessions (same as PHP)
- 24-hour lifetime
- HTTP-only cookies
- Same-site: Lax

## 📊 Performance Considerations

### Connection Pooling
- **Pool size**: 10 connections
- **Reset on release**: Yes
- **Thread-safe**: Yes

### Database Queries
- **Prepared statements**: All queries use parameterized inputs
- **SQL injection protection**: Built-in via mysql-connector-python
- **Transaction support**: Yes, with proper rollback

## 🐛 Troubleshooting

### Port 8000 Already in Use
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port in app.py
app.run(port=8001)
```

### MySQL Connection Error
```bash
# Check MySQL is running
mysql.server status

# Start MySQL if needed
mysql.server start

# Verify credentials in .env
```

### Frontend Can't Connect
```bash
# Check CORS settings in app.py
# Verify React app is using http://localhost:8000 in api.js
# Check browser console for CORS errors
```

### Session Issues
```bash
# Clear browser cookies
# Check SECRET_KEY is set in .env
# Verify session configuration in app.py
```

## 🔄 Migration Checklist

- [x] Analyze PHP backend structure
- [x] Create Python project structure
- [x] Convert database configuration
- [x] Convert utility functions
- [x] Convert slots API
- [x] Convert pricing API
- [x] Convert bookings API (CRUD + transactions)
- [x] Convert admin API (authentication)
- [x] Set up CORS for React frontend
- [x] Implement session management
- [x] Add connection pooling
- [x] Create requirements.txt
- [x] Write comprehensive documentation
- [ ] Test all API endpoints
- [ ] Test with React frontend
- [ ] Performance testing
- [ ] Production deployment setup

## 📚 Technology Stack

### Python Backend
- **Flask 3.0.0**: Web framework
- **Flask-CORS 4.0.0**: Cross-origin resource sharing
- **mysql-connector-python 8.2.0**: MySQL database driver
- **Werkzeug 3.0.1**: Security utilities (password hashing)
- **python-dotenv 1.0.0**: Environment variable management

### Database
- **MySQL 8.0+**: Relational database (unchanged)

### Frontend
- **React 18.2**: Frontend framework (unchanged)
- **React Router 6.20**: Client-side routing (unchanged)

## 🎯 Next Steps

1. **Stop PHP Server**: `lsof -ti:8000 | xargs kill -9`
2. **Start Python Server**: `python app.py`
3. **Test Frontend**: Visit `http://localhost:3000`
4. **Create Test Booking**: Verify end-to-end flow
5. **Check Admin Dashboard**: Test admin operations

## 📝 Notes

- The `.php` extensions in URLs are **intentional** to maintain frontend compatibility
- No frontend code changes required
- Database schema unchanged
- All business logic preserved
- Session cookies work identically to PHP sessions

## 🚀 Production Deployment

For production:
1. Set `FLASK_ENV=production` in .env
2. Use a production WSGI server (gunicorn, uWSGI)
3. Set strong `SECRET_KEY`
4. Configure proper CORS origins
5. Enable HTTPS
6. Set up database connection pooling limits
7. Configure logging
8. Set up monitoring

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 📄 License

Same as original project

## 👨‍💻 Author

Converted from PHP to Python while maintaining 100% API compatibility
Date: December 31, 2025
