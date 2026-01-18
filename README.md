# GameSpot Web - Full-Stack Booking System

A complete booking system for gaming center with PS5 consoles and driving simulators. Built with React frontend and PHP backend.

## 🚀 Features

### Customer Features
- **Real-time Slot Availability**: Color-coded time slots (Green/Yellow/Red)
- **Multiple Device Booking**: Book up to 3 PS5 units simultaneously
- **Driving Simulator**: Optional add-on with flexible timing
- **Dynamic Pricing**: Instant price calculation based on selections
- **Player Management**: Up to 4 players per PS5, max 10 total players
- **Duration Options**: 30 min, 1 hour, 1.5 hours, 2 hours
- **Responsive Design**: Works on desktop and mobile devices

### Admin Features
- **Secure Login**: Session-based authentication
- **Booking Management**: View, edit, and delete all bookings
- **Real-time Updates**: Instant availability updates after changes
- **Edit Capabilities**: Modify time, duration, and price

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PHP** (v8.0 or higher)
- **MySQL** (v8.0 or higher)
- **Apache/Nginx** web server with PHP support
- **npm** (comes with Node.js)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
cd /Users/abhijithca/Documents/GitHub/gamespotweb
```

### Step 2: Database Setup

1. **Start MySQL** (if not already running):
```bash
mysql.server start
# or
brew services start mysql
```

2. **Create the database**:
```bash
mysql -u root -p < database/schema.sql
```

Or manually:
```bash
mysql -u root -p
```

Then run:
```sql
SOURCE database/schema.sql;
```

3. **Verify database creation**:
```sql
USE gamespot_booking;
SHOW TABLES;
```

You should see:
- `bookings`
- `booking_devices`
- `admin_users`

### Step 3: Backend Configuration

1. **Navigate to backend config**:
```bash
cd backend/config
```

2. **Update database credentials** in `database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'gamespot_booking');
define('DB_USER', 'root');        // Your MySQL username
define('DB_PASS', '');            // Your MySQL password
```

3. **Setup web server**:

**Option A: Using PHP Built-in Server** (Development Only):
```bash
cd backend
php -S localhost:80
```

**Option B: Using Apache/MAMP/XAMPP**:
- Copy the `backend` folder to your web server's document root
- Example: `/Applications/MAMP/htdocs/gamespot_backend/`
- Update API_BASE_URL in frontend accordingly

### Step 4: Frontend Setup

1. **Navigate to frontend**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Update API endpoint** in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:80/backend/api';
// Change to your backend URL if different
```

4. **Start development server**:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🎮 Usage

### Customer Booking Flow

1. **Access the website**: Navigate to `http://localhost:3000`
2. **Click "Book Now"** on the home page
3. **Select a date** using the date picker
4. **Choose a time slot**:
   - 🟢 Green = Available
   - 🟡 Yellow = Partially booked
   - 🔴 Red = Fully booked
5. **Select duration**: 30 min, 1 hr, 1.5 hr, or 2 hr
6. **Choose devices**:
   - Select PS5 units (1-3)
   - Set player count (1-4 per PS5)
   - Optionally add Driving Simulator
7. **View real-time price** calculation
8. **Enter customer details**: Name and phone number
9. **Confirm booking**

### Admin Access

1. **Click "Admin Login"** on home page
2. **Login credentials**:
   - Username: `admin`
   - Password: `admin`
3. **Dashboard features**:
   - View all bookings in a table
   - Edit time, duration, or price
   - Delete bookings
   - Changes update availability immediately

## 💰 Pricing Structure

### PS5 Pricing
| Players | 30 min | 1 hour | 1.5 hours | 2 hours |
|---------|--------|--------|-----------|---------|
| 1       | ₹70    | ₹130   | ₹170      | ₹210    |
| 2       | ₹90    | ₹150   | ₹200      | ₹240    |
| 3       | ₹90    | ₹150   | ₹200      | ₹240    |
| 4       | ₹150   | ₹210   | ₹270      | ₹300    |

### Driving Simulator Pricing
| Duration  | Price |
|-----------|-------|
| 30 min    | ₹100  |
| 1 hour    | ₹170  |
| 1.5 hours | ₹200  |
| 2 hours   | ₹200  |

## 🏗️ Project Structure

```
gamespotweb/
├── ARCHITECTURE.md          # Detailed system architecture
├── README.md               # This file
│
├── database/
│   └── schema.sql          # Database schema with sample data
│
├── backend/                # PHP REST API
│   ├── config/
│   │   └── database.php    # DB connection config
│   ├── utils/
│   │   └── helpers.php     # Utility functions
│   ├── api/
│   │   ├── admin.php       # Admin authentication
│   │   ├── bookings.php    # Booking CRUD operations
│   │   ├── pricing.php     # Price calculations
│   │   └── slots.php       # Availability checking
│   └── .htaccess
│
└── frontend/               # React application
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Navbar.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── BookingPage.js
    │   │   ├── AdminLoginPage.js
    │   │   └── AdminDashboard.js
    │   ├── services/
    │   │   └── api.js      # API service layer
    │   ├── utils/
    │   │   └── helpers.js  # Helper functions
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## 🔒 Security Features

- **SQL Injection Prevention**: All queries use prepared statements
- **Session Management**: Secure PHP sessions for admin
- **Input Validation**: Server-side validation for all inputs
- **Password Hashing**: bcrypt hashing for admin passwords
- **CORS Configuration**: Properly configured for security

## 🧪 Testing Checklist

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
- [ ] Admin delete booking
- [ ] Verify database updates after edits
- [ ] Test on mobile devices
- [ ] Test concurrent booking conflicts

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
mysql.server status

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Re-create database if needed
mysql -u root -p < database/schema.sql
```

### Backend API Not Working
```bash
# Check PHP version
php -v  # Should be 8.0+

# Check PHP extensions
php -m | grep -E 'pdo|mysql'

# Test backend directly
curl http://localhost:80/backend/api/admin.php?action=check
```

### Frontend Not Starting
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 18+

# Try different port
PORT=3001 npm start
```

### CORS Issues
If you see CORS errors in browser console:
1. Verify backend CORS headers in `utils/helpers.php`
2. Ensure `credentials: 'include'` in API calls
3. Check backend URL matches in `services/api.js`

## 🚀 Production Deployment

### Backend
1. Upload `backend/` to your web server
2. Update database credentials in `config/database.php`
3. Ensure PHP extensions are enabled: `pdo`, `pdo_mysql`
4. Set proper file permissions (755 for directories, 644 for files)

### Frontend
1. Build production version:
```bash
cd frontend
npm run build
```
2. Deploy `build/` folder to your hosting
3. Update `API_BASE_URL` to production backend URL
4. Configure web server (Apache/Nginx) for React Router

### Database
1. Export from development:
```bash
mysqldump -u root -p gamespot_booking > backup.sql
```
2. Import to production:
```bash
mysql -u username -p production_db < backup.sql
```

## 📝 API Endpoints

See `ARCHITECTURE.md` for complete API documentation.

### Quick Reference
- `GET /slots.php?date=YYYY-MM-DD` - Get available slots
- `POST /bookings.php` - Create booking
- `GET /bookings.php` - Get all bookings (admin)
- `PUT /bookings.php?id=123` - Update booking (admin)
- `DELETE /bookings.php?id=123` - Delete booking (admin)
- `POST /admin.php?action=login` - Admin login
- `POST /pricing.php` - Calculate price

## 🤝 Support

For issues or questions:
1. Check `ARCHITECTURE.md` for detailed documentation
2. Review troubleshooting section above
3. Check browser console for frontend errors
4. Check PHP error logs for backend issues

## 📄 License

This project is private and proprietary.

## 🎉 Credits

Built with:
- **React** 18.2 - Frontend framework
- **React Router** 6.20 - Routing
- **PHP** 8+ - Backend API
- **MySQL** 8+ - Database
- **PDO** - Database abstraction

---

**Last Updated**: December 24, 2025
**Version**: 1.0.0
