import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiUsers, FiThumbsUp, FiPlus, FiX, FiSearch, FiFilter, FiHeart, FiCheck, FiExternalLink } from 'react-icons/fi';
import { getGames, getRecommendations, recommendGame, voteForGame } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GamesPage.css';

const GamesPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [activeFilter, setActiveFilter] = useState('all');
  const [games, setGames] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Recommendation modal state
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PlayStation Store search/wishlist state
  const [storeQuery, setStoreQuery] = useState('');
  const [storeResults, setStoreResults] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);

  // Load games and recommendations on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load data when filter changes
  useEffect(() => {
    loadGames();
  }, [activeFilter]);

  const loadData = async () => {
    await Promise.all([loadGames(), loadRecommendations()]);
  };

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const ps5Filter = activeFilter === 'all' ? null : activeFilter;
      const response = await getGames(ps5Filter);
      setGames(response.games || []);
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

  const getPlaceholderImage = (gameName) => {
    // Generate a gradient based on game name for placeholder
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    const index = gameName.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
      setStoreResults([]);
      return;
    }

    try {
      setStoreLoading(true);
      
      // Mock PlayStation Store API - In production, this would call a real API
      // For now, we'll generate mock results based on the search query
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockStoreGames = [
        { id: 'store-1', name: 'God of War Ragnarök', genre: 'Action-Adventure', rating: 9.5, release_year: 2022, description: 'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go.' },
        { id: 'store-2', name: 'Horizon Forbidden West', genre: 'Action RPG', rating: 9.0, release_year: 2022, description: 'Join Aloy as she braves the Forbidden West - a majestic but dangerous frontier.' },
        { id: 'store-3', name: 'Spider-Man 2', genre: 'Action-Adventure', rating: 9.3, release_year: 2023, description: 'Swing through Marvel\'s New York as both Peter Parker and Miles Morales.' },
        { id: 'store-4', name: 'Gran Turismo 7', genre: 'Racing', rating: 8.5, release_year: 2022, description: 'The most realistic driving simulator returns with stunning graphics.' },
        { id: 'store-5', name: 'Final Fantasy XVI', genre: 'Action RPG', rating: 8.8, release_year: 2023, description: 'An epic dark fantasy tale featuring revenge, duty, and the tragic cost of freedom.' },
        { id: 'store-6', name: 'Ratchet & Clank: Rift Apart', genre: 'Platform', rating: 9.0, release_year: 2021, description: 'Go dimension-hopping with Ratchet and Clank as they take on an evil emperor.' },
        { id: 'store-7', name: 'Returnal', genre: 'Roguelike', rating: 8.7, release_year: 2021, description: 'Break the cycle of chaos on an alien planet in this third-person shooter.' },
        { id: 'store-8', name: 'Demon\'s Souls', genre: 'Action RPG', rating: 9.2, release_year: 2020, description: 'Experience the original brutal challenge in stunning PS5 graphics.' },
        { id: 'store-9', name: 'Ghost of Tsushima Director\'s Cut', genre: 'Action-Adventure', rating: 9.4, release_year: 2021, description: 'Forge a new path and wage an unconventional war for the freedom of Tsushima.' },
        { id: 'store-10', name: 'Resident Evil Village', genre: 'Survival Horror', rating: 8.9, release_year: 2021, description: 'Experience survival horror like never before in this direct sequel to Resident Evil 7.' },
      ];

      // Filter mock results based on search query
      const filtered = mockStoreGames.filter(game => 
        game.name.toLowerCase().includes(q.toLowerCase()) ||
        game.genre.toLowerCase().includes(q.toLowerCase())
      );

      setStoreResults(filtered.length > 0 ? filtered : mockStoreGames.slice(0, 6));
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
      {/* Hero Section */}
      <section className="games-hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-dot"></span>
            Game Library
          </span>
          <h1 className="hero-title">
            <span className="title-icon">🎮</span>
            Discover Amazing Games
          </h1>
          <p className="hero-subtitle">
            Explore our extensive collection of PlayStation games available at GameSpot
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">{games.length}</span>
              <span className="stat-label">Total Games</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">3</span>
              <span className="stat-label">PS5 Consoles</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{recommendations.length}</span>
              <span className="stat-label">Wishlist Items</span>
            </div>
          </div>
        </div>
      </section>

      <div className="games-container">
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <FiFilter className="filter-icon" />
            <span>Filter by Console</span>
          </div>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span className="tab-icon">🎯</span>
              All Games
            </button>
            <button 
              className={`filter-tab ${activeFilter === '1' ? 'active' : ''}`}
              onClick={() => setActiveFilter('1')}
            >
              <span className="tab-icon">1️⃣</span>
              PS5-1
            </button>
            <button 
              className={`filter-tab ${activeFilter === '2' ? 'active' : ''}`}
              onClick={() => setActiveFilter('2')}
            >
              <span className="tab-icon">2️⃣</span>
              PS5-2
            </button>
            <button 
              className={`filter-tab ${activeFilter === '3' ? 'active' : ''}`}
              onClick={() => setActiveFilter('3')}
            >
              <span className="tab-icon">3️⃣</span>
              PS5-3
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Loading awesome games...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={loadGames} className="retry-btn">
              <FiSearch /> Try Again
            </button>
          </div>
        )}

        {/* Games Grid */}
        {!loading && !error && (
          <>
            <div className="games-count">
              <span className="count-badge">
                <strong>{games.length}</strong> games found
              </span>
              {activeFilter !== 'all' && (
                <span className="filter-badge">PS5-{activeFilter}</span>
              )}
            </div>
            
            <div className="games-grid">
              {games.map((game, index) => (
                <div 
                  key={game.id} 
                  className="game-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className="game-image"
                    style={{
                      background: getPlaceholderImage(game.name),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="game-rating">
                      <FiStar className="star-icon" />
                      <span>{game.rating}</span>
                    </div>
                    <div className="game-badges-top">
                      {getPS5Badge(game.ps5_numbers)}
                    </div>
                    <div className="game-overlay">
                      <div className="overlay-content">
                        <h3 className="game-title">{game.name}</h3>
                        <div className="game-meta">
                          <span className="game-genre">{game.genre}</span>
                          <span className="game-year">{game.release_year}</span>
                        </div>
                        <p className="game-description">
                          {game.description || 'An amazing gaming experience awaits you.'}
                        </p>
                        <div className="game-footer">
                          <div className="game-players">
                            <FiUsers className="players-icon" />
                            <span>{game.max_players} {game.max_players === 1 ? 'Player' : 'Players'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {games.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <h3>No Games Found</h3>
                <p>No games are currently available for this PS5 console.</p>
              </div>
            )}
          </>
        )}

        {/* PlayStation Store Explorer */}
        <section className="store-section">
          <div className="section-header">
            <div className="section-title-group">
              <span className="section-icon">🛍️</span>
              <div>
                <h2 className="section-title">PlayStation Store</h2>
                <p className="section-subtitle">Search for games and add them to the community wishlist</p>
              </div>
            </div>
            <button 
              className="store-link-btn"
              onClick={openPlayStationStoreSearch}
            >
              <FiExternalLink /> Visit Store
            </button>
          </div>
          
          <div className="store-search-wrapper">
            <div className="store-controls">
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="form-input store-input"
                  placeholder="Search games (e.g., God of War, Spider-Man, Horizon)"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPlayStationStore()}
                />
              </div>
              <button 
                className="btn-primary search-btn" 
                onClick={searchPlayStationStore}
                disabled={storeLoading}
              >
                {storeLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <FiSearch /> Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Store Search Results */}
          {storeResults.length > 0 && (
            <div className="store-results">
              <h3 className="store-results-title">
                <span className="results-count">{storeResults.length}</span> Games Found
              </h3>
              <div className="games-grid store-grid">
                {storeResults.map((game, index) => {
                  const inLibrary = isGameInLibrary(game.name);
                  const inWishlist = isGameInWishlist(game.name);
                  
                  return (
                    <div 
                      key={game.id} 
                      className="game-card store-game-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div
                        className="game-image"
                        style={{
                          background: getPlaceholderImage(game.name),
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="game-rating">
                          <FiStar className="star-icon" />
                          <span>{game.rating}</span>
                        </div>
                        {inLibrary && (
                          <div className="status-badge library-badge">
                            <FiCheck /> In Library
                          </div>
                        )}
                        {!inLibrary && inWishlist && (
                          <div className="status-badge wishlist-badge">
                            <FiHeart /> In Wishlist
                          </div>
                        )}
                        <div className="game-overlay">
                          <div className="overlay-content">
                            <h3 className="game-title">{game.name}</h3>
                            <div className="game-meta">
                              <span className="game-genre">{game.genre}</span>
                              <span className="game-year">{game.release_year}</span>
                            </div>
                            <p className="game-description">
                              {game.description || 'An amazing gaming experience awaits you.'}
                            </p>
                            <button 
                              className={`wishlist-add-btn ${inLibrary || inWishlist ? 'disabled' : ''}`}
                              onClick={() => addStoreItemToWishlist(game)}
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Recommendations Section */}
        <section className="recommendations-section">
          <div className="section-header">
            <div className="section-title-group">
              <span className="section-icon">🎯</span>
              <div>
                <h2 className="section-title">Community Wishlist</h2>
                <p className="section-subtitle">Vote for games you'd like to see added to our catalog</p>
              </div>
            </div>
            <button 
              className="recommend-btn"
              onClick={() => setShowRecommendModal(true)}
            >
              <FiPlus /> Request Game
            </button>
          </div>

          <div className="recommendations-grid">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div 
                  key={rec.id} 
                  className="recommendation-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="recommendation-content">
                    <div className="recommendation-header">
                      <h4 className="recommendation-title">{rec.game_name}</h4>
                      {rec.requester_name && (
                        <span className="recommendation-requester">
                          by {rec.requester_name}
                        </span>
                      )}
                    </div>
                    {rec.description && (
                      <p className="recommendation-description">{rec.description}</p>
                    )}
                  </div>
                  <button 
                    className={`vote-btn ${rec.user_voted ? 'voted' : ''}`}
                    onClick={() => handleVote(rec.id)}
                    title={rec.user_voted ? "You've voted!" : "Vote for this game"}
                  >
                    <FiThumbsUp className="vote-icon" />
                    <span className="vote-count">{rec.votes}</span>
                    <span className="vote-label">{rec.votes === 1 ? 'vote' : 'votes'}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-recommendations">
                <div className="empty-icon">💡</div>
                <h3>No Recommendations Yet</h3>
                <p>Be the first to suggest a game you'd like to see!</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowRecommendModal(true)}
                >
                  <FiPlus /> Request a Game
                </button>
              </div>
            )}
          </div>
        </section>
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
