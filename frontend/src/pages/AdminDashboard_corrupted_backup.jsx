import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, analyticsData, bookingsData, usersData, membershipsData] = await Promise.all([
        getAdminStats(),
        getAnalytics(),
        getAllBookings(),
        getAdminUsers(),
        getAdminMemberships()
      ]);
      
      setStats(statsData.stats);
      setAnalytics(analyticsData.analytics);
      setBookings(bookingsData.bookings);
      setUsers(usersData.users);
      setMemberships(membershipsData.memberships);
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
  FiActivity
} from 'react-icons/fi';
import { 
  getAllBookings, 
  updateBooking, 
  deleteBooking, 
  adminLogout, 
  checkAdminSession,
  getAdminUsers,
  getAdminMemberships,
  getAdminStats,
  getAnalytics
} from '../services/api';
import { formatDuration, formatPrice, formatTime12Hour } from '../utils/helpers';
import ThemeSelector from '../components/ThemeSelector';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
  
  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyBookingFilters();
  }, [bookings, bookingFilters]);

  const checkAuth = async () => {
    try {
      const response = await checkAdminSession();
      if (!response.authenticated) {
        navigate('/login');
      } else {
        loadAllData();
      }
    } catch (err) {
      console.error('Admin auth check failed:', err);
      navigate('/login');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, bookingsData, usersData, membershipsData] = await Promise.all([
        getAdminStats(),
        getAllBookings(),
        getAdminUsers(),
        getAdminMemberships()
      ]);
      
      setStats(statsData.stats);
      setBookings(bookingsData.bookings);
      setUsers(usersData.users);
      setMemberships(membershipsData.memberships);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      await adminLogout();
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
    <div className="dashboard-stats">
      <h2 className="section-title">📊 Dashboard Overview</h2>
      
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
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Devices</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="booking-id">#{booking.id}</td>
                      <td className="customer-name">{booking.customer_name}</td>
                      <td>{booking.customer_phone}</td>
                      <td>{booking.booking_date}</td>
                      <td>
                        {editingId === booking.id ? (
                          <input
                            type="time"
                            value={editForm.start_time}
                            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                            className="form-control"
                          />
                        ) : (
                          <span className="time-display">{formatTime12Hour(booking.start_time)}</span>
                        )}
                      </td>
                      <td>
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
                      <td className="devices">{formatDevices(booking.devices)}</td>
                      <td>
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
                      <td>
                        {editingId === booking.id ? (
                          <div className="action-buttons">
                            <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(booking.id)}>
                              <FiSave /> Save
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                              <FiX /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(booking)}>
                              <FiEdit2 /> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(booking.id)}>
                              <FiTrash2 /> Delete
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
                    <td className="membership-id">#{membership.id}</td>
                    <td className="user-name">{membership.user_name}</td>
                    <td>{membership.user_email}</td>
                    <td>
                      <span className={`plan-badge ${membership.plan_type}`}>
                        {membership.plan_type}
                      </span>
                    </td>
                    <td>{new Date(membership.start_date).toLocaleDateString()}</td>
                    <td>{new Date(membership.end_date).toLocaleDateString()}</td>
                    <td className="discount">{membership.discount_percentage}%</td>
                    <td>
                      <span className={`status-badge ${membership.status}`}>
                        {membership.status}
                      </span>
                    </td>
                    <td>
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

  return (
    <div className="admin-dashboard">
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>GameSpot Admin</div>
        <div className="navbar-buttons">
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <FiHome /> Home
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiBarChart2 /> Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FiCalendar /> Bookings
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> Users
          </button>
          <button 
            className={`tab ${activeTab === 'memberships' ? 'active' : ''}`}
            onClick={() => setActiveTab('memberships')}
          >
            <FiCreditCard /> Memberships
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings /> Settings
          </button>
        </div>

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
            {activeTab === 'settings' && (
              <div className="settings-content">
                <h2 className="section-title">⚙️ Website Settings</h2>
                <ThemeSelector />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
