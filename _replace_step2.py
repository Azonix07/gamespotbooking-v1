#!/usr/bin/env python3
"""Replace Step 2 in BookingPage.jsx"""

filepath = 'frontend/src/pages/BookingPage.jsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find step 2 start and step 3 start
step2_start = None
step3_start = None
for i, line in enumerate(lines):
    if '{/* STEP 2: Device & Player Selection */}' in line:
        step2_start = i
    if '{/* STEP 3: Customer Details */}' in line:
        step3_start = i
        break

print(f"Step 2 starts at line {step2_start + 1}, Step 3 starts at line {step3_start + 1}")

new_step2 = '''          {/* STEP 2: Game & Device Selection - Redesigned */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="booking-card step2-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Step 2 Header */}
              <div className="card-header with-back">
                <button className="back-button" onClick={() => setCurrentStep(1)}>
                  <FiArrowLeft />
                </button>
                <div className="card-icon">
                  <FiMonitor />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">Choose Your Experience</h2>
                  <p className="card-subtitle">Pick a game or select your gaming station</p>
                </div>
                <div className="header-session-info">
                  <div className="session-badge">
                    <FiCalendar className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Date</span>
                      <span className="badge-value">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="session-badge">
                    <FiClock className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Time</span>
                      <span className="badge-value">{formatTime12Hour(selectedTime)}</span>
                    </div>
                  </div>
                  <div className="session-badge">
                    <FiUsers className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Capacity</span>
                      <span className={`badge-value ${totalPlayers + ps5Bookings.reduce((sum, b) => sum + b.player_count, 0) > 8 ? 'warning' : ''}`}>
                        {totalPlayers + ps5Bookings.reduce((sum, b) => sum + b.player_count, 0)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  className="alert alert-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
              
              {loading ? (
                <div className="loading-container">
                  <div className="loader">
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                  </div>
                  <p className="loading-text">Checking availability...</p>
                </div>
              ) : (
                <>
                  {/* Mode Toggle Tabs */}
                  <div className="selection-mode-tabs">
                    <button 
                      className={`mode-tab ${selectionMode === 'game' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('game')}
                    >
                      <FiGrid className="mode-tab-icon" />
                      <span>Browse by Game</span>
                    </button>
                    <button 
                      className={`mode-tab ${selectionMode === 'device' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('device')}
                    >
                      <FiMonitor className="mode-tab-icon" />
                      <span>Choose by Console</span>
                    </button>
                  </div>

                  {/* Availability Warning */}
                  {(availablePS5Units.length < 3 || !availableDriving) && (
                    <motion.div 
                      className="alert alert-warning"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="alert-icon">⚡</span>
                      <div>
                        <strong>Limited Availability</strong>
                        <p>
                          {availablePS5Units.length < 3 && `PS5 Units ${[1, 2, 3].filter(n => !availablePS5Units.includes(n)).join(', ')} already booked. `}
                          {!availableDriving && `Driving Simulator occupied.`}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    {/* ===== GAME-FIRST MODE ===== */}
                    {selectionMode === 'game' && (
                      <motion.div
                        key="game-mode"
                        className="game-selection-section"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Selected Game Banner */}
                        {selectedGame && (
                          <motion.div 
                            className="selected-game-banner"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <div className="sgb-content">
                              <div className="sgb-game-icon">🎮</div>
                              <div className="sgb-info">
                                <span className="sgb-label">Playing</span>
                                <span className="sgb-name">{selectedGame.name}</span>
                                <span className="sgb-meta">
                                  {selectedGame.genre} • Up to {selectedGame.max_players}P
                                  {recommendedPS5Units.length > 0 && (
                                    <span className="sgb-available"> • Available on Unit{recommendedPS5Units.length > 1 ? 's' : ''} {recommendedPS5Units.join(', ')}</span>
                                  )}
                                </span>
                              </div>
                              <button className="sgb-change" onClick={() => { setSelectedGame(null); setPs5Bookings([]); }}>
                                <FiX /> Change
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* Game Search & Filter */}
                        {!selectedGame && (
                          <div className="game-browser">
                            <div className="game-browser-header">
                              <h3 className="section-title">
                                <FiStar className="section-icon" />
                                <span>What do you want to play?</span>
                              </h3>
                              <div className="game-search-box">
                                <FiSearch className="search-icon" />
                                <input
                                  type="text"
                                  placeholder="Search games..."
                                  value={gameSearchQuery}
                                  onChange={(e) => setGameSearchQuery(e.target.value)}
                                  className="game-search-input"
                                />
                                {gameSearchQuery && (
                                  <button className="search-clear" onClick={() => setGameSearchQuery('')}>
                                    <FiX />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Genre Filter Pills */}
                            <div className="genre-filter-scroll">
                              <div className="genre-filter-pills">
                                {gameGenres.map(genre => (
                                  <button
                                    key={genre}
                                    className={`genre-pill ${activeGenreFilter === genre ? 'active' : ''}`}
                                    onClick={() => setActiveGenreFilter(genre)}
                                  >
                                    {genre}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Games Grid */}
                            {gamesLoading ? (
                              <div className="loading-container" style={{ padding: '30px' }}>
                                <div className="loader"><div className="loader-ring"></div><div className="loader-ring"></div></div>
                                <p className="loading-text">Loading games...</p>
                              </div>
                            ) : (
                              <motion.div 
                                className="games-grid"
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                              >
                                {filteredGames.map((game) => {
                                  const gameAvailableUnits = (game.ps5_numbers || []).filter(n => availablePS5Units.includes(n));
                                  const isGameAvailable = gameAvailableUnits.length > 0;
                                  
                                  return (
                                    <motion.div
                                      key={game.id}
                                      variants={fadeInUp}
                                      className={`game-card ${!isGameAvailable ? 'game-unavailable' : ''} ${selectedGame?.id === game.id ? 'game-selected' : ''}`}
                                      onClick={() => isGameAvailable && handleGameSelect(game)}
                                      whileHover={isGameAvailable ? { y: -6, scale: 1.02 } : {}}
                                      whileTap={isGameAvailable ? { scale: 0.98 } : {}}
                                    >
                                      <div className="game-card-visual">
                                        <div className="game-card-gradient"></div>
                                        <div className="game-card-emoji">🎮</div>
                                        {game.rating && (
                                          <div className="game-rating-badge">
                                            <FiStar className="rating-star" />
                                            <span>{game.rating}</span>
                                          </div>
                                        )}
                                        {!isGameAvailable && (
                                          <div className="game-unavail-overlay">
                                            <span>Unavailable</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="game-card-info">
                                        <h4 className="game-card-name">{game.name}</h4>
                                        <div className="game-card-meta">
                                          <span className="game-genre-tag">{game.genre}</span>
                                          <span className="game-players-tag">
                                            <FiUsers className="tag-icon" />
                                            {game.max_players}P
                                          </span>
                                        </div>
                                        <div className="game-card-units">
                                          {(game.ps5_numbers || []).map(n => (
                                            <span 
                                              key={n} 
                                              className={`unit-chip ${availablePS5Units.includes(n) ? 'available' : 'booked'}`}
                                            >
                                              PS5-{n}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                                {filteredGames.length === 0 && (
                                  <div className="no-games-found">
                                    <span className="no-games-emoji">🔍</span>
                                    <p>No games found matching your search</p>
                                    <button className="reset-filters-btn" onClick={() => { setGameSearchQuery(''); setActiveGenreFilter('All'); }}>
                                      Reset Filters
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* PS5 Unit Selection (shown after game is picked) */}
                        {selectedGame && (
                          <motion.div 
                            className="post-game-device-select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                          >
                            <h3 className="section-title">
                              <FiMonitor className="section-icon" />
                              <span>Configure Your Session</span>
                            </h3>
                            
                            <div className="recommended-units-grid">
                              {[1, 2, 3].map((unitNumber) => {
                                const booking = ps5Bookings.find(b => b.device_number === unitNumber);
                                const isExpanded = expandedPS5 === unitNumber;
                                const isSelected = !!booking;
                                const isAvailable = availablePS5Units.includes(unitNumber);
                                const hasGame = (selectedGame.ps5_numbers || []).includes(unitNumber);
                                const isRecommended = hasGame && isAvailable;
                                
                                if (!hasGame) return null;
                                
                                return (
                                  <motion.div 
                                    key={`ps5-game-${unitNumber}`}
                                    layout
                                    className={`device-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''} ${isRecommended ? 'recommended' : ''}`}
                                    onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                                    whileHover={isAvailable ? { y: -4 } : {}}
                                  >
                                    {isRecommended && !isSelected && (
                                      <div className="recommended-tag">
                                        <FiZap /> Best Match
                                      </div>
                                    )}
                                    {!isAvailable && (
                                      <div className="unavailable-badge"><span>BOOKED</span></div>
                                    )}
                                    {isSelected && (
                                      <div className="selected-badge"><FiCheck /> Selected</div>
                                    )}
                                    
                                    <div className="device-header">
                                      <div className="device-icon-wrapper ps5">
                                        <FiMonitor className="device-icon" />
                                      </div>
                                      <div className="device-details">
                                        <h4 className="device-name">PlayStation 5</h4>
                                        <span className="device-unit">Unit {unitNumber}</span>
                                      </div>
                                      {isAvailable && (
                                        <div className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                                          </svg>
                                        </div>
                                      )}
                                    </div>

                                    {!isExpanded && isAvailable && (
                                      <div className="device-games-preview">
                                        {getGamesForUnit(unitNumber).slice(0, 3).map(g => (
                                          <span key={g.id} className={`mini-game-tag ${g.id === selectedGame?.id ? 'highlight' : ''}`}>
                                            {g.name}
                                          </span>
                                        ))}
                                        {getGamesForUnit(unitNumber).length > 3 && (
                                          <span className="mini-game-tag more">+{getGamesForUnit(unitNumber).length - 3} more</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <AnimatePresence>
                                      {isExpanded && isAvailable && (
                                        <motion.div 
                                          className="device-options"
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="option-group">
                                            <label className="option-label">
                                              <FiUsers className="option-icon" />
                                              Number of Players
                                            </label>
                                            <div className="player-buttons">
                                              {[0, 1, 2, 3].map((idx) => (
                                                <button
                                                  key={idx}
                                                  className={`player-btn ${booking && booking.player_count >= idx + 1 ? 'active' : ''}`}
                                                  onClick={() => handlePlayerSelect(unitNumber, idx)}
                                                >
                                                  {idx + 1}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          {booking && (
                                            <div className="option-group">
                                              <label className="option-label">
                                                <FiClock className="option-icon" />
                                                Session Duration
                                              </label>
                                              <div className="duration-buttons">
                                                {[30, 60, 90, 120].map(dur => (
                                                  <button
                                                    key={dur}
                                                    className={`duration-btn ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                    onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                                  >
                                                    <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                                    <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* ===== DEVICE-FIRST MODE ===== */}
                    {selectionMode === 'device' && (
                      <motion.div
                        key="device-mode"
                        className="devices-section"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="devices-section-header">
                          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                            <FiMonitor className="section-icon" />
                            <span>PlayStation 5 Consoles</span>
                          </h3>
                        </div>
                        
                        <div className="devices-grid">
                          {[1, 2, 3].map((unitNumber) => {
                            const booking = ps5Bookings.find(b => b.device_number === unitNumber);
                            const isExpanded = expandedPS5 === unitNumber;
                            const isSelected = !!booking;
                            const isAvailable = availablePS5Units.includes(unitNumber);
                            const unitGames = getGamesForUnit(unitNumber);
                            
                            return (
                              <motion.div 
                                key={`ps5-${unitNumber}`}
                                layout
                                className={`device-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                                whileHover={isAvailable ? { y: -4 } : {}}
                              >
                                {!isAvailable && (
                                  <div className="unavailable-badge"><span>BOOKED</span></div>
                                )}
                                {isSelected && (
                                  <div className="selected-badge"><FiCheck /> Selected</div>
                                )}
                                
                                <div className="device-header">
                                  <div className="device-icon-wrapper ps5">
                                    <FiMonitor className="device-icon" />
                                  </div>
                                  <div className="device-details">
                                    <h4 className="device-name">PlayStation 5</h4>
                                    <span className="device-unit">Unit {unitNumber}</span>
                                  </div>
                                  {isAvailable && (
                                    <div className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                {!isExpanded && isAvailable && unitGames.length > 0 && (
                                  <div className="device-games-preview">
                                    {unitGames.slice(0, 3).map(g => (
                                      <span key={g.id} className="mini-game-tag">{g.name}</span>
                                    ))}
                                    {unitGames.length > 3 && (
                                      <span className="mini-game-tag more">+{unitGames.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                                
                                <AnimatePresence>
                                  {isExpanded && isAvailable && (
                                    <motion.div 
                                      className="device-options"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {unitGames.length > 0 && (
                                        <div className="option-group">
                                          <label className="option-label">
                                            <FiStar className="option-icon" />
                                            Available Games
                                          </label>
                                          <div className="unit-games-list">
                                            {unitGames.map(g => (
                                              <div 
                                                key={g.id} 
                                                className={`unit-game-item ${booking?.game_preference === g.name ? 'chosen' : ''}`}
                                                onClick={() => {
                                                  if (booking) {
                                                    setPs5Bookings(ps5Bookings.map(b => 
                                                      b.device_number === unitNumber 
                                                        ? { ...b, game_preference: booking.game_preference === g.name ? null : g.name } 
                                                        : b
                                                    ));
                                                  }
                                                  setSelectedGame(g);
                                                }}
                                              >
                                                <span className="unit-game-name">{g.name}</span>
                                                <span className="unit-game-genre">{g.genre}</span>
                                                {g.rating && (
                                                  <span className="unit-game-rating">
                                                    <FiStar className="mini-star" /> {g.rating}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="option-group">
                                        <label className="option-label">
                                          <FiUsers className="option-icon" />
                                          Number of Players
                                        </label>
                                        <div className="player-buttons">
                                          {[0, 1, 2, 3].map((idx) => (
                                            <button
                                              key={idx}
                                              className={`player-btn ${booking && booking.player_count >= idx + 1 ? 'active' : ''}`}
                                              onClick={() => handlePlayerSelect(unitNumber, idx)}
                                            >
                                              {idx + 1}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {booking && (
                                        <div className="option-group">
                                          <label className="option-label">
                                            <FiClock className="option-icon" />
                                            Session Duration
                                          </label>
                                          <div className="duration-buttons">
                                            {[30, 60, 90, 120].map(dur => (
                                              <button
                                                key={dur}
                                                className={`duration-btn ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                              >
                                                <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                                <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Driving Simulator - Always visible */}
                  <div className="devices-section" style={{ marginTop: selectionMode === 'game' && !selectedGame ? 0 : 8 }}>
                    <h3 className="section-title driving-title">
                      <FiCpu className="section-icon" />
                      Racing Simulator
                    </h3>
                    
                    <motion.div 
                      layout
                      className={`device-card driving-card ${drivingSim ? 'selected' : ''} ${!availableDriving ? 'unavailable' : ''}`}
                      onClick={() => availableDriving && handleDrivingSimToggle()}
                      whileHover={availableDriving ? { y: -4 } : {}}
                    >
                      {!availableDriving && (
                        <div className="unavailable-badge"><span>BOOKED</span></div>
                      )}
                      {drivingSim && (
                        <div className="selected-badge"><FiCheck /> Selected</div>
                      )}

                      <div className="device-header">
                        <div className="device-icon-wrapper driving">
                          <FiCpu className="device-icon" />
                        </div>
                        <div className="device-details">
                          <h4 className="device-name">Racing Simulator</h4>
                          <span className="device-unit">Pro Setup with Wheel & Pedals</span>
                        </div>
                        {availableDriving && drivingSim && (
                          <div className="check-indicator"><FiCheck /></div>
                        )}
                      </div>

                      <AnimatePresence>
                        {drivingSim && availableDriving && (
                          <motion.div 
                            className="device-options"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="option-group">
                              <label className="option-label">
                                <FiClock className="option-icon" />
                                Session Duration
                              </label>
                              <div className="duration-buttons">
                                {[30, 60, 90, 120].map(dur => (
                                  <button
                                    key={dur}
                                    className={`duration-btn ${drivingSim.duration === dur ? 'active' : ''}`}
                                    onClick={() => handleDrivingDurationChange(dur)}
                                  >
                                    <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                    <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {ps5Bookings.length > 0 && (
                              <div className="option-group after-ps5-option">
                                <label className="toggle-label">
                                  <input
                                    type="checkbox"
                                    checked={drivingSim.afterPS5 || false}
                                    onChange={(e) => handleDrivingAfterPS5Change(e.target.checked)}
                                  />
                                  <span className="toggle-switch"></span>
                                  <span className="toggle-text">Start after PS5 session ends</span>
                                </label>
                                {drivingSim.afterPS5 && (
                                  <p className="after-ps5-info">
                                    <FiClock className="info-icon-sm" />
                                    Starts at: {(() => {
                                      const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
                                      const [h, m] = selectedTime.split(':').map(Number);
                                      const total = h * 60 + m + maxPS5;
                                      return formatTime12Hour(`${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`);
                                    })()}
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Fixed Price Footer */}
                  {(ps5Bookings.length > 0 || drivingSim) && (
                    <motion.div 
                        className="pf-fixed-footer"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="pf-container">
                            <div className="pf-price-section">
                                <span className="pf-label">TOTAL</span>
                                <span className="pf-amount">
                                  {discountInfo ? (
                                    <span style={{ color: '#10b981' }}>{formatPrice(price)}</span> 
                                  ) : (
                                    formatPrice(price)
                                  )}
                                </span>
                            </div>
                            <button 
                                className="pf-next-btn"
                                onClick={() => setCurrentStep(3)}
                            >
                                <span>Review Booking</span>
                                <FiArrowRight />
                            </button>
                        </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
          
'''

# Build new file content
new_lines = lines[:step2_start] + [new_step2] + lines[step3_start:]

with open(filepath, 'w') as f:
    f.writelines(new_lines)

print(f"✅ Replaced lines {step2_start+1}-{step3_start} with new Step 2")
print(f"New file has {len(new_lines)} lines")
