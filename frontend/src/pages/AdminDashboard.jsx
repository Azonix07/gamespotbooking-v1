import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiRefreshCw, 
  FiEdit2, 
  FiTrash2, 
  FiSave, 
  FiX, 
  FiHome, 
  FiLogOut,
  FiBarChart2,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiSettings,
  FiEye,
  FiTrendingUp,
  FiMonitor,
  FiSmartphone,
  FiGlobe,
  FiClock,
  FiActivity,
  FiMessageSquare,
  FiPackage,
  FiAward,
  FiTarget
} from 'react-icons/fi';
import { 
  getAllBookings, 
  updateBooking, 
  deleteBooking, 
  adminLogout, 
  getAdminUsers,
  getAdminMemberships,
  getAdminStats,
  getAnalytics,
  getRentals,
  getRentalStats,
  getCollegeBookings,
  getCollegeStats,
  getGameLeaderboard,
  getGameStats
} from '../services/api';
import { useAuth } from '../context/AuthContext';

import { formatDuration, formatPrice, formatTime12Hour } from '../utils/helpers';
import ThemeSelector from '../components/ThemeSelector';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Bookings
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({
    dateFrom: '',
    dateTo: '',
    preset: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Memberships
  const [memberships, setMemberships] = useState([]);
  const [membershipFilter, setMembershipFilter] = useState('all');
  
  // Rentals
  const [rentals, setRentals] = useState([]);
  const [rentalStats, setRentalStats] = useState(null);
  
  // College Events
  const [collegeBookings, setCollegeBookings] = useState([]);
  const [collegeStats, setCollegeStats] = useState(null);
  
  // Game Leaderboard
  const [gameLeaderboard, setGameLeaderboard] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [gamePeriod, setGamePeriod] = useState('all');
  
  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use AuthContext for authentication check (mobile-friendly)
  useEffect(() => {
    // Wait for AuthContext to finish loading
    if (authLoading) return;
    
    // Check if user is authenticated and is admin
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminDashboard] Not authenticated as admin, redirecting to login');
      navigate('/login');
      return;
    }
    
    // User is authenticated as admin, load data
    console.log('[AdminDashboard] Admin authenticated, loading data...');
    loadAllData();
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    applyBookingFilters();
  }, [bookings, bookingFilters]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, bookingsData, usersData, membershipsData, analyticsData] = await Promise.all([
        getAdminStats(),
        getAllBookings(),
        getAdminUsers(),
        getAdminMemberships(),
        getAnalytics()
      ]);
      
      setStats(statsData.stats);
      setBookings(bookingsData.bookings);
      setUsers(usersData.users);
      setMemberships(membershipsData.memberships);
      setAnalytics(analyticsData);
      
      // Load rental, college, and game data
      await loadRentals();
      await loadCollegeBookings();
      await loadGameLeaderboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRentals = async () => {
  try {
    const rentalsData = await getRentals();
    setRentals(rentalsData.rentals || []);

    const statsData = await getRentalStats();
    setRentalStats(statsData.stats || null);
  } catch (err) {
    console.error("Error loading rentals:", err);
  }
};

  
  const loadCollegeBookings = async () => {
  try {
    const bookingsData = await getCollegeBookings();
    setCollegeBookings(bookingsData.bookings || []);

    const statsData = await getCollegeStats();
    setCollegeStats(statsData.stats || null);
  } catch (err) {
    console.error("Error loading college bookings:", err);
  }
};

  
  const loadGameLeaderboard = async () => {
  try {
    const leaderboardData = await getGameLeaderboard(gamePeriod, 100);
    setGameLeaderboard(leaderboardData.leaderboard || []);

    const statsData = await getGameStats();
    setGameStats(statsData.stats || null);
  } catch (err) {
    console.error("Error loading game leaderboard:", err);
  }
};


  const applyBookingFilters = () => {
    let filtered = [...bookings];
    
    // Apply date filters
    if (bookingFilters.dateFrom) {
      filtered = filtered.filter(b => b.booking_date >= bookingFilters.dateFrom);
    }
    if (bookingFilters.dateTo) {
      filtered = filtered.filter(b => b.booking_date <= bookingFilters.dateTo);
    }
    
    // Apply preset filters
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (bookingFilters.preset === 'today') {
      filtered = filtered.filter(b => b.booking_date === today);
    } else if (bookingFilters.preset === 'week') {
      filtered = filtered.filter(b => b.booking_date >= weekAgo);
    } else if (bookingFilters.preset === 'month') {
      filtered = filtered.filter(b => b.booking_date >= monthAgo);
    }
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleLogout = async () => {
    try {
      // Use AuthContext logout for proper state cleanup (mobile-friendly)
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/');
    }
  };

  const handleEdit = (booking) => {
    setEditingId(booking.id);
    setEditForm({
      start_time: booking.start_time,
      duration_minutes: booking.duration_minutes,
      total_price: booking.total_price
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (bookingId) => {
    try {
      setError(null);
      await updateBooking(bookingId, editForm);
      setEditingId(null);
      setEditForm({});
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      setError(null);
      await deleteBooking(bookingId);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDevices = (devices) => {
    return devices.map(d => {
      if (d.device_type === 'ps5') {
        return `PS5-${d.device_number} (${d.player_count}p)`;
      }
      return 'Driving Sim';
    }).join(', ');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Filtered users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.phone.includes(userSearch)
  );

  // Filtered memberships
  const filteredMemberships = membershipFilter === 'all' 
    ? memberships 
    : memberships.filter(m => m.status === membershipFilter);

  // Render Dashboard Stats
  const renderDashboard = () => (
    <div className="dashboard-stats fade-in">
      <div className="section-header-mobile">
        <h2 className="section-title">📊 Overview</h2>
        <span className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          
          <div className="stat-card stat-success">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active_memberships}</div>
              <div className="stat-label">Active Memberships</div>
            </div>
          </div>
          
          <div className="stat-card stat-info">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_bookings}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>
          
          <div className="stat-card stat-warning">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{stats.total_revenue.toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.month_bookings}</div>
              <div className="stat-label">This Month's Bookings</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <div className="stat-value">₹{stats.month_revenue.toLocaleString()}</div>
              <div className="stat-label">This Month's Revenue</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats.today_bookings}</div>
              <div className="stat-label">Today's Bookings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Bookings
  const renderBookings = () => (
    <div className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">📋 All Bookings ({filteredBookings.length})</h2>
        <button className="btn btn-primary" onClick={loadAllData}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Quick Filter:</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${bookingFilters.preset === 'all' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'all', dateFrom: '', dateTo: ''})}
            >
              All Time
            </button>
            <button 
              className={`filter-btn ${bookingFilters.preset === 'today' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'today'})}
            >
              Today
            </button>
            <button 
              className={`filter-btn ${bookingFilters.preset === 'week' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'week'})}
            >
              This Week
            </button>
            <button 
              className={`filter-btn ${bookingFilters.preset === 'month' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'month'})}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Custom Date Range:</label>
          <div className="date-filters">
            <input
              type="date"
              value={bookingFilters.dateFrom}
              onChange={(e) => setBookingFilters({...bookingFilters, dateFrom: e.target.value, preset: 'custom'})}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={bookingFilters.dateTo}
              onChange={(e) => setBookingFilters({...bookingFilters, dateTo: e.target.value, preset: 'custom'})}
              className="date-input"
            />
          </div>
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {filteredBookings.length > 0 && (
        <div className="pagination-controls">
          <div className="items-per-page">
            <label>Show:</label>
            <select value={itemsPerPage} onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
          <div className="page-info">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length}
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>📭 No bookings found</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table admin-table" id="bookings-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Duration</th>
                    <th>Devices</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map(booking => (
                    <tr key={booking.id}>
                      <td data-label="BOOKING ID"><span className="booking-id">#{booking.id}</span></td>
                      <td data-label="DATE & TIME">
                        <div className="date-time-cell">
                          <span className="date">{new Date(booking.booking_date).toLocaleDateString()}</span>
                          <span className="time">{formatTime12Hour(booking.start_time)}</span>
                        </div>
                      </td>
                      <td data-label="CUSTOMER">
                        <div className="customer-cell">
                          <span className="customer-name">{booking.customer_name}</span>
                          <span className="customer-phone">{booking.customer_phone}</span>
                        </div>
                      </td>
                      <td data-label="DURATION">
                        {editingId === booking.id ? (
                          <select
                            value={editForm.duration_minutes}
                            onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) })}
                            className="form-control"
                          >
                            <option value={30}>30 min</option>
                            <option value={60}>1 hr</option>
                            <option value={90}>1.5 hr</option>
                            <option value={120}>2 hr</option>
                          </select>
                        ) : (
                          formatDuration(booking.duration_minutes)
                        )}
                      </td>
                      <td className="devices" data-label="DEVICES">{formatDevices(booking.devices)}</td>
                      <td data-label="PRICE">
                        {editingId === booking.id ? (
                          <input
                            type="number"
                            value={editForm.total_price}
                            onChange={(e) => setEditForm({ ...editForm, total_price: parseFloat(e.target.value) })}
                            className="form-control"
                          />
                        ) : (
                          <span className="price">{formatPrice(booking.total_price)}</span>
                        )}
                      </td>
                      <td data-label="ACTIONS">
                        {editingId === booking.id ? (
                          <div className="action-buttons">
                            <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(booking.id)}>
                              <FiSave />  <span className="btn-text">Save</span>
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                              <FiX /> <span className="btn-text">Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(booking)}>
                              <FiEdit2 />  <span className="btn-text">Edit</span>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(booking.id)}>
                              <FiTrash2 />  <span className="btn-text">Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Bottom */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Show first, last, current, and neighbors
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Users
  const renderUsers = () => (
    <div className="users-section">
      <div className="section-header">
        <h2 className="section-title">👥 Registered Users ({filteredUsers.length})</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>👤 No users found</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              <div className="user-details">
                <div className="user-detail-item">
                  <span className="detail-label">📱 Phone:</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
                <div className="user-detail-item">
                  <span className="detail-label">📅 Joined:</span>
                  <span className="detail-value">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                {user.membership_status === 'active' ? (
                  <div className="membership-badge active">
                    💳 {user.plan_type} ({user.discount_percentage}% off)
                    <br />
                    <small>{user.days_remaining} days remaining</small>
                  </div>
                ) : (
                  <div className="membership-badge inactive">
                    No active membership
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Memberships
  const renderMemberships = () => (
    <div className="memberships-section">
      <div className="section-header">
        <h2 className="section-title">💳 Membership Subscriptions ({filteredMemberships.length})</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${membershipFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${membershipFilter === 'active' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${membershipFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('expired')}
          >
            Expired
          </button>
          <button 
            className={`filter-btn ${membershipFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredMemberships.length === 0 ? (
        <div className="empty-state">
          <p>💳 No memberships found</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map(membership => (
                  <tr key={membership.id}>
                    <td className="membership-id" data-label="ID">#{membership.id}</td>
                    <td className="user-name" data-label="USER">{membership.user_name}</td>
                    <td data-label="EMAIL">{membership.user_email}</td>
                    <td data-label="PLAN">
                        <span className={`plan-badge ${membership.plan_type}`}>
                          {membership.plan_type}
                        </span>
                      </td>
                      <td data-label="START DATE">{new Date(membership.start_date).toLocaleDateString()}</td>
                      <td data-label="END DATE">{new Date(membership.end_date).toLocaleDateString()}</td>
                      <td className="discount" data-label="DISCOUNT">{membership.discount_percentage}%</td>
                      <td data-label="STATUS">
                        <span className={`status-badge ${membership.status}`}>
                          {membership.status}
                        </span>
                      </td>
                      <td data-label="DAYS LEFT">
                        {membership.days_remaining !== null ? (
                          <span className={membership.days_remaining > 7 ? 'days-ok' : 'days-expiring'}>
                            {membership.days_remaining > 0 ? `${membership.days_remaining} days` : 'Expired'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-header">
        <h2 className="section-title">
          <FiActivity /> Analytics & Visitor Insights
        </h2>
        <p className="section-subtitle">Track website traffic, visitor behavior, and engagement metrics</p>
      </div>

      {analytics ? (
        <>
          {/* Key Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon visitors">
                <FiEye />
              </div>
              <div className="stat-content">
                <div className="stat-value">{analytics.total_visits?.toLocaleString() || '0'}</div>
                <div className="stat-label">Total Visits</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon trending">
                <FiTrendingUp />
              </div>
              <div className="stat-content">
                <div className="stat-value">{analytics.today_visits || '0'}</div>
                <div className="stat-label">Today's Visits</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pages">
                <FiGlobe />
              </div>
              <div className="stat-content">
                <div className="stat-value">{analytics.unique_pages || '0'}</div>
                <div className="stat-label">Unique Pages</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon hourly">
                <FiClock />
              </div>
              <div className="stat-content">
                <div className="stat-value">{analytics.peak_hour || 'N/A'}</div>
                <div className="stat-label">Peak Hour</div>
              </div>
            </div>
          </div>

          {/* Top Pages */}
          {analytics.top_pages && analytics.top_pages.length > 0 && (
            <div className="analytics-card">
              <h3 className="card-title">
                <FiTrendingUp /> Top Pages
              </h3>
              <div className="table-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Visits</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_pages.map((page, index) => (
                      <tr key={index}>
                        <td className="page-path">{page.page}</td>
                        <td className="visit-count">{page.visits}</td>
                        <td>
                          <div className="percentage-bar">
                            <div 
                              className="percentage-fill" 
                              style={{ width: `${(page.visits / analytics.total_visits * 100).toFixed(0)}%` }}
                            ></div>
                            <span className="percentage-text">
                              {(page.visits / analytics.total_visits * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Browser & Device Stats */}
          <div className="analytics-grid">
            {/* Browsers */}
            {analytics.browsers && analytics.browsers.length > 0 && (
              <div className="analytics-card">
                <h3 className="card-title">
                  <FiMonitor /> Browsers
                </h3>
                <div className="browser-list">
                  {analytics.browsers.map((browser, index) => (
                    <div key={index} className="browser-item">
                      <div className="browser-name">{browser.browser}</div>
                      <div className="browser-stats">
                        <span className="browser-count">{browser.count} visits</span>
                        <div className="browser-bar">
                          <div 
                            className="browser-bar-fill" 
                            style={{ width: `${(browser.count / analytics.total_visits * 100).toFixed(0)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devices */}
            {analytics.devices && analytics.devices.length > 0 && (
              <div className="analytics-card">
                <h3 className="card-title">
                  <FiSmartphone /> Devices
                </h3>
                <div className="device-list">
                  {analytics.devices.map((device, index) => (
                    <div key={index} className="device-item">
                      <div className="device-name">{device.device}</div>
                      <div className="device-stats">
                        <span className="device-count">{device.count} visits</span>
                        <div className="device-bar">
                          <div 
                            className="device-bar-fill" 
                            style={{ width: `${(device.count / analytics.total_visits * 100).toFixed(0)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hourly Activity */}
          {analytics.hourly_stats && analytics.hourly_stats.length > 0 && (
            <div className="analytics-card">
              <h3 className="card-title">
                <FiClock /> Hourly Activity (Last 24 Hours)
              </h3>
              <div className="hourly-chart">
                {analytics.hourly_stats.map((stat, index) => {
                  const maxVisits = Math.max(...analytics.hourly_stats.map(s => s.visits));
                  const heightPercent = maxVisits > 0 ? (stat.visits / maxVisits * 100) : 0;
                  
                  return (
                    <div key={index} className="hourly-bar-container">
                      <div 
                        className="hourly-bar" 
                        style={{ height: `${heightPercent}%` }}
                        title={`${stat.visits} visits`}
                      >
                        <span className="hourly-value">{stat.visits}</span>
                      </div>
                      <div className="hourly-label">{stat.hour}h</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Visits */}
          {analytics.recent_visits && analytics.recent_visits.length > 0 && (
            <div className="analytics-card">
              <h3 className="card-title">
                <FiActivity /> Recent Activity
              </h3>
              <div className="table-container">
                <table className="recent-visits-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Page</th>
                      <th>Browser</th>
                      <th>Device</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent_visits.slice(0, 10).map((visit, index) => (
                      <tr key={index}>
                        <td className="visit-time">
                          {new Date(visit.visit_time).toLocaleString()}
                        </td>
                        <td className="visit-page">{visit.page}</td>
                        <td className="visit-browser">{visit.browser || 'Unknown'}</td>
                        <td className="visit-device">{visit.device || 'Unknown'}</td>
                        <td className="visit-location">{visit.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          <FiActivity className="no-data-icon" />
          <p>No analytics data available yet. Start tracking visits to see insights!</p>
        </div>
      )}
    </div>
  );

  // Render Rentals Section
  const renderRentals = () => (
    <div className="rentals-section">
      <div className="section-header">
        <h2 className="section-title"><FiPackage /> Rental Bookings ({rentals.length})</h2>
        <button className="btn btn-primary" onClick={loadRentals}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {rentalStats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{rentalStats.total_rentals || 0}</div>
              <div className="stat-label">Total Rentals (30d)</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{(rentalStats.total_revenue || 0).toLocaleString()}</div>
              <div className="stat-label">Revenue (30d)</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">🥽</div>
            <div className="stat-content">
              <div className="stat-value">{rentalStats.vr_rentals || 0}</div>
              <div className="stat-label">VR Rentals</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <div className="stat-value">{rentalStats.ps5_rentals || 0}</div>
              <div className="stat-label">PS5 Rentals</div>
            </div>
          </div>
        </div>
      )}

      {rentals.length === 0 ? (
        <div className="empty-state">
          <p>📦 No rental bookings yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Device</th>
                  <th>Start Date</th>
                  <th>Days</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(rental => (
                  <tr key={rental.id}>
                    <td className="rental-id">{rental.booking_id}</td>
                    <td>{rental.customer_name}</td>
                    <td>{rental.customer_phone}</td>
                    <td>
                      <span className={`device-badge ${rental.device_type}`}>
                        {rental.device_type?.toUpperCase()}
                        {rental.extra_controllers > 0 && ` +${rental.extra_controllers}C`}
                      </span>
                    </td>
                    <td>{rental.start_date ? new Date(rental.start_date).toLocaleDateString() : '-'}</td>
                    <td>{rental.rental_days}</td>
                    <td>₹{rental.total_price?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${rental.status}`}>
                        {rental.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Render College Events Section
  const renderCollegeEvents = () => (
    <div className="college-section">
      <div className="section-header">
        <h2 className="section-title"><FiUsers /> College Event Bookings ({collegeBookings.length})</h2>
        <button className="btn btn-primary" onClick={loadCollegeBookings}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {collegeStats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <div className="stat-value">{collegeStats.total_inquiries || 0}</div>
              <div className="stat-label">Total Inquiries (90d)</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{collegeStats.confirmed_events || 0}</div>
              <div className="stat-label">Confirmed Events</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{(collegeStats.total_students_reached || 0).toLocaleString()}</div>
              <div className="stat-label">Students Reached</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{(collegeStats.total_revenue || 0).toLocaleString()}</div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>
        </div>
      )}

      {collegeBookings.length === 0 ? (
        <div className="empty-state">
          <p>🎓 No college event bookings yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>College</th>
                  <th>Event</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Students</th>
                  <th>Distance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collegeBookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="booking-ref">{booking.booking_reference}</td>
                    <td>
                      <strong>{booking.college_name}</strong>
                      <br />
                      <small>{booking.college_city}</small>
                    </td>
                    <td>
                      {booking.event_name}
                      <br />
                      <small>{booking.event_type}</small>
                    </td>
                    <td>
                      {booking.contact_name}
                      <br />
                      <small>{booking.contact_phone}</small>
                    </td>
                    <td>
                      {booking.event_start_date ? new Date(booking.event_start_date).toLocaleDateString() : '-'}
                      <br />
                      <small>{booking.event_duration_days} days</small>
                    </td>
                    <td>{booking.expected_students}</td>
                    <td>{booking.estimated_distance_km?.toFixed(1)} km</td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Render Game Leaderboard Section
  const renderGameLeaderboard = () => (
    <div className="game-section">
      <div className="section-header">
        <h2 className="section-title"><FiTarget /> Game Leaderboard</h2>
        <div className="period-selector">
          <button 
            className={`btn ${gamePeriod === 'daily' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setGamePeriod('daily'); loadGameLeaderboard(); }}
          >
            Today
          </button>
          <button 
            className={`btn ${gamePeriod === 'weekly' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setGamePeriod('weekly'); loadGameLeaderboard(); }}
          >
            This Week
          </button>
          <button 
            className={`btn ${gamePeriod === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setGamePeriod('monthly'); loadGameLeaderboard(); }}
          >
            This Month
          </button>
          <button 
            className={`btn ${gamePeriod === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setGamePeriod('all'); loadGameLeaderboard(); }}
          >
            All Time
          </button>
        </div>
      </div>

      {gameStats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <div className="stat-value">{gameStats.total_games || 0}</div>
              <div className="stat-label">Total Games Played</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{gameStats.unique_players || 0}</div>
              <div className="stat-label">Unique Players</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{gameStats.highest_score || 0}</div>
              <div className="stat-label">Highest Score</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{gameStats.avg_accuracy?.toFixed(1) || 0}%</div>
              <div className="stat-label">Avg Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {gameLeaderboard.length === 0 ? (
        <div className="empty-state">
          <p>🎯 No game scores yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Enemies</th>
                  <th>Bosses</th>
                  <th>Accuracy</th>
                  <th>Games</th>
                  <th>Last Played</th>
                </tr>
              </thead>
              <tbody>
                {gameLeaderboard.map((entry, index) => (
                  <tr key={entry.player_name || index} className={index === 0 ? 'winner-row' : ''}>
                    <td className="rank-cell">
                      {index === 0 && <span className="trophy">🥇</span>}
                      {index === 1 && <span className="trophy">🥈</span>}
                      {index === 2 && <span className="trophy">🥉</span>}
                      #{entry.rank || index + 1}
                    </td>
                    <td><strong>{entry.player_name}</strong></td>
                    <td className="score-cell">{entry.score}</td>
                    <td>{entry.total_enemies || 0}</td>
                    <td>{entry.total_bosses || 0}</td>
                    <td>{entry.best_accuracy?.toFixed(1) || 0}%</td>
                    <td>{entry.games_played || 1}</td>
                    <td>{entry.last_played ? new Date(entry.last_played).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="admin-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem' }}>Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-sidebar-layout">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">🎮</span>
            <span className="logo-text">GameSpot</span>
          </div>
          <span className="sidebar-badge">Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Main</span>
            <button 
              className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FiBarChart2 className="nav-icon" />
              <span className="nav-label">Dashboard</span>
            </button>
            <button 
              className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <FiCalendar className="nav-icon" />
              <span className="nav-label">Bookings</span>
            </button>
            <button 
              className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <FiUsers className="nav-icon" />
              <span className="nav-label">Users</span>
            </button>
          </div>
          
          <div className="nav-section">
            <span className="nav-section-title">Services</span>
            <button 
              className={`sidebar-nav-item ${activeTab === 'memberships' ? 'active' : ''}`}
              onClick={() => setActiveTab('memberships')}
            >
              <FiCreditCard className="nav-icon" />
              <span className="nav-label">Memberships</span>
            </button>
            <button 
              className={`sidebar-nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
              onClick={() => setActiveTab('rentals')}
            >
              <FiPackage className="nav-icon" />
              <span className="nav-label">Rentals</span>
            </button>
            <button 
              className={`sidebar-nav-item ${activeTab === 'college' ? 'active' : ''}`}
              onClick={() => setActiveTab('college')}
            >
              <FiUsers className="nav-icon" />
              <span className="nav-label">College Events</span>
            </button>
          </div>
          
          <div className="nav-section">
            <span className="nav-section-title">Insights</span>
            <button 
              className={`sidebar-nav-item ${activeTab === 'game' ? 'active' : ''}`}
              onClick={() => setActiveTab('game')}
            >
              <FiTarget className="nav-icon" />
              <span className="nav-label">Leaderboard</span>
            </button>
            <button 
              className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FiActivity className="nav-icon" />
              <span className="nav-label">Analytics</span>
            </button>
          </div>
          
          <div className="nav-section">
            <span className="nav-section-title">System</span>
            <button 
              className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FiSettings className="nav-icon" />
              <span className="nav-label">Settings</span>
            </button>
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <button className="sidebar-nav-item home-btn" onClick={() => navigate('/')}>
            <FiHome className="nav-icon" />
            <span className="nav-label">Back to Site</span>
          </button>
          <button className="sidebar-nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <div className="topbar-title">
            <h1>
              {activeTab === 'dashboard' && '📊 Dashboard Overview'}
              {activeTab === 'bookings' && '📋 Booking Management'}
              {activeTab === 'users' && '👥 User Management'}
              {activeTab === 'memberships' && '💳 Memberships'}
              {activeTab === 'rentals' && '📦 Rentals'}
              {activeTab === 'college' && '🎓 College Events'}
              {activeTab === 'game' && '🎯 Game Leaderboard'}
              {activeTab === 'analytics' && '📈 Analytics'}
              {activeTab === 'settings' && '⚙️ Settings'}
            </h1>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary btn-refresh" onClick={loadAllData}>
              <FiRefreshCw /> Refresh Data
            </button>
          </div>
        </header>

        <div className="admin-content-wrapper">
          {error && <div className="error">❌ {error}</div>}

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <div className="tab-content">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'bookings' && renderBookings()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'memberships' && renderMemberships()}
              {activeTab === 'rentals' && renderRentals()}
              {activeTab === 'college' && renderCollegeEvents()}
              {activeTab === 'game' && renderGameLeaderboard()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'settings' && (
                <div className="settings-content">
                  <ThemeSelector />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
