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
  FiTarget,
  FiZap,
  FiCheckCircle,
  FiMenu
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
  getGameStats,
  approveMembership,
  rejectMembership,
  getPartyBookings,
  deletePartyBooking,
  getAdminQuestPasses,
  approveQuestPass,
  rejectQuestPass,
  updateQuestProgress
} from '../services/api';
import { useAuth } from '../context/AuthContext';

import { formatDuration, formatPrice, formatTime12Hour } from '../utils/helpers';
import ThemeSelector from '../components/ThemeSelector';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const mobileNavRef = React.useRef(null);
  
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
  
  // Party Bookings
  const [partyBookings, setPartyBookings] = useState([]);
  
  // Quest Pass
  const [questPasses, setQuestPasses] = useState([]);
  const [questPassStats, setQuestPassStats] = useState({ total: 0, pending: 0, active: 0 });
  
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

  // Scroll active mobile nav tab into view
  useEffect(() => {
    if (mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector('.mobile-nav-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    applyBookingFilters();
  }, [bookings, bookingFilters]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.allSettled so one failing API doesn't break all data loading
      const [statsResult, bookingsResult, usersResult, membershipsResult, analyticsResult] = await Promise.allSettled([
        getAdminStats(),
        getAllBookings(),
        getAdminUsers(),
        getAdminMemberships(),
        getAnalytics()
      ]);
      
      // Set data from successful responses, use defaults for failed ones
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.stats);
      if (bookingsResult.status === 'fulfilled') setBookings(bookingsResult.value.bookings || []);
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value.users || []);
      if (membershipsResult.status === 'fulfilled') setMemberships(membershipsResult.value.memberships || []);
      if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
      
      // Load secondary data (each has its own error handling)
      await loadRentals();
      await loadCollegeBookings();
      await loadGameLeaderboard();
      await loadPartyBookings();
      await loadQuestPasses();
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

  const loadPartyBookings = async () => {
    try {
      const data = await getPartyBookings();
      setPartyBookings(data.party_bookings || []);
    } catch (err) {
      console.error("Error loading party bookings:", err);
    }
  };

  const handleDeletePartyBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this party booking?')) return;
    try {
      setError(null);
      await deletePartyBooking(bookingId);
      loadPartyBookings();
      loadAllData(); // Refresh overall stats too
    } catch (err) {
      setError(err.message);
    }
  };

  const loadQuestPasses = async () => {
    try {
      const data = await getAdminQuestPasses();
      setQuestPasses(data.quest_passes || []);
      setQuestPassStats(data.stats || { total: 0, pending: 0, active: 0 });
    } catch (err) {
      console.error("Error loading quest passes:", err);
    }
  };

  const handleApproveQuestPass = async (passId) => {
    const device = prompt('Assign PS5 unit number (1, 2, or 3):');
    if (!device) return;
    const deviceNum = parseInt(device);
    if (![1, 2, 3].includes(deviceNum)) {
      alert('Invalid PS5 unit. Must be 1, 2, or 3.');
      return;
    }
    const notes = prompt('Admin notes (optional):') || '';
    try {
      setError(null);
      await approveQuestPass(passId, deviceNum, notes);
      loadQuestPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectQuestPass = async (passId) => {
    const reason = prompt('Reason for rejection (optional):') || '';
    if (!window.confirm('Reject this Quest Pass request?')) return;
    try {
      setError(null);
      await rejectQuestPass(passId, reason);
      loadQuestPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateQuestProgress = async (passId) => {
    const hours = prompt('Hours played this session:');
    if (!hours) return;
    const notes = prompt('Progress notes (e.g., "Completed Chapter 3"):') || '';
    try {
      setError(null);
      await updateQuestProgress(passId, parseFloat(hours), notes);
      loadQuestPasses();
    } catch (err) {
      setError(err.message);
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

  const pendingMembershipsCount = memberships.filter(m => m.status === 'pending').length;

  // Handle membership approval
  const handleApproveMembership = async (membershipId) => {
    try {
      const result = await approveMembership(membershipId);
      if (result.success) {
        alert('✅ Membership approved and activated!');
        // Refresh memberships
        const membershipsData = await getAdminMemberships();
        setMemberships(membershipsData.memberships || []);
      } else {
        alert('❌ ' + (result.error || 'Failed to approve'));
      }
    } catch (err) {
      console.error('Error approving membership:', err);
      alert('❌ Error approving membership');
    }
  };

  // Handle membership rejection
  const handleRejectMembership = async (membershipId) => {
    if (!window.confirm('Are you sure you want to reject this membership request?')) return;
    try {
      const result = await rejectMembership(membershipId);
      if (result.success) {
        alert('Membership request rejected.');
        const membershipsData = await getAdminMemberships();
        setMemberships(membershipsData.memberships || []);
      } else {
        alert('❌ ' + (result.error || 'Failed to reject'));
      }
    } catch (err) {
      console.error('Error rejecting membership:', err);
      alert('❌ Error rejecting membership');
    }
  };

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
          <div className="bookings-list">
            {currentBookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-header">
                  <div className="booking-card-id">#{booking.id}</div>
                  <div className="booking-card-price">{formatPrice(booking.total_price)}</div>
                </div>
                <div className="booking-card-body">
                  <div className="booking-card-customer">
                    <div className="customer-name">{booking.customer_name}</div>
                    <div className="customer-phone">{booking.customer_phone}</div>
                  </div>
                  <div className="booking-card-details">
                    <div className="detail-item">
                      <FiCalendar className="icon" />
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <FiClock className="icon" />
                      <span>{formatTime12Hour(booking.start_time)}</span>
                    </div>
                    <div className="detail-item">
                      <FiZap className="icon" />
                      <span>{formatDuration(booking.duration_minutes)}</span>
                    </div>
                  </div>
                  <div className="booking-card-devices">
                    {formatDevices(booking.devices)}
                  </div>
                </div>
                <div className="booking-card-actions">
                  {editingId === booking.id ? (
                    <>
                      <div className="edit-form-grid">
                        <select
                          value={editForm.duration_minutes}
                          onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) })}
                        >
                          <option value={30}>30 min</option>
                          <option value={60}>1 hr</option>
                          <option value={90}>1.5 hr</option>
                          <option value={120}>2 hr</option>
                        </select>
                        <input
                          type="number"
                          value={editForm.total_price}
                          onChange={(e) => setEditForm({ ...editForm, total_price: parseFloat(e.target.value) })}
                          placeholder="Price"
                        />
                      </div>
                      <div className="action-buttons">
                        <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(booking.id)}>
                          <FiSave /> Save
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                          <FiX /> Cancel
                        </button>
                      </div>
                    </>
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
                </div>
              </div>
            ))}
          </div>

          {/* Fallback Table for larger screens if needed, hidden on mobile */}
          <div className="table-container-desktop">
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
        <h2 className="section-title">
          💳 Membership Subscriptions ({filteredMemberships.length})
          {pendingMembershipsCount > 0 && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              padding: '3px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              marginLeft: '0.75rem',
              fontWeight: '600',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              {pendingMembershipsCount} pending
            </span>
          )}
        </h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${membershipFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${membershipFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('pending')}
            style={pendingMembershipsCount > 0 ? { borderColor: '#d97706', color: membershipFilter === 'pending' ? '#fff' : '#d97706', background: membershipFilter === 'pending' ? '#d97706' : 'transparent' } : {}}
          >
            Pending {pendingMembershipsCount > 0 && `(${pendingMembershipsCount})`}
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
            className={`filter-btn ${membershipFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setMembershipFilter('rejected')}
          >
            Rejected
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
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Hours</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Days Left</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map(membership => (
                  <tr key={membership.id} style={membership.status === 'pending' ? { background: 'rgba(245, 158, 11, 0.04)' } : {}}>
                    <td className="membership-id" data-label="ID">#{membership.id}</td>
                    <td className="user-name" data-label="USER">{membership.user_name}</td>
                    <td data-label="PHONE">{membership.user_phone || '-'}</td>
                    <td data-label="PLAN">
                        <span className={`plan-badge ${membership.plan_type}`}>
                          {membership.plan_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td data-label="HOURS">
                        {membership.total_hours > 0 ? (
                          <span>{membership.hours_used || 0}/{membership.total_hours} hrs</span>
                        ) : '-'}
                      </td>
                      <td data-label="START DATE">
                        {membership.status === 'pending' ? <em style={{ color: '#94a3b8' }}>On approval</em> : new Date(membership.start_date).toLocaleDateString()}
                      </td>
                      <td data-label="END DATE">
                        {membership.status === 'pending' ? <em style={{ color: '#94a3b8' }}>On approval</em> : new Date(membership.end_date).toLocaleDateString()}
                      </td>
                      <td data-label="STATUS">
                        <span className={`status-badge ${membership.status}`}>
                          {membership.status}
                        </span>
                      </td>
                      <td data-label="DAYS LEFT">
                        {membership.status === 'pending' ? (
                          <span style={{ color: '#d97706', fontWeight: '600' }}>Awaiting</span>
                        ) : membership.days_remaining !== null ? (
                          <span className={membership.days_remaining > 7 ? 'days-ok' : 'days-expiring'}>
                            {membership.days_remaining > 0 ? `${membership.days_remaining} days` : 'Expired'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td data-label="ACTIONS">
                        {membership.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApproveMembership(membership.id)}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRejectMembership(membership.id)}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
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
        <h2 className="section-title">🎓 College & Corporate Events ({collegeBookings.length})</h2>
      </div>

      {collegeStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <div className="stat-value">{collegeStats.total_bookings}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatPrice(collegeStats.total_revenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{collegeStats.total_participants}</div>
              <div className="stat-label">Total Participants</div>
            </div>
          </div>
        </div>
      )}

      {collegeBookings.length === 0 ? (
        <div className="empty-state">
          <p>🎓 No college or corporate events found.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>College/Company</th>
                  <th>Contact</th>
                  <th>Event Date</th>
                  <th>Participants</th>
                  <th>Total Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collegeBookings.map(booking => (
                  <tr key={booking.id}>
                    <td data-label="Booking Ref" className="booking-ref">#{booking.booking_reference}</td>
                    <td data-label="College/Company">{booking.college_name}</td>
                    <td data-label="Contact">
                      {booking.contact_person}<br />
                      <small>{booking.contact_email}</small><br />
                      <small>{booking.contact_phone}</small>
                    </td>
                    <td data-label="Event Date">{new Date(booking.event_date).toLocaleDateString()}</td>
                    <td data-label="Participants">{booking.participant_count}</td>
                    <td data-label="Total Price" className="price">{formatPrice(booking.total_price)}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
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

  // Render Quest Pass Management
  const renderQuestPasses = () => (
    <div className="admin-section fade-in">
      <div className="section-header-mobile">
        <h2 className="section-title">🏆 Quest Pass</h2>
        <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' }}>
          {questPassStats.pending} pending • {questPassStats.active} active
        </span>
      </div>
      
      {questPasses.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem' }}>🏆</span>
          <h3>No Quest Pass Subscriptions</h3>
          <p>Story Mode membership requests will appear here for approval.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Game</th>
                <th>Device</th>
                <th>Status</th>
                <th>Period</th>
                <th>Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questPasses.map(qp => (
                <tr key={qp.id}>
                  <td>
                    <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', padding: '3px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}>
                      🏆 #{qp.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: '#1e293b' }}>{qp.user_name || 'Unknown'}</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>{qp.user_phone || qp.user_email || ''}</small>
                    </div>
                  </td>
                  <td><strong style={{ color: '#334155' }}>{qp.game_name}</strong></td>
                  <td>
                    {qp.device_number ? (
                      <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', padding: '3px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                        PS5-{qp.device_number}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${qp.status}`}>
                      {qp.status === 'active' ? '✅' : qp.status === 'pending' ? '⏳' : '❌'} {qp.status}
                    </span>
                  </td>
                  <td>
                    {qp.start_date ? (
                      <small style={{ color: '#475569' }}>{new Date(qp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(qp.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ color: '#94a3b8' }}>—</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {qp.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleApproveQuestPass(qp.id)}
                          >
                            <FiCheckCircle /> Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleRejectQuestPass(qp.id)}
                          >
                            <FiX /> Reject
                          </button>
                        </>
                      )}
                      {qp.status === 'active' && (
                        <button 
                          className="btn btn-sm"
                          style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => handleUpdateQuestProgress(qp.id)}
                        >
                          <FiEdit2 /> Log Progress
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {questPassStats.active > 0 && (
        <div className="admin-summary-bar" style={{ marginTop: '1.25rem' }}>
          <div className="summary-stat">
            <span className="summary-label">Active Passes</span>
            <span className="summary-value" style={{ color: '#7c3aed' }}>
              {questPassStats.active}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Monthly Revenue</span>
            <span className="summary-value" style={{ color: '#7c3aed' }}>
              ₹{(questPassStats.active * 500).toLocaleString()}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Pending Requests</span>
            <span className="summary-value" style={{ color: '#d97706' }}>
              {questPassStats.pending}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Render Party Bookings
  const renderPartyBookings = () => (
    <div className="admin-section fade-in">
      <div className="section-header-mobile">
        <h2 className="section-title">🎉 Party Bookings</h2>
        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
          {partyBookings.length} total
        </span>
      </div>
      
      {partyBookings.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <h3>No Party Bookings</h3>
          <p>Party bookings (full shop reservations) will appear here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partyBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', padding: '3px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}>
                      🎉 #{booking.id}
                    </span>
                  </td>
                  <td style={{ color: '#1e293b', fontWeight: 600 }}>{booking.customer_name}</td>
                  <td style={{ color: '#475569' }}>{booking.customer_phone}</td>
                  <td style={{ color: '#334155' }}>{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style={{ color: '#334155' }}>{formatTime12Hour(booking.start_time)}</td>
                  <td>
                    <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '3px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                      {booking.hours || booking.duration_minutes / 60} hr{(booking.hours || booking.duration_minutes / 60) > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td><strong style={{ color: '#059669' }}>₹{booking.total_price.toLocaleString()}</strong></td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(booking.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleDeletePartyBooking(booking.id)}
                      title="Delete party booking"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {partyBookings.length > 0 && (
        <div className="admin-summary-bar" style={{ marginTop: '1.25rem' }}>
          <div className="summary-stat">
            <span className="summary-label">Total Party Revenue</span>
            <span className="summary-value" style={{ color: '#d97706' }}>
              ₹{partyBookings.reduce((sum, b) => sum + b.total_price, 0).toLocaleString()}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Total Hours Booked</span>
            <span className="summary-value">
              {partyBookings.reduce((sum, b) => sum + (b.hours || b.duration_minutes / 60), 0)} hrs
            </span>
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'bookings': return renderBookings();
      case 'users': return renderUsers();
      case 'memberships': return renderMemberships();
      case 'rentals': return renderRentals();
      case 'college': return renderCollegeEvents();
      case 'leaderboard': return renderGameLeaderboard();
      case 'analytics': return renderAnalytics();
      case 'party': return renderPartyBookings();
      case 'questpass': return renderQuestPasses();
      default: return renderDashboard();
    }
  };

  return (
    <div className="admin-sidebar-layout">
      {/* Sidebar Navigation */}
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
            <button className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <FiBarChart2 className="nav-icon" />
              <span className="nav-label">Dashboard</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
              <FiCalendar className="nav-icon" />
              <span className="nav-label">Bookings</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <FiUsers className="nav-icon" />
              <span className="nav-label">Users</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'memberships' ? 'active' : ''}`} onClick={() => setActiveTab('memberships')}>
              <FiCreditCard className="nav-icon" />
              <span className="nav-label">Memberships</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Sections</span>
            <button className={`sidebar-nav-item ${activeTab === 'party' ? 'active' : ''}`} onClick={() => setActiveTab('party')}>
              <FiZap className="nav-icon" />
              <span className="nav-label">Party Bookings</span>
              {partyBookings.length > 0 && <span className="nav-badge">{partyBookings.length}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'questpass' ? 'active' : ''}`} onClick={() => setActiveTab('questpass')}>
              <FiAward className="nav-icon" />
              <span className="nav-label">Quest Pass</span>
              {questPassStats.pending > 0 && <span className="nav-badge">{questPassStats.pending}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
              <FiPackage className="nav-icon" />
              <span className="nav-label">Rentals</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'college' ? 'active' : ''}`} onClick={() => setActiveTab('college')}>
              <FiAward className="nav-icon" />
              <span className="nav-label">College</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
              <FiTarget className="nav-icon" />
              <span className="nav-label">Scores</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Analysis</span>
            <button className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <FiTrendingUp className="nav-icon" />
              <span className="nav-label">Analytics</span>
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

      {/* Main Content */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <div className="topbar-title">
            <h1>
              {activeTab === 'dashboard' && '📊 Dashboard Overview'}
              {activeTab === 'bookings' && '📋 Booking Management'}
              {activeTab === 'users' && '👥 User Management'}
              {activeTab === 'memberships' && '💳 Memberships'}
              {activeTab === 'party' && '🎉 Party Bookings'}
              {activeTab === 'questpass' && '🏆 Quest Pass Management'}
              {activeTab === 'rentals' && '📦 Rentals'}
              {activeTab === 'college' && '🎓 College Events'}
              {activeTab === 'leaderboard' && '🎯 Game Leaderboard'}
              {activeTab === 'analytics' && '📈 Analytics'}
              {activeTab === 'settings' && '⚙️ Settings'}
            </h1>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary btn-refresh" onClick={loadAllData}>
              <FiRefreshCw /> <span>Refresh Data</span>
            </button>
            <button className="mobile-topbar-home" onClick={() => navigate('/')} title="Back to Site">
              <FiHome />
            </button>
            <button className="mobile-topbar-logout" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Tab Navigation */}
        <div className="mobile-tab-nav" ref={mobileNavRef}>
          <button className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <FiBarChart2 /> <span>Dashboard</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            <FiCalendar /> <span>Bookings</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <FiUsers /> <span>Users</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'memberships' ? 'active' : ''}`} onClick={() => setActiveTab('memberships')}>
            <FiCreditCard /> <span>Members</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'party' ? 'active' : ''}`} onClick={() => setActiveTab('party')}>
            <FiZap /> <span>Party</span>
            {partyBookings.length > 0 && <span className="mobile-nav-badge">{partyBookings.length}</span>}
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'questpass' ? 'active' : ''}`} onClick={() => setActiveTab('questpass')}>
            <FiAward /> <span>Quest</span>
            {questPassStats.pending > 0 && <span className="mobile-nav-badge">{questPassStats.pending}</span>}
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
            <FiPackage /> <span>Rentals</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'college' ? 'active' : ''}`} onClick={() => setActiveTab('college')}>
            <FiAward /> <span>College</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            <FiTarget /> <span>Scores</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <FiTrendingUp /> <span>Analytics</span>
          </button>
        </div>

        <div className="admin-content-wrapper">
          {error && <div className="error">❌ {error}</div>}

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <div className="tab-content">
              {renderContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
