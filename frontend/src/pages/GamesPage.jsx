import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiUsers, FiThumbsUp, FiPlus, FiX, FiSearch, FiHeart, FiCheck, FiExternalLink, FiChevronDown, FiZap, FiBookOpen } from 'react-icons/fi';
import { getGames, getRecommendations, recommendGame, voteForGame } from '../services/api';
import { batchGetGameCovers, searchPS5Games, getPopularPS5Games } from '../services/rawgApi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GamesPage.css';

const GamesPage = () => {
  const navigate = useNavigate();
  const gamesGridRef = useRef(null);
  
  // State management
  const [activeFilter, setActiveFilter] = useState('all');
  const [games, setGames] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'store', 'wishlist'
  
  // Recommendation modal state
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PlayStation Store search/wishlist state
  const [storeQuery, setStoreQuery] = useState('');
  const [storeResults, setStoreResults] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);

  // RAWG game cover images cache (gameName -> imageUrl)
  const [gameCovers, setGameCovers] = useState({});

  // Load games and recommendations on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load data when filter changes
  useEffect(() => {
    loadGames();
  }, [activeFilter]);

  // When store tab is opened and no results, load popular PS5 games
  useEffect(() => {
    if (activeTab === 'store' && storeResults.length === 0 && !storeLoading) {
      loadPopularStoreGames();
    }
  }, [activeTab]);

  const loadPopularStoreGames = async () => {
    try {
      setStoreLoading(true);
      const popular = await getPopularPS5Games(20);
      if (popular.length > 0) {
        setStoreResults(popular);
      }
    } catch (err) {
      console.error('Error loading popular games:', err);
    } finally {
      setStoreLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([loadGames(), loadRecommendations()]);
  };

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const ps5Filter = activeFilter === 'all' ? null : activeFilter;
      const response = await getGames(ps5Filter);
      const loadedGames = response.games || [];
      setGames(loadedGames);

      // Fetch cover images from RAWG for all games
      if (loadedGames.length > 0) {
        const names = loadedGames.map(g => g.name);
        const covers = await batchGetGameCovers(names);
        const coversObj = {};
        covers.forEach((url, key) => {
          if (url) coversObj[key] = url;
        });
        setGameCovers(prev => ({ ...prev, ...coversObj }));
      }
    } catch (err) {
      setError('Failed to load games. Please try again.');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await getRecommendations();
      setRecommendations(response.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const handleVote = async (recommendationId) => {
    try {
      await voteForGame(recommendationId);
      // Reload recommendations to get updated vote counts
      await loadRecommendations();
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to vote. Please login first.');
    }
  };

  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    
    if (!newGameName.trim()) {
      alert('Please enter a game name');
      return;
    }

    try {
      setSubmitting(true);
      await recommendGame(newGameName, newGameDesc);
      setShowRecommendModal(false);
      setNewGameName('');
      setNewGameDesc('');
      await loadRecommendations();
      alert('Game recommendation submitted successfully!');
    } catch (err) {
      console.error('Error submitting recommendation:', err);
      alert('Failed to submit recommendation. Please login first.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPS5Badge = (ps5Numbers) => {
    if (!ps5Numbers || ps5Numbers.length === 0) return null;
    return ps5Numbers.map(num => (
      <span key={num} className="ps5-badge">PS5-{num}</span>
    ));
  };

  // Get game cover from RAWG cache or backend cover_image
  const getGameCover = (game) => {
    // 1. Check RAWG cache
    const rawgUrl = gameCovers[game.name?.toLowerCase().trim()];
    if (rawgUrl) return rawgUrl;
    
    // 2. Check backend cover_image field (if it's a full URL)
    if (game.cover_image && game.cover_image.startsWith('http')) {
      return game.cover_image;
    }

    return null;
  };

  const getPlaceholderImage = (gameName) => {
    const colors = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
    ];
    const index = gameName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Filter games by search query
  const filteredGames = games.filter(game => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      game.name.toLowerCase().includes(query) ||
      (game.genre && game.genre.toLowerCase().includes(query))
    );
  });

  // Get unique genres for quick filters
  const genres = [...new Set(games.map(g => g.genre).filter(Boolean))].sort();

  const openPlayStationStoreSearch = () => {
    const q = storeQuery.trim();
    const url = q
      ? `https://store.playstation.com/en-in/search/${encodeURIComponent(q)}`
      : 'https://store.playstation.com/en-in/pages/latest';
    window.open(url, '_blank', 'noopener');
  };

  const searchPlayStationStore = async () => {
    const q = storeQuery.trim();
    if (!q) {
      // If empty search, load popular games
      await loadPopularStoreGames();
      return;
    }

    try {
      setStoreLoading(true);
      const results = await searchPS5Games(q, 20);
      setStoreResults(results);
    } catch (err) {
      console.error('Error searching store:', err);
      setStoreResults([]);
    } finally {
      setStoreLoading(false);
    }
  };

  const isGameInLibrary = (gameName) => {
    return games.some(game => 
      game.name.toLowerCase() === gameName.toLowerCase()
    );
  };

  const isGameInWishlist = (gameName) => {
    return recommendations.some(rec => 
      rec.game_name.toLowerCase() === gameName.toLowerCase()
    );
  };

  const addStoreItemToWishlist = async (game) => {
    const gameName = typeof game === 'string' ? game : game.name;
    
    if (isGameInLibrary(gameName)) {
      alert(`"${gameName}" is already in your library!`);
      return;
    }

    if (isGameInWishlist(gameName)) {
      alert(`"${gameName}" is already in the wishlist!`);
      return;
    }

    try {
      setSubmitting(true);
      const description = typeof game === 'object' 
        ? `${game.genre} | ${game.description || 'PlayStation Store game'}` 
        : 'Added via PlayStation Store search';
      
      await recommendGame(gameName, description);
      await loadRecommendations();
      alert(`"${gameName}" added to community wishlist!`);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      alert('Failed to add. Please login first.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="games-page">
      <Navbar />
      
      {/* Hero Section - Cinematic */}
      <section className="games-hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid-lines"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge-row">
            <span className="hero-badge">
              <FiZap className="badge-icon" />
              Game Library
            </span>
          </div>
          <h1 className="hero-title">
            Our Game <span className="title-highlight">Collection</span>
          </h1>
          <p className="hero-subtitle">
            Explore {games.length}+ premium PlayStation titles across 3 PS5 consoles
          </p>
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-value">{games.length}</span>
              <span className="stat-label">Total Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">3</span>
              <span className="stat-label">PS5 Consoles</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{recommendations.length}</span>
              <span className="stat-label">Wishlist</span>
            </div>
          </div>
          <button 
            className="hero-cta"
            onClick={() => gamesGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FiChevronDown className="cta-icon" />
            Browse Games
          </button>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="games-container" ref={gamesGridRef}>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <FiBookOpen />
            <span>Game Library</span>
            <span className="tab-count">{games.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <FiSearch />
            <span>PS Store</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <FiHeart />
            <span>Wishlist</span>
            <span className="tab-count">{recommendations.length}</span>
          </button>
        </div>

        {/* ===== LIBRARY TAB ===== */}
        {activeTab === 'library' && (
          <>
            {/* Search & Filter Bar */}
            <div className="toolbar">
              <div className="search-bar">
                <FiSearch className="search-bar-icon" />
                <input
                  type="text"
                  placeholder="Search games by name or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-bar-input"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    <FiX />
                  </button>
                )}
              </div>
              <div className="filter-chips">
                <button 
                  className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-chip ${activeFilter === '1' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('1')}
                >
                  PS5-1
                </button>
                <button 
                  className={`filter-chip ${activeFilter === '2' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('2')}
                >
                  PS5-2
                </button>
                <button 
                  className={`filter-chip ${activeFilter === '3' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('3')}
                >
                  PS5-3
                </button>
              </div>
            </div>

            {/* Results info */}
            {!loading && !error && (
              <div className="results-info">
                <span className="results-text">
                  Showing <strong>{filteredGames.length}</strong> {filteredGames.length === 1 ? 'game' : 'games'}
                  {activeFilter !== 'all' && <span className="active-filter-tag">PS5-{activeFilter}</span>}
                  {searchQuery && <span className="active-filter-tag">"{searchQuery}"</span>}
                </span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">Loading games...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button onClick={loadGames} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {/* Games Grid */}
            {!loading && !error && (
              <div className="games-grid">
                {filteredGames.map((game, index) => {
                  const coverUrl = getGameCover(game);
                  return (
                    <div 
                      key={game.id} 
                      className="game-card"
                      style={{ animationDelay: `${index * 0.04}s` }}
                      onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                    >
                      <div className="game-card-image">
                        {coverUrl ? (
                          <img 
                            src={coverUrl} 
                            alt={game.name}
                            className="game-cover-img"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="game-cover-fallback"
                          style={{ 
                            background: getPlaceholderImage(game.name),
                            display: coverUrl ? 'none' : 'flex'
                          }}
                        >
                          <span className="fallback-emoji">🎮</span>
                        </div>
                        
                        {/* Gradient overlay - always visible for text readability */}
                        <div className="game-card-gradient"></div>
                        
                        {/* Top badges */}
                        <div className="game-card-top">
                          <div className="game-badges-row">
                            {getPS5Badge(game.ps5_numbers)}
                          </div>
                          <div className="game-rating-badge">
                            <FiStar className="rating-star" />
                            <span>{game.rating}</span>
                          </div>
                        </div>

                        {/* Bottom info - always visible */}
                        <div className="game-card-info">
                          <h3 className="game-card-title">{game.name}</h3>
                          <div className="game-card-meta">
                            <span className="game-genre-tag">{game.genre}</span>
                            <span className="game-year-tag">{game.release_year}</span>
                          </div>
                          <div className="game-card-details">
                            <div className="game-players-info">
                              <FiUsers />
                              <span>{game.max_players} {game.max_players === 1 ? 'Player' : 'Players'}</span>
                            </div>
                          </div>
                          {game.description && (
                            <p className="game-card-desc">{game.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredGames.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <h3>No Games Found</h3>
                <p>Try adjusting your search or filter to find what you're looking for.</p>
                <button className="retry-btn" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* ===== PS STORE TAB ===== */}
        {activeTab === 'store' && (
          <section className="store-section">
            <div className="store-header-row">
              <div>
                <h2 className="section-title">
                  <span className="section-icon">🛍️</span>
                  Game Store Explorer
                </h2>
                <p className="section-subtitle">Search games, find deals, and add them to the community wishlist</p>
              </div>
              <button 
                className="store-external-btn"
                onClick={openPlayStationStoreSearch}
              >
                <FiExternalLink /> Visit PS Store
              </button>
            </div>
            
            <div className="store-search-bar">
              <FiSearch className="search-bar-icon" />
              <input
                type="text"
                className="search-bar-input"
                placeholder="Search games (e.g., God of War, Spider-Man, Horizon)"
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPlayStationStore()}
              />
              <button 
                className="store-search-btn" 
                onClick={searchPlayStationStore}
                disabled={storeLoading}
              >
                {storeLoading ? (
                  <span className="btn-spinner"></span>
                ) : (
                  <>Search</>
                )}
              </button>
            </div>

            {/* Store Loading State */}
            {storeLoading && (
              <div className="loading-state">
                <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">Searching PlayStation games...</p>
              </div>
            )}

            {/* Store Search Results */}
            {!storeLoading && storeResults.length > 0 && (
              <div className="store-results">
                <h3 className="store-results-heading">
                  <span className="results-count-badge">{storeResults.length}</span> 
                  {storeQuery.trim() ? ' Games Found' : ' Popular PS5 Games'}
                </h3>
                <div className="games-grid">
                  {storeResults.map((game, index) => {
                    const inLibrary = isGameInLibrary(game.name);
                    const inWishlist = isGameInWishlist(game.name);
                    
                    return (
                      <div 
                        key={game.id} 
                        className="game-card store-card"
                        style={{ animationDelay: `${index * 0.04}s` }}
                      >
                        <div className="game-card-image">
                          {game.background_image ? (
                            <img 
                              src={game.background_image} 
                              alt={game.name}
                              className="game-cover-img"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="game-cover-fallback"
                            style={{ 
                              background: getPlaceholderImage(game.name),
                              display: game.background_image ? 'none' : 'flex'
                            }}
                          >
                            <span className="fallback-emoji">🎮</span>
                          </div>
                          <div className="game-card-gradient"></div>
                          
                          <div className="game-card-top">
                            <div className="game-badges-row">
                              {game.isOnSale && (
                                <span className="status-tag sale-tag">
                                  🔥 -{game.savings}%
                                </span>
                              )}
                              {inLibrary && (
                                <span className="status-tag library-tag">
                                  <FiCheck /> In Library
                                </span>
                              )}
                              {!inLibrary && inWishlist && (
                                <span className="status-tag wishlist-tag">
                                  <FiHeart /> Wishlisted
                                </span>
                              )}
                            </div>
                            <div className="game-rating-badge">
                              <FiStar className="rating-star" />
                              <span>{game.metacritic || game.rating || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="game-card-info">
                            <h3 className="game-card-title">{game.name}</h3>
                            <div className="game-card-meta">
                              <span className="game-genre-tag">{game.genre}</span>
                              {game.release_year && <span className="game-year-tag">{game.release_year}</span>}
                            </div>
                            {(game.salePrice || game.normalPrice) && (
                              <div className="game-price-row">
                                {game.isOnSale ? (
                                  <>
                                    <span className="game-price sale">${game.salePrice}</span>
                                    <span className="game-price original">${game.normalPrice}</span>
                                  </>
                                ) : (
                                  <span className="game-price">${game.normalPrice}</span>
                                )}
                              </div>
                            )}
                            <button 
                              className={`wishlist-btn ${inLibrary || inWishlist ? 'disabled' : ''}`}
                              onClick={(e) => { e.stopPropagation(); addStoreItemToWishlist(game); }}
                              disabled={inLibrary || inWishlist || submitting}
                            >
                              {inLibrary ? (
                                <><FiCheck /> Already Owned</>
                              ) : inWishlist ? (
                                <><FiHeart /> In Wishlist</>
                              ) : (
                                <><FiPlus /> Add to Wishlist</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Data Attribution */}
                <div className="rawg-attribution">
                  Game data powered by <a href="https://www.cheapshark.com/" target="_blank" rel="noopener noreferrer">CheapShark</a> & <a href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer">Steam</a>
                </div>
              </div>
            )}

            {/* No Results */}
            {!storeLoading && storeResults.length === 0 && storeQuery.trim() && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Games Found</h3>
                <p>Try a different search term like "action", "RPG", or a game name.</p>
                <button className="retry-btn" onClick={() => { setStoreQuery(''); loadPopularStoreGames(); }}>
                  Show Popular Games
                </button>
              </div>
            )}
          </section>
        )}

        {/* ===== WISHLIST TAB ===== */}
        {activeTab === 'wishlist' && (
          <section className="wishlist-section">
            <div className="wishlist-header-row">
              <div>
                <h2 className="section-title">
                  <span className="section-icon">🎯</span>
                  Community Wishlist
                </h2>
                <p className="section-subtitle">Vote for games you'd like to see added to our catalog</p>
              </div>
              <button 
                className="request-game-btn"
                onClick={() => setShowRecommendModal(true)}
              >
                <FiPlus /> Request Game
              </button>
            </div>

            <div className="wishlist-grid">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div 
                    key={rec.id} 
                    className="wishlist-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="wishlist-card-content">
                      <div className="wishlist-card-header">
                        <h4 className="wishlist-game-name">{rec.game_name}</h4>
                        {rec.requester_name && (
                          <span className="wishlist-requester">
                            by {rec.requester_name}
                          </span>
                        )}
                      </div>
                      {rec.description && (
                        <p className="wishlist-desc">{rec.description}</p>
                      )}
                    </div>
                    <button 
                      className={`vote-button ${rec.user_voted ? 'voted' : ''}`}
                      onClick={() => handleVote(rec.id)}
                      title={rec.user_voted ? "You've voted!" : "Vote for this game"}
                    >
                      <FiThumbsUp className="vote-icon" />
                      <span className="vote-number">{rec.votes}</span>
                      <span className="vote-text">{rec.votes === 1 ? 'vote' : 'votes'}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💡</div>
                  <h3>No Recommendations Yet</h3>
                  <p>Be the first to suggest a game you'd like to see!</p>
                  <button 
                    className="retry-btn"
                    onClick={() => setShowRecommendModal(true)}
                  >
                    <FiPlus /> Request a Game
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Recommendation Modal */}
      {showRecommendModal && (
        <div className="modal-overlay" onClick={() => setShowRecommendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon">🎮</span>
                <h3>Request a Game</h3>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowRecommendModal(false)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleRecommendSubmit} className="recommend-form">
              <div className="form-group">
                <label htmlFor="gameName">
                  Game Name <span className="required">*</span>
                </label>
                <input
                  id="gameName"
                  type="text"
                  className="form-input"
                  placeholder="e.g., GTA VI, Cyberpunk 2077, Elden Ring"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="gameDesc">
                  Description <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="gameDesc"
                  className="form-textarea"
                  placeholder="Tell us why you'd like this game..."
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowRecommendModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiPlus /> Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default GamesPage;
