'use client';
// @ts-nocheck

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
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
  FiMenu,
  FiGift,
  FiDollarSign,
  FiPlusCircle,
  FiMinusCircle
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
  approveMembership,
  rejectMembership,
  approveGameRequest,
  rejectGameRequest,
  getPartyBookings,
  deletePartyBooking,
  getAdminQuestPasses,
  approveQuestPass,
  rejectQuestPass,
  updateQuestProgress,
  approveQuestPassGameChange,
  rejectQuestPassGameChange,
  getOfferClaims,
  approveOfferClaim,
  rejectOfferClaim,
  getFinancialSummary,
  getExpenses,
  addExpense,
  deleteExpense,
  getMonthlyFinancialSummary,
  getClosures,
  addClosure,
  deleteClosure,
  getAdminFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

import { formatDuration, formatPrice, formatTime12Hour } from '@/utils/helpers';
import ThemeSelector from '@/components/ThemeSelector';
import '@/styles/AdminDashboard.css';

const AdminDashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const mobileNavRef = React.useRef<HTMLDivElement>(null);
  
  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Bookings
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({
    dateFrom: '',
    dateTo: '',
    preset: 'all',
    status: 'all'
  });
  const [bookingSearch, setBookingSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState<any>({});
  
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
  
  // Party Bookings
  const [partyBookings, setPartyBookings] = useState([]);
  
  // Quest Pass
  const [questPasses, setQuestPasses] = useState([]);
  const [questPassStats, setQuestPassStats] = useState({ total: 0, pending: 0, active: 0 });
  
  // Offer Claims (Instagram Promo)
  const [offerClaims, setOfferClaims] = useState([]);
  const [offerClaimStats, setOfferClaimStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  
  // Feedback
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0, recent_week: 0 });
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all');
  
  // Financial Management
  const [financialSummary, setFinancialSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Miscellaneous',
    description: '',
    amount: ''
  });
  const [expenseFilter, setExpenseFilter] = useState('all');
  
  // Monthly Finance History
  const [monthlyData, setMonthlyData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  
  // Shop Closures
  const [closures, setClosures] = useState([]);
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [closureForm, setClosureForm] = useState({
    closure_date: new Date().toISOString().split('T')[0],
    closure_type: 'full_day',
    start_time: '10:00',
    end_time: '18:00',
    reason: ''
  });
  
  // Chart hover
  const [hoveredDay, setHoveredDay] = useState(null);
  
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
      router.push('/login');
      return;
    }
    
    // User is authenticated as admin, load data
    console.log('[AdminDashboard] Admin authenticated, loading data...');
    loadAllData();
  }, [authLoading, isAuthenticated, isAdmin, router]);

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
  }, [bookings, bookingFilters, bookingSearch]);

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
      await loadPartyBookings();
      await loadQuestPasses();
      await loadOfferClaims();
      await loadFeedback();
      await loadFinancialData();
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

  const handleApproveGameChange = async (passId, oldGame, newGame) => {
    if (!window.confirm(`Approve game change?\n"${oldGame}" → "${newGame}"`)) return;
    try {
      setError(null);
      await approveQuestPassGameChange(passId);
      loadQuestPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectGameChange = async (passId) => {
    if (!window.confirm('Reject this game change request?')) return;
    try {
      setError(null);
      await rejectQuestPassGameChange(passId);
      loadQuestPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Offer Claims (Instagram Promo) ───
  const loadOfferClaims = async () => {
    try {
      const data = await getOfferClaims();
      setOfferClaims(data.redemptions || []);
      setOfferClaimStats(data.statistics || { total: 0, pending: 0, verified: 0, rejected: 0 });
    } catch (err) {
      console.error("Error loading offer claims:", err);
    }
  };

  // ─── Feedback Management ───
  const loadFeedback = async () => {
    try {
      const [feedbackData, statsData] = await Promise.allSettled([
        getAdminFeedback(feedbackFilter, feedbackTypeFilter),
        getFeedbackStats()
      ]);
      if (feedbackData.status === 'fulfilled') setFeedbackList(feedbackData.value.feedback || []);
      if (statsData.status === 'fulfilled') setFeedbackStats(statsData.value.stats || { total: 0, pending: 0, reviewed: 0, resolved: 0, recent_week: 0 });
    } catch (err) {
      console.error("Error loading feedback:", err);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    const notes = prompt('Admin notes (optional):') || '';
    try {
      setError(null);
      await updateFeedbackStatus(feedbackId, newStatus, notes);
      loadFeedback();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      setError(null);
      await deleteFeedback(feedbackId);
      loadFeedback();
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Financial Management ───
  const loadFinancialData = async () => {
    try {
      const [summaryData, expensesData, closuresData] = await Promise.allSettled([
        getFinancialSummary(),
        getExpenses(),
        getClosures()
      ]);
      if (summaryData.status === 'fulfilled') setFinancialSummary(summaryData.value.summary || null);
      if (expensesData.status === 'fulfilled') setExpenses(expensesData.value.expenses || []);
      if (closuresData.status === 'fulfilled') setClosures(closuresData.value.closures || []);
    } catch (err) {
      console.error("Error loading financial data:", err);
    }
  };

  const loadMonthlyData = async (m, y) => {
    setLoadingMonthly(true);
    try {
      const data = await getMonthlyFinancialSummary(m, y);
      setMonthlyData(data.summary || null);
    } catch (err) {
      console.error("Error loading monthly data:", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    try {
      setError(null);
      await addExpense({
        expense_date: expenseForm.expense_date,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount)
      });
      setExpenseForm({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Miscellaneous',
        description: '',
        amount: ''
      });
      setShowExpenseForm(false);
      await loadFinancialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      setError(null);
      await deleteExpense(id);
      await loadFinancialData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Shop Closures ───
  const handleAddClosure = async (e) => {
    e.preventDefault();
    if (!closureForm.closure_date) return;
    try {
      setError(null);
      await addClosure({
        closure_date: closureForm.closure_date,
        closure_type: closureForm.closure_type,
        start_time: closureForm.closure_type === 'time_range' ? closureForm.start_time : undefined,
        end_time: closureForm.closure_type === 'time_range' ? closureForm.end_time : undefined,
        reason: closureForm.reason
      });
      setClosureForm({
        closure_date: new Date().toISOString().split('T')[0],
        closure_type: 'full_day',
        start_time: '10:00',
        end_time: '18:00',
        reason: ''
      });
      setShowClosureForm(false);
      await loadFinancialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClosure = async (id) => {
    if (!window.confirm('Remove this closure? Slots will become available again.')) return;
    try {
      setError(null);
      await deleteClosure(id);
      await loadFinancialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveOfferClaim = async (id) => {
    if (!window.confirm('Approve this claim? The user will get 30 free minutes.')) return;
    try {
      setError(null);
      await approveOfferClaim(id, 'Approved by admin');
      loadOfferClaims();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectOfferClaim = async (id) => {
    const reason = prompt('Reason for rejection (optional):') || '';
    if (!window.confirm('Reject this claim?')) return;
    try {
      setError(null);
      await rejectOfferClaim(id, reason);
      loadOfferClaims();
    } catch (err) {
      setError(err.message);
    }
  };

  const applyBookingFilters = () => {
    let filtered = [...bookings];
    
    // Apply text search (name, phone, or booking ID)
    if (bookingSearch.trim()) {
      const search = bookingSearch.trim().toLowerCase();
      filtered = filtered.filter(b => 
        (b.customer_name && b.customer_name.toLowerCase().includes(search)) ||
        (b.customer_phone && b.customer_phone.includes(search)) ||
        (b.id && b.id.toString().includes(search)) ||
        (b.status && b.status.toLowerCase().includes(search))
      );
    }
    
    // Apply date filters
    if (bookingFilters.dateFrom) {
      filtered = filtered.filter(b => b.booking_date >= bookingFilters.dateFrom);
    }
    if (bookingFilters.dateTo) {
      filtered = filtered.filter(b => b.booking_date <= bookingFilters.dateTo);
    }
    
    // Apply preset filters
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (bookingFilters.preset === 'today') {
      filtered = filtered.filter(b => b.booking_date === today);
    } else if (bookingFilters.preset === 'tomorrow') {
      filtered = filtered.filter(b => b.booking_date === tomorrow);
    } else if (bookingFilters.preset === 'week') {
      filtered = filtered.filter(b => b.booking_date >= weekAgo);
    } else if (bookingFilters.preset === 'month') {
      filtered = filtered.filter(b => b.booking_date >= monthAgo);
    }
    
    // Apply status filter
    if (bookingFilters.status && bookingFilters.status !== 'all') {
      filtered = filtered.filter(b => b.status === bookingFilters.status);
    }
    
    // Sort: newest bookings first (by id descending — higher id = more recently booked)
    filtered.sort((a, b) => b.id - a.id);
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleLogout = async () => {
    try {
      // Use AuthContext logout for proper state cleanup (mobile-friendly)
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/');
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

  // Handle game request approval
  const handleApproveGameRequest = async (membershipId, gameName) => {
    try {
      const result = await approveGameRequest(membershipId);
      if (result.success) {
        alert(`✅ Game "${gameName}" approved!`);
        const membershipsData = await getAdminMemberships();
        setMemberships(membershipsData.memberships || []);
      } else {
        alert('❌ ' + (result.error || 'Failed to approve game request'));
      }
    } catch (err) {
      console.error('Error approving game request:', err);
      alert('❌ Error approving game request');
    }
  };

  // Handle game request rejection
  const handleRejectGameRequest = async (membershipId, gameName) => {
    if (!window.confirm(`Reject game request "${gameName}"?`)) return;
    try {
      const result = await rejectGameRequest(membershipId);
      if (result.success) {
        alert(`Game request "${gameName}" rejected.`);
        const membershipsData = await getAdminMemberships();
        setMemberships(membershipsData.memberships || []);
      } else {
        alert('❌ ' + (result.error || 'Failed to reject game request'));
      }
    } catch (err) {
      console.error('Error rejecting game request:', err);
      alert('❌ Error rejecting game request');
    }
  };

  // Render Dashboard Stats
  const EXPENSE_CATEGORIES = [
    'Game Purchase', 'Staff Tea/Food', 'Maintenance', 'Electricity', 
    'Internet', 'Rent', 'Equipment', 'Transport', 'Miscellaneous'
  ];

  const CATEGORY_ICONS = {
    'Game Purchase': '🎮', 'Staff Tea/Food': '☕', 'Maintenance': '🔧',
    'Electricity': '⚡', 'Internet': '🌐', 'Rent': '🏠',
    'Equipment': '🖥️', 'Transport': '🚗', 'Miscellaneous': '📎'
  };

  const CATEGORY_COLORS = {
    'Game Purchase': '#ff6b35', 'Staff Tea/Food': '#10b981', 'Maintenance': '#f59e0b',
    'Electricity': '#3b82f6', 'Internet': '#8b5cf6', 'Rent': '#ef4444',
    'Equipment': '#06b6d4', 'Transport': '#f97316', 'Miscellaneous': '#6b7280'
  };

  const renderDashboard = () => {
    const summary = financialSummary;
    const chartData = summary?.chart_data || [];
    const maxChartValue = Math.max(...chartData.map(d => Math.max(d.revenue || 0, d.expenses || 0)), 1);

    const filteredExpenses = expenseFilter === 'all' 
      ? expenses 
      : expenses.filter(e => e.category === expenseFilter);

    return (
    <div className="dashboard-stats fade-in">
      <div className="section-header-mobile">
        <h2 className="section-title">📊 Overview</h2>
        <span className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
      
      {/* Quick Stats Row */}
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
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats.today_bookings}</div>
              <div className="stat-label">Today's Bookings</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Financial Summary Cards ─── */}
      {summary && (
        <div className="finance-section">
          <h3 className="finance-section-title">💰 Financial Summary</h3>
          <div className="finance-cards-grid">
            {/* Today */}
            <div className="finance-card finance-card-today">
              <div className="finance-card-header">
                <span className="finance-card-label">Today</span>
                <span className="finance-card-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="finance-card-body">
                <div className="finance-row revenue">
                  <span className="finance-dot revenue-dot"></span>
                  <span>Revenue</span>
                  <span className="finance-amount">₹{(summary.today?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="finance-row expense">
                  <span className="finance-dot expense-dot"></span>
                  <span>Expenses</span>
                  <span className="finance-amount">₹{(summary.today?.expenses || 0).toLocaleString()}</span>
                </div>
                <div className="finance-divider"></div>
                <div className={`finance-row profit ${(summary.today?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                  <span className="finance-profit-icon">{(summary.today?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                  <span>Profit</span>
                  <span className="finance-amount finance-profit">₹{(summary.today?.profit || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="finance-card-footer">
                <span>{summary.today?.bookings || 0} bookings</span>
              </div>
            </div>

            {/* This Week */}
            <div className="finance-card finance-card-week">
              <div className="finance-card-header">
                <span className="finance-card-label">This Week</span>
                <span className="finance-card-date">7 days</span>
              </div>
              <div className="finance-card-body">
                <div className="finance-row revenue">
                  <span className="finance-dot revenue-dot"></span>
                  <span>Revenue</span>
                  <span className="finance-amount">₹{(summary.week?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="finance-row expense">
                  <span className="finance-dot expense-dot"></span>
                  <span>Expenses</span>
                  <span className="finance-amount">₹{(summary.week?.expenses || 0).toLocaleString()}</span>
                </div>
                <div className="finance-divider"></div>
                <div className={`finance-row profit ${(summary.week?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                  <span className="finance-profit-icon">{(summary.week?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                  <span>Profit</span>
                  <span className="finance-amount finance-profit">₹{(summary.week?.profit || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="finance-card-footer">
                <span>{summary.week?.bookings || 0} bookings</span>
              </div>
            </div>

            {/* This Month */}
            <div className="finance-card finance-card-month">
              <div className="finance-card-header">
                <span className="finance-card-label">This Month</span>
                <span className="finance-card-date">{new Date().toLocaleDateString('en-IN', { month: 'long' })}</span>
              </div>
              <div className="finance-card-body">
                <div className="finance-row revenue">
                  <span className="finance-dot revenue-dot"></span>
                  <span>Revenue</span>
                  <span className="finance-amount">₹{(summary.month?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="finance-row expense">
                  <span className="finance-dot expense-dot"></span>
                  <span>Expenses</span>
                  <span className="finance-amount">₹{(summary.month?.expenses || 0).toLocaleString()}</span>
                </div>
                <div className="finance-divider"></div>
                <div className={`finance-row profit ${(summary.month?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                  <span className="finance-profit-icon">{(summary.month?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                  <span>Profit</span>
                  <span className="finance-amount finance-profit">₹{(summary.month?.profit || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="finance-card-footer">
                <span>{summary.month?.bookings || 0} bookings</span>
              </div>
            </div>
          </div>

          {/* ─── 30-Day Revenue vs Expenses Chart ─── */}
          {chartData.length > 0 && (
            <div className="finance-chart-container">
              <div className="finance-chart-header">
                <h4>📊 30-Day Revenue vs Expenses</h4>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot revenue-dot"></span> Revenue</span>
                  <span className="legend-item"><span className="legend-dot expense-dot"></span> Expenses</span>
                  <span className="legend-item"><span className="legend-dot profit-dot"></span> Profit</span>
                </div>
              </div>
              
              {/* Y-axis labels + bars */}
              <div className="better-chart">
                <div className="chart-y-axis">
                  <span className="y-label">₹{maxChartValue >= 1000 ? `${(maxChartValue / 1000).toFixed(0)}k` : maxChartValue}</span>
                  <span className="y-label">₹{maxChartValue >= 1000 ? `${(maxChartValue / 2000).toFixed(0)}k` : Math.round(maxChartValue / 2)}</span>
                  <span className="y-label">₹0</span>
                </div>
                <div className="chart-area">
                  <div className="chart-grid-lines">
                    <div className="grid-line"></div>
                    <div className="grid-line"></div>
                    <div className="grid-line"></div>
                  </div>
                  <div className="chart-bars-row">
                    {chartData.map((day, idx) => {
                      const revH = Math.max((day.revenue / maxChartValue) * 100, 1);
                      const expH = Math.max((day.expenses / maxChartValue) * 100, 1);
                      const isHovered = hoveredDay === idx;
                      const dateObj = new Date(day.date);
                      const dayNum = dateObj.getDate();
                      const showLabel = idx % 4 === 0 || idx === chartData.length - 1;
                      return (
                        <div 
                          className={`chart-col ${isHovered ? 'hovered' : ''}`} 
                          key={idx}
                          onMouseEnter={() => setHoveredDay(idx)}
                          onMouseLeave={() => setHoveredDay(null)}
                        >
                          {isHovered && (
                            <div className="chart-tooltip">
                              <div className="tooltip-date">{dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</div>
                              <div className="tooltip-row"><span className="t-dot revenue-dot"></span> ₹{day.revenue.toLocaleString()}</div>
                              <div className="tooltip-row"><span className="t-dot expense-dot"></span> ₹{day.expenses.toLocaleString()}</div>
                              <div className={`tooltip-row tooltip-profit ${day.profit >= 0 ? 'positive' : 'negative'}`}>
                                {day.profit >= 0 ? '↑' : '↓'} ₹{Math.abs(day.profit).toLocaleString()}
                              </div>
                              <div className="tooltip-bookings">{day.bookings} bookings</div>
                            </div>
                          )}
                          <div className="bar-group">
                            <div className="bar revenue-bar" style={{ height: `${revH}%` }}></div>
                            <div className="bar expense-bar" style={{ height: `${expH}%` }}></div>
                          </div>
                          <span className="x-label">{showLabel ? dayNum : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Quick summary under chart */}
              <div className="chart-summary-row">
                <div className="chart-summary-item">
                  <span className="cs-label">Total Revenue</span>
                  <span className="cs-value cs-revenue">₹{chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</span>
                </div>
                <div className="chart-summary-item">
                  <span className="cs-label">Total Expenses</span>
                  <span className="cs-value cs-expense">₹{chartData.reduce((s, d) => s + d.expenses, 0).toLocaleString()}</span>
                </div>
                <div className="chart-summary-item">
                  <span className="cs-label">Net Profit</span>
                  <span className={`cs-value ${chartData.reduce((s, d) => s + d.profit, 0) >= 0 ? 'cs-profit-pos' : 'cs-profit-neg'}`}>
                    ₹{chartData.reduce((s, d) => s + d.profit, 0).toLocaleString()}
                  </span>
                </div>
                <div className="chart-summary-item">
                  <span className="cs-label">Avg Daily</span>
                  <span className="cs-value">₹{Math.round(chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Category Breakdown ─── */}
          {summary.category_breakdown && summary.category_breakdown.length > 0 && (
            <div className="finance-categories">
              <h4 className="finance-categories-title">📂 Monthly Expense Breakdown</h4>
              <div className="category-breakdown-grid">
                {summary.category_breakdown.map((cat, idx) => {
                  const maxTotal = Math.max(...summary.category_breakdown.map(c => c.total), 1);
                  return (
                    <div className="category-breakdown-item" key={idx}>
                      <div className="category-breakdown-header">
                        <span className="category-icon">{CATEGORY_ICONS[cat.category] || '📎'}</span>
                        <span className="category-name">{cat.category}</span>
                        <span className="category-total">₹{cat.total.toLocaleString()}</span>
                      </div>
                      <div className="category-bar-track">
                        <div 
                          className="category-bar-fill" 
                          style={{ 
                            width: `${(cat.total / maxTotal) * 100}%`,
                            backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280'
                          }}
                        ></div>
                      </div>
                      <span className="category-count">{cat.count} entries</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Expense Management ─── */}
      <div className="finance-section">
        <div className="expense-management-header">
          <h3 className="finance-section-title">📝 Expense Management</h3>
          <button 
            className="btn btn-add-expense" 
            onClick={() => setShowExpenseForm(!showExpenseForm)}
          >
            {showExpenseForm ? <><FiX /> Cancel</> : <><FiPlusCircle /> Add Expense</>}
          </button>
        </div>

        {/* Add Expense Form */}
        {showExpenseForm && (
          <form className="expense-form" onSubmit={handleAddExpense}>
            <div className="expense-form-grid">
              <div className="expense-form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                  required
                />
              </div>
              <div className="expense-form-group">
                <label>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
              </div>
              <div className="expense-form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g., Purchased FIFA 25, Staff lunch..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="expense-form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-save-expense">
              <FiSave /> Save Expense
            </button>
          </form>
        )}

        {/* Expense Filter */}
        <div className="expense-filter-bar">
          <button 
            className={`expense-filter-btn ${expenseFilter === 'all' ? 'active' : ''}`}
            onClick={() => setExpenseFilter('all')}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`expense-filter-btn ${expenseFilter === cat ? 'active' : ''}`}
              onClick={() => setExpenseFilter(cat)}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Expense List */}
        <div className="expense-list">
          {filteredExpenses.length === 0 ? (
            <div className="expense-empty">
              <span className="expense-empty-icon">📭</span>
              <p>No expenses recorded{expenseFilter !== 'all' ? ` for "${expenseFilter}"` : ''}. Click "Add Expense" to start tracking.</p>
            </div>
          ) : (
            filteredExpenses.map(exp => (
              <div className="expense-item" key={exp.id}>
                <div className="expense-item-icon" style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6b7280') + '20', color: CATEGORY_COLORS[exp.category] || '#6b7280' }}>
                  {CATEGORY_ICONS[exp.category] || '📎'}
                </div>
                <div className="expense-item-details">
                  <span className="expense-item-desc">{exp.description}</span>
                  <span className="expense-item-meta">
                    <span className="expense-category-pill" style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6b7280') + '15', color: CATEGORY_COLORS[exp.category] || '#6b7280' }}>
                      {exp.category}
                    </span>
                    <span className="expense-item-date">{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                </div>
                <div className="expense-item-amount">₹{exp.amount.toLocaleString()}</div>
                <button className="expense-delete-btn" onClick={() => handleDeleteExpense(exp.id)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    );
  };

  // Render Bookings
  const renderBookings = () => (
    <div className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">📋 All Bookings ({filteredBookings.length})</h2>
        <button className="btn btn-primary" onClick={loadAllData}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="booking-search-container">
        <div className="booking-search-box">
          <FiTarget className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, or booking ID..."
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            className="booking-search-input"
          />
          {bookingSearch && (
            <button className="search-clear-btn" onClick={() => setBookingSearch('')}>
              <FiX />
            </button>
          )}
        </div>
        <div className="booking-status-filter">
          <label>Status:</label>
          <select
            value={bookingFilters.status}
            onChange={(e) => setBookingFilters({...bookingFilters, status: e.target.value})}
            className="status-select"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Quick Filter:</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${bookingFilters.preset === 'all' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'all', dateFrom: '', dateTo: '', status: 'all'})}
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
              className={`filter-btn ${bookingFilters.preset === 'tomorrow' ? 'active' : ''}`}
              onClick={() => setBookingFilters({...bookingFilters, preset: 'tomorrow'})}
            >
              Tomorrow
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
                  <span className={`booking-status-badge status-${(booking.status || 'confirmed').toLowerCase()}`}>
                    {(booking.status || 'Confirmed').charAt(0).toUpperCase() + (booking.status || 'confirmed').slice(1)}
                  </span>
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
                  {booking.created_at && (
                    <div className="booking-card-booked-at" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      Booked at: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  )}
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
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Devices</th>
                      <th>Price</th>
                      <th>Booked At</th>
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
                        <td data-label="STATUS">
                          <span className={`booking-status-badge status-${(booking.status || 'confirmed').toLowerCase()}`}>
                            {(booking.status || 'Confirmed').charAt(0).toUpperCase() + (booking.status || 'confirmed').slice(1)}
                          </span>
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
                        <td data-label="BOOKED AT" style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {booking.created_at ? new Date(booking.created_at).toLocaleString() : '—'}
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
                  <th>Dedicated Game</th>
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
                        {parseFloat(membership.total_hours || 0) > 0 ? (
                          <span>{parseFloat(membership.hours_used || 0).toFixed(1)}/{parseFloat(membership.total_hours || 0).toFixed(0)} hrs</span>
                        ) : '-'}
                      </td>
                      <td data-label="DEDICATED GAME">
                        {membership.dedicated_game ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{membership.dedicated_game}</span>
                            {membership.dedicated_game_status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600 }}>⏳ Pending</span>
                                <button
                                  className="btn btn-sm btn-success"
                                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                  onClick={() => handleApproveGameRequest(membership.id, membership.dedicated_game)}
                                >
                                  ✅
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                  onClick={() => handleRejectGameRequest(membership.id, membership.dedicated_game)}
                                >
                                  ❌
                                </button>
                              </div>
                            )}
                            {membership.dedicated_game_status === 'approved' && (
                              <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>✅ Approved</span>
                            )}
                            {membership.dedicated_game_status === 'rejected' && (
                              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>❌ Rejected</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                        )}
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
                      <span className={`status-badge ${(booking.status || 'confirmed').toLowerCase()}`}>
                        {booking.status || 'Confirmed'}
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
                  <td>
                    <strong style={{ color: '#334155' }}>{qp.game_name}</strong>
                    {qp.game_change_requested && (
                      <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '6px', fontSize: '0.72rem' }}>
                        <span style={{ color: '#f57c00' }}>🔄 Change → </span>
                        <strong style={{ color: '#e65100' }}>{qp.game_change_requested}</strong>
                      </div>
                    )}
                  </td>
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
                      {qp.status === 'active' && qp.game_change_requested && (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleApproveGameChange(qp.id, qp.game_name, qp.game_change_requested)}
                          >
                            ✅ Approve Game Change
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectGameChange(qp.id)}
                          >
                            ❌ Reject Change
                          </button>
                        </>
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

  // Render Offer Claims (Instagram Promo)
  const renderOfferClaims = () => (
    <div className="admin-section fade-in">
      <div className="section-header-mobile">
        <h2 className="section-title">🎁 Offer Claims</h2>
        <span className="badge" style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35' }}>
          {offerClaimStats.pending || 0} pending
        </span>
        <button className="btn-refresh" onClick={loadOfferClaims}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {offerClaims.length === 0 ? (
        <div className="empty-state">
          <FiGift style={{ fontSize: '2rem', opacity: 0.3 }} />
          <p>No offer claims yet</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Instagram</th>
                <th>Shared With</th>
                <th>Status</th>
                <th>Code</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offerClaims.map(claim => (
                <tr key={claim.id}>
                  <td>
                    <strong>{claim.user_name || 'N/A'}</strong>
                    <br />
                    <small style={{ color: '#888' }}>{claim.user_phone || claim.user_email || ''}</small>
                  </td>
                  <td>
                    <a
                      href={`https://instagram.com/${(claim.instagram_username || '').replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#e1306c', fontWeight: 600 }}
                    >
                      @{claim.instagram_username || '?'}
                    </a>
                  </td>
                  <td style={{ maxWidth: 180, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                    {claim.shared_with_friends || '-'}
                  </td>
                  <td>
                    <span className={`status-badge status-${claim.verification_status}`}
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        background: claim.verification_status === 'pending' ? '#fff3e0'
                          : claim.verification_status === 'verified' ? '#e8f5e9'
                          : '#fce4ec',
                        color: claim.verification_status === 'pending' ? '#e65100'
                          : claim.verification_status === 'verified' ? '#2e7d32'
                          : '#c62828'
                      }}
                    >
                      {claim.verification_status}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: '#ff6b35' }}>{claim.redemption_code}</code>
                  </td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                  </td>
                  <td>
                    {claim.verification_status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveOfferClaim(claim.id)}
                          style={{
                            background: '#4caf50', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '6px 14px', fontWeight: 700,
                            fontSize: '0.8rem', cursor: 'pointer'
                          }}
                        >
                          <FiCheckCircle style={{ marginRight: 4 }} /> Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectOfferClaim(claim.id)}
                          style={{
                            background: '#ef5350', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '6px 14px', fontWeight: 700,
                            fontSize: '0.8rem', cursor: 'pointer'
                          }}
                        >
                          <FiX style={{ marginRight: 4 }} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#888' }}>
                        {claim.verification_status === 'verified' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ─── Dedicated Finance Tab ───
  const renderFinance = () => {
    const summary = financialSummary;
    const chartData = summary?.chart_data || [];
    const maxChartValue = Math.max(...chartData.map(d => Math.max(d.revenue || 0, d.expenses || 0)), 1);

    const filteredExpensesList = expenseFilter === 'all' 
      ? expenses 
      : expenses.filter(e => e.category === expenseFilter);

    return (
      <div className="finance-page fade-in">
        <div className="section-header-mobile">
          <h2 className="section-title">💰 Finance & Expenses</h2>
          <span className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Summary Cards */}
        {summary && (
          <>
            <div className="finance-cards-grid">
              <div className="finance-card finance-card-today">
                <div className="finance-card-header">
                  <span className="finance-card-label">Today</span>
                  <span className="finance-card-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="finance-card-body">
                  <div className="finance-row revenue">
                    <span className="finance-dot revenue-dot"></span>
                    <span>Revenue</span>
                    <span className="finance-amount">₹{(summary.today?.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-row expense">
                    <span className="finance-dot expense-dot"></span>
                    <span>Expenses</span>
                    <span className="finance-amount">₹{(summary.today?.expenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-divider"></div>
                  <div className={`finance-row profit ${(summary.today?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                    <span className="finance-profit-icon">{(summary.today?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                    <span>Profit</span>
                    <span className="finance-amount finance-profit">₹{(summary.today?.profit || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="finance-card-footer">
                  <span>{summary.today?.bookings || 0} bookings</span>
                </div>
              </div>

              <div className="finance-card finance-card-week">
                <div className="finance-card-header">
                  <span className="finance-card-label">This Week</span>
                  <span className="finance-card-date">7 days</span>
                </div>
                <div className="finance-card-body">
                  <div className="finance-row revenue">
                    <span className="finance-dot revenue-dot"></span>
                    <span>Revenue</span>
                    <span className="finance-amount">₹{(summary.week?.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-row expense">
                    <span className="finance-dot expense-dot"></span>
                    <span>Expenses</span>
                    <span className="finance-amount">₹{(summary.week?.expenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-divider"></div>
                  <div className={`finance-row profit ${(summary.week?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                    <span className="finance-profit-icon">{(summary.week?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                    <span>Profit</span>
                    <span className="finance-amount finance-profit">₹{(summary.week?.profit || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="finance-card-footer">
                  <span>{summary.week?.bookings || 0} bookings</span>
                </div>
              </div>

              <div className="finance-card finance-card-month">
                <div className="finance-card-header">
                  <span className="finance-card-label">This Month</span>
                  <span className="finance-card-date">{new Date().toLocaleDateString('en-IN', { month: 'long' })}</span>
                </div>
                <div className="finance-card-body">
                  <div className="finance-row revenue">
                    <span className="finance-dot revenue-dot"></span>
                    <span>Revenue</span>
                    <span className="finance-amount">₹{(summary.month?.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-row expense">
                    <span className="finance-dot expense-dot"></span>
                    <span>Expenses</span>
                    <span className="finance-amount">₹{(summary.month?.expenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="finance-divider"></div>
                  <div className={`finance-row profit ${(summary.month?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
                    <span className="finance-profit-icon">{(summary.month?.profit || 0) >= 0 ? '📈' : '📉'}</span>
                    <span>Profit</span>
                    <span className="finance-amount finance-profit">₹{(summary.month?.profit || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="finance-card-footer">
                  <span>{summary.month?.bookings || 0} bookings</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="finance-chart-container">
                <div className="finance-chart-header">
                  <h4>📊 30-Day Revenue vs Expenses</h4>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot revenue-dot"></span> Revenue</span>
                    <span className="legend-item"><span className="legend-dot expense-dot"></span> Expenses</span>
                    <span className="legend-item"><span className="legend-dot profit-dot"></span> Profit</span>
                  </div>
                </div>
                
                <div className="better-chart">
                  <div className="chart-y-axis">
                    <span className="y-label">₹{maxChartValue >= 1000 ? `${(maxChartValue / 1000).toFixed(0)}k` : maxChartValue}</span>
                    <span className="y-label">₹{maxChartValue >= 1000 ? `${(maxChartValue / 2000).toFixed(0)}k` : Math.round(maxChartValue / 2)}</span>
                    <span className="y-label">₹0</span>
                  </div>
                  <div className="chart-area">
                    <div className="chart-grid-lines">
                      <div className="grid-line"></div>
                      <div className="grid-line"></div>
                      <div className="grid-line"></div>
                    </div>
                    <div className="chart-bars-row">
                      {chartData.map((day, idx) => {
                        const revH = Math.max((day.revenue / maxChartValue) * 100, 1);
                        const expH = Math.max((day.expenses / maxChartValue) * 100, 1);
                        const isHovered = hoveredDay === idx;
                        const dateObj = new Date(day.date);
                        const dayNum = dateObj.getDate();
                        const showLabel = idx % 4 === 0 || idx === chartData.length - 1;
                        return (
                          <div 
                            className={`chart-col ${isHovered ? 'hovered' : ''}`} 
                            key={idx}
                            onMouseEnter={() => setHoveredDay(idx)}
                            onMouseLeave={() => setHoveredDay(null)}
                          >
                            {isHovered && (
                              <div className="chart-tooltip">
                                <div className="tooltip-date">{dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</div>
                                <div className="tooltip-row"><span className="t-dot revenue-dot"></span> ₹{day.revenue.toLocaleString()}</div>
                                <div className="tooltip-row"><span className="t-dot expense-dot"></span> ₹{day.expenses.toLocaleString()}</div>
                                <div className={`tooltip-row tooltip-profit ${day.profit >= 0 ? 'positive' : 'negative'}`}>
                                  {day.profit >= 0 ? '↑' : '↓'} ₹{Math.abs(day.profit).toLocaleString()}
                                </div>
                                <div className="tooltip-bookings">{day.bookings} bookings</div>
                              </div>
                            )}
                            <div className="bar-group">
                              <div className="bar revenue-bar" style={{ height: `${revH}%` }}></div>
                              <div className="bar expense-bar" style={{ height: `${expH}%` }}></div>
                            </div>
                            <span className="x-label">{showLabel ? dayNum : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="chart-summary-row">
                  <div className="chart-summary-item">
                    <span className="cs-label">Total Revenue</span>
                    <span className="cs-value cs-revenue">₹{chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="cs-label">Total Expenses</span>
                    <span className="cs-value cs-expense">₹{chartData.reduce((s, d) => s + d.expenses, 0).toLocaleString()}</span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="cs-label">Net Profit</span>
                    <span className={`cs-value ${chartData.reduce((s, d) => s + d.profit, 0) >= 0 ? 'cs-profit-pos' : 'cs-profit-neg'}`}>
                      ₹{chartData.reduce((s, d) => s + d.profit, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="cs-label">Avg Daily</span>
                    <span className="cs-value">₹{Math.round(chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {summary.category_breakdown && summary.category_breakdown.length > 0 && (
              <div className="finance-categories">
                <h4 className="finance-categories-title">📂 Monthly Expense Breakdown</h4>
                <div className="category-breakdown-grid">
                  {summary.category_breakdown.map((cat, idx) => {
                    const maxTotal = Math.max(...summary.category_breakdown.map(c => c.total), 1);
                    return (
                      <div className="category-breakdown-item" key={idx}>
                        <div className="category-breakdown-header">
                          <span className="category-icon">{CATEGORY_ICONS[cat.category] || '📎'}</span>
                          <span className="category-name">{cat.category}</span>
                          <span className="category-total">₹{cat.total.toLocaleString()}</span>
                        </div>
                        <div className="category-bar-track">
                          <div 
                            className="category-bar-fill" 
                            style={{ 
                              width: `${(cat.total / maxTotal) * 100}%`,
                              backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280'
                            }}
                          ></div>
                        </div>
                        <span className="category-count">{cat.count} entries</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Expense Management */}
        <div className="expense-management-section">
          <div className="expense-management-header">
            <h3 className="finance-section-title">📝 Manage Expenses</h3>
            <button 
              className="btn btn-add-expense" 
              onClick={() => setShowExpenseForm(!showExpenseForm)}
            >
              {showExpenseForm ? <><FiX /> Cancel</> : <><FiPlusCircle /> Add Expense</>}
            </button>
          </div>

          {showExpenseForm && (
            <form className="expense-form" onSubmit={handleAddExpense}>
              <div className="expense-form-grid">
                <div className="expense-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                    required
                  />
                </div>
                <div className="expense-form-group">
                  <label>Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                    ))}
                  </select>
                </div>
                <div className="expense-form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Purchased FIFA 25, Staff lunch..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    required
                  />
                </div>
                <div className="expense-form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-save-expense">
                <FiSave /> Save Expense
              </button>
            </form>
          )}

          <div className="expense-filter-bar">
            <button 
              className={`expense-filter-btn ${expenseFilter === 'all' ? 'active' : ''}`}
              onClick={() => setExpenseFilter('all')}
            >
              All
            </button>
            {EXPENSE_CATEGORIES.map(cat => (
              <button 
                key={cat}
                className={`expense-filter-btn ${expenseFilter === cat ? 'active' : ''}`}
                onClick={() => setExpenseFilter(cat)}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          <div className="expense-list">
            {filteredExpensesList.length === 0 ? (
              <div className="expense-empty">
                <span className="expense-empty-icon">📭</span>
                <p>No expenses recorded{expenseFilter !== 'all' ? ` for "${expenseFilter}"` : ''}. Click "Add Expense" to start tracking.</p>
              </div>
            ) : (
              filteredExpensesList.map(exp => (
                <div className="expense-item" key={exp.id}>
                  <div className="expense-item-icon" style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6b7280') + '20', color: CATEGORY_COLORS[exp.category] || '#6b7280' }}>
                    {CATEGORY_ICONS[exp.category] || '📎'}
                  </div>
                  <div className="expense-item-details">
                    <span className="expense-item-desc">{exp.description}</span>
                    <span className="expense-item-meta">
                      <span className="expense-category-pill" style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6b7280') + '15', color: CATEGORY_COLORS[exp.category] || '#6b7280' }}>
                        {exp.category}
                      </span>
                      <span className="expense-item-date">{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                  </div>
                  <div className="expense-item-amount">₹{exp.amount.toLocaleString()}</div>
                  <button className="expense-delete-btn" onClick={() => handleDeleteExpense(exp.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Monthly Finance History ─── */}
        <div className="monthly-finance-section">
          <div className="expense-management-header">
            <h3 className="finance-section-title">📅 Monthly Finance History</h3>
            <div className="month-picker">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn btn-add-expense" onClick={() => loadMonthlyData(selectedMonth, selectedYear)} disabled={loadingMonthly}>
                {loadingMonthly ? '⏳ Loading...' : '🔍 Fetch'}
              </button>
            </div>
          </div>

          {monthlyData && (
            <div className="monthly-result">
              <h4 className="monthly-title">{monthlyData.month_name} {monthlyData.year}</h4>
              <div className="finance-cards-grid">
                <div className="finance-card finance-card-today">
                  <div className="finance-card-header">
                    <span className="finance-card-label">Revenue</span>
                  </div>
                  <div className="finance-card-body">
                    <div className="monthly-big-number revenue-color">₹{(monthlyData.total_revenue || 0).toLocaleString()}</div>
                    <div className="finance-card-footer"><span>{monthlyData.total_bookings} bookings</span></div>
                  </div>
                </div>
                <div className="finance-card finance-card-week">
                  <div className="finance-card-header">
                    <span className="finance-card-label">Expenses</span>
                  </div>
                  <div className="finance-card-body">
                    <div className="monthly-big-number expense-color">₹{(monthlyData.total_expenses || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="finance-card finance-card-month">
                  <div className="finance-card-header">
                    <span className="finance-card-label">Profit</span>
                  </div>
                  <div className="finance-card-body">
                    <div className={`monthly-big-number ${(monthlyData.total_profit || 0) >= 0 ? 'profit-pos-color' : 'profit-neg-color'}`}>
                      {(monthlyData.total_profit || 0) >= 0 ? '📈' : '📉'} ₹{(monthlyData.total_profit || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly breakdown */}
              {monthlyData.weeks && monthlyData.weeks.length > 0 && (
                <div className="weekly-breakdown">
                  <h5>📊 Week-by-Week</h5>
                  <div className="weekly-grid">
                    {monthlyData.weeks.map((w, i) => (
                      <div className="weekly-card" key={i}>
                        <div className="weekly-label">{w.label}</div>
                        <div className="weekly-row"><span>Revenue</span><span className="revenue-color">₹{w.revenue.toLocaleString()}</span></div>
                        <div className="weekly-row"><span>Expenses</span><span className="expense-color">₹{w.expenses.toLocaleString()}</span></div>
                        <div className="weekly-row weekly-profit"><span>Profit</span><span className={w.profit >= 0 ? 'profit-pos-color' : 'profit-neg-color'}>₹{w.profit.toLocaleString()}</span></div>
                        <div className="weekly-bookings">{w.bookings} bookings</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly category breakdown */}
              {monthlyData.category_breakdown && monthlyData.category_breakdown.length > 0 && (
                <div className="finance-categories" style={{ marginTop: '1rem' }}>
                  <h5 className="finance-categories-title">📂 {monthlyData.month_name} Expense Categories</h5>
                  <div className="category-breakdown-grid">
                    {monthlyData.category_breakdown.map((cat, idx) => {
                      const maxTotal = Math.max(...monthlyData.category_breakdown.map(c => c.total), 1);
                      return (
                        <div className="category-breakdown-item" key={idx}>
                          <div className="category-breakdown-header">
                            <span className="category-icon">{CATEGORY_ICONS[cat.category] || '📎'}</span>
                            <span className="category-name">{cat.category}</span>
                            <span className="category-total">₹{cat.total.toLocaleString()}</span>
                          </div>
                          <div className="category-bar-track">
                            <div className="category-bar-fill" style={{ width: `${(cat.total / maxTotal) * 100}%`, backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280' }}></div>
                          </div>
                          <span className="category-count">{cat.count} entries</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Shop Closures Management ─── */}
        <div className="closures-section">
          <div className="expense-management-header">
            <h3 className="finance-section-title">🚫 Shop Closures</h3>
            <button className="btn btn-add-expense" onClick={() => setShowClosureForm(!showClosureForm)}>
              {showClosureForm ? <><FiX /> Cancel</> : <><FiPlusCircle /> Add Closure</>}
            </button>
          </div>
          <p className="closure-hint">Manage shop closures. Full-day closures disable all booking slots. Time-range closures disable specific hours only.</p>

          {showClosureForm && (
            <form className="expense-form" onSubmit={handleAddClosure}>
              <div className="expense-form-grid">
                <div className="expense-form-group">
                  <label>Date</label>
                  <input type="date" value={closureForm.closure_date} onChange={(e) => setClosureForm({...closureForm, closure_date: e.target.value})} required />
                </div>
                <div className="expense-form-group">
                  <label>Closure Type</label>
                  <select value={closureForm.closure_type} onChange={(e) => setClosureForm({...closureForm, closure_type: e.target.value})}>
                    <option value="full_day">🔴 Full Day Closed</option>
                    <option value="time_range">⏰ Specific Hours</option>
                  </select>
                </div>
                {closureForm.closure_type === 'time_range' && (
                  <>
                    <div className="expense-form-group">
                      <label>From</label>
                      <input type="time" value={closureForm.start_time} onChange={(e) => setClosureForm({...closureForm, start_time: e.target.value})} required />
                    </div>
                    <div className="expense-form-group">
                      <label>To</label>
                      <input type="time" value={closureForm.end_time} onChange={(e) => setClosureForm({...closureForm, end_time: e.target.value})} required />
                    </div>
                  </>
                )}
                <div className="expense-form-group">
                  <label>Reason</label>
                  <input type="text" placeholder="e.g., Power outage, Holiday, Maintenance..." value={closureForm.reason} onChange={(e) => setClosureForm({...closureForm, reason: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-save-expense" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <FiSave /> Save Closure
              </button>
            </form>
          )}

          {/* Closures list */}
          <div className="closure-list">
            {closures.length === 0 ? (
              <div className="expense-empty">
                <span className="expense-empty-icon">✅</span>
                <p>No upcoming closures. All days are open for bookings!</p>
              </div>
            ) : (
              closures.map(cl => {
                const dateObj = new Date(cl.closure_date);
                const isPast = dateObj < new Date(new Date().toDateString());
                const isToday = cl.closure_date === new Date().toISOString().split('T')[0];
                return (
                  <div className={`closure-item ${isPast ? 'closure-past' : ''} ${isToday ? 'closure-today' : ''}`} key={cl.id}>
                    <div className="closure-item-icon">
                      {cl.closure_type === 'full_day' ? '🔴' : '⏰'}
                    </div>
                    <div className="closure-item-details">
                      <span className="closure-item-date">
                        {dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {isToday && <span className="closure-today-badge">TODAY</span>}
                      </span>
                      <span className="closure-item-meta">
                        <span className={`closure-type-pill ${cl.closure_type}`}>
                          {cl.closure_type === 'full_day' ? 'Full Day' : `${cl.start_time?.slice(0, 5)} — ${cl.end_time?.slice(0, 5)}`}
                        </span>
                        {cl.reason && <span className="closure-reason">{cl.reason}</span>}
                      </span>
                    </div>
                    <button className="expense-delete-btn" onClick={() => handleDeleteClosure(cl.id)} title="Remove closure">
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Feedback Tab ───
  const renderFeedback = () => {
    const typeEmojis: Record<string, string> = { bug: '🐛', suggestion: '💡', feature: '🚀', query: '❓', other: '💬' };
    const priorityColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
    const statusColors: Record<string, string> = { pending: '#f59e0b', reviewed: '#3b82f6', resolved: '#22c55e' };

    return (
      <div className="tab-section">
        {/* Stats Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="stat-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{feedbackStats.total}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Total</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{feedbackStats.pending}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Pending</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '3px solid #3b82f6' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{feedbackStats.reviewed}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Reviewed</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '3px solid #22c55e' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{feedbackStats.resolved}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Resolved</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '16px', borderLeft: '3px solid #8b5cf6' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{feedbackStats.recent_week}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>This Week</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={feedbackFilter}
            onChange={(e) => { setFeedbackFilter(e.target.value); }}
            className="form-select"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text-primary, #fff)' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={feedbackTypeFilter}
            onChange={(e) => { setFeedbackTypeFilter(e.target.value); }}
            className="form-select"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #333)', background: 'var(--card-bg, #1a1a2e)', color: 'var(--text-primary, #fff)' }}
          >
            <option value="all">All Types</option>
            <option value="bug">🐛 Bug</option>
            <option value="suggestion">💡 Suggestion</option>
            <option value="feature">🚀 Feature</option>
            <option value="query">❓ Query</option>
            <option value="other">💬 Other</option>
          </select>
          <button className="btn btn-primary" onClick={loadFeedback} style={{ padding: '8px 16px' }}>
            <FiRefreshCw /> Apply
          </button>
        </div>

        {/* Feedback List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feedbackList.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <FiMessageSquare style={{ fontSize: '40px', marginBottom: '12px' }} />
              <p>No feedback found</p>
            </div>
          ) : (
            feedbackList.map((fb: any) => (
              <div key={fb.id} className="stat-card" style={{ padding: '16px', borderLeft: `3px solid ${statusColors[fb.status] || '#888'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px' }}>{typeEmojis[fb.type] || '💬'}</span>
                    <strong style={{ fontSize: '14px' }}>#{fb.id}</strong>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: `${statusColors[fb.status] || '#888'}22`,
                      color: statusColors[fb.status] || '#888'
                    }}>
                      {(fb.status || 'pending').toUpperCase()}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: `${priorityColors[fb.priority] || '#888'}22`,
                      color: priorityColors[fb.priority] || '#888'
                    }}>
                      {(fb.priority || 'medium').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'capitalize' }}>{fb.type}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#888' }}>{fb.created_at}</span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>
                    👤 {fb.name || 'Anonymous'} {fb.email ? `• 📧 ${fb.email}` : ''}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {fb.message}
                  </div>
                  {fb.admin_notes && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-color, #0f0f23)', borderRadius: '6px', fontSize: '13px', color: '#aaa' }}>
                      <strong>Admin Notes:</strong> {fb.admin_notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {fb.status !== 'reviewed' && (
                    <button
                      onClick={() => handleUpdateFeedbackStatus(fb.id, 'reviewed')}
                      style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', background: '#3b82f622', color: '#3b82f6' }}
                    >
                      <FiEye style={{ marginRight: '4px' }} /> Mark Reviewed
                    </button>
                  )}
                  {fb.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateFeedbackStatus(fb.id, 'resolved')}
                      style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', background: '#22c55e22', color: '#22c55e' }}
                    >
                      <FiCheckCircle style={{ marginRight: '4px' }} /> Resolve
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteFeedback(fb.id)}
                    style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', background: '#ef444422', color: '#ef4444' }}
                  >
                    <FiTrash2 style={{ marginRight: '4px' }} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'bookings': return renderBookings();
      case 'users': return renderUsers();
      case 'memberships': return renderMemberships();
      case 'rentals': return renderRentals();
      case 'college': return renderCollegeEvents();
      case 'analytics': return renderAnalytics();
      case 'finance': return renderFinance();
      case 'party': return renderPartyBookings();
      case 'questpass': return renderQuestPasses();
      case 'offers': return renderOfferClaims();
      case 'feedback': return renderFeedback();
      default: return renderDashboard();
    }
  };

  return (
    <div className="admin-sidebar-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => router.push('/')}>
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
            <button className={`sidebar-nav-item ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
              <FiGift className="nav-icon" />
              <span className="nav-label">Offer Claims</span>
              {offerClaimStats.pending > 0 && <span className="nav-badge">{offerClaimStats.pending}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
              <FiPackage className="nav-icon" />
              <span className="nav-label">Rentals</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'college' ? 'active' : ''}`} onClick={() => setActiveTab('college')}>
              <FiAward className="nav-icon" />
              <span className="nav-label">College</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
              <FiMessageSquare className="nav-icon" />
              <span className="nav-label">Feedback</span>
              {feedbackStats.pending > 0 && <span className="nav-badge">{feedbackStats.pending}</span>}
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Analysis</span>
            <button className={`sidebar-nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
              <FiDollarSign className="nav-icon" />
              <span className="nav-label">Finance</span>
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <FiTrendingUp className="nav-icon" />
              <span className="nav-label">Analytics</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item home-btn" onClick={() => router.push('/')}>
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
              {activeTab === 'analytics' && '📈 Analytics'}
              {activeTab === 'finance' && '💰 Finance & Expenses'}
              {activeTab === 'feedback' && '💬 Feedback Management'}
              {activeTab === 'settings' && '⚙️ Settings'}
            </h1>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary btn-refresh" onClick={loadAllData}>
              <FiRefreshCw /> <span>Refresh Data</span>
            </button>
            <button className="mobile-topbar-home" onClick={() => router.push('/')} title="Back to Site">
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
          <button className={`mobile-nav-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
            <FiGift /> <span>Offers</span>
            {offerClaimStats.pending > 0 && <span className="mobile-nav-badge">{offerClaimStats.pending}</span>}
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
            <FiPackage /> <span>Rentals</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'college' ? 'active' : ''}`} onClick={() => setActiveTab('college')}>
            <FiAward /> <span>College</span>
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            <FiMessageSquare /> <span>Feedback</span>
            {feedbackStats.pending > 0 && <span className="mobile-nav-badge">{feedbackStats.pending}</span>}
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
            <FiDollarSign /> <span>Finance</span>
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
