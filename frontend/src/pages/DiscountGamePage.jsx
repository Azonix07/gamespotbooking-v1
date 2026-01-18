import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAward, 
  FiTarget, 
  FiZap, 
  FiPlay, 
  FiPause, 
  FiRotateCcw,
  FiUsers,
  FiClock,
  FiStar,
  FiGift,
  FiMaximize,
  FiMinimize
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiClient';
import '../styles/DiscountGamePage.css';

const DiscountGamePage = () => {
  // Game State
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Player State
  const [playerName, setPlayerName] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  
  // Game Objects (Enemies/Creatures)
  const [enemies, setEnemies] = useState([]);
  const [clickedEnemies, setClickedEnemies] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Game Statistics
  const [enemiesShot, setEnemiesShot] = useState(0);
  const [bossesShot, setBossesShot] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  
  // Combo System
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const comboTimeoutRef = useRef(null);
  
  // Visual Effects
  const [hitEffects, setHitEffects] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Refs
  const gameAreaRef = useRef(null);
  const gameContainerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const enemySpawnRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isPlayingRef = useRef(false); // Track playing state in ref for callbacks

  // Load leaderboard from localStorage
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('gamespot_leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
    
    const savedHighScore = localStorage.getItem('gamespot_highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Track mouse position for crosshair
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameState === 'playing') {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Save leaderboard to localStorage AND backend
  const saveToLeaderboard = useCallback(async (name, finalScore) => {
    // Save to localStorage (for offline access)
    const existingPlayerIndex = leaderboard.findIndex(
      player => player.name.toLowerCase() === name.toLowerCase()
    );

    let updatedLeaderboard;
    if (existingPlayerIndex !== -1) {
      // Update existing player if new score is higher
      updatedLeaderboard = [...leaderboard];
      if (finalScore > updatedLeaderboard[existingPlayerIndex].score) {
        updatedLeaderboard[existingPlayerIndex] = {
          name,
          score: finalScore,
          date: new Date().toISOString()
        };
      }
    } else {
      // Add new player
      updatedLeaderboard = [
        ...leaderboard,
        {
          name,
          score: finalScore,
          date: new Date().toISOString()
        }
      ];
    }

    // Sort by score descending and keep top 10
    updatedLeaderboard.sort((a, b) => b.score - a.score);
    updatedLeaderboard = updatedLeaderboard.slice(0, 10);

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('gamespot_leaderboard', JSON.stringify(updatedLeaderboard));

    // Update high score
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('gamespot_highscore', finalScore.toString());
    }

    // Submit to backend API
    try {
      const accuracy = totalClicks > 0 ? ((enemiesShot + bossesShot) / totalClicks * 100).toFixed(2) : 0;
      
      const data = await apiFetch('/api/game/score', {
        method: 'POST',
        body: JSON.stringify({
          player_name: name,
          score: finalScore,
          enemies_shot: enemiesShot,
          boss_enemies_shot: bossesShot,
          accuracy_percentage: parseFloat(accuracy),
          game_duration_seconds: 60,
          session_id: `${name}-${Date.now()}`,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.split(/[()]/)[1] || 'unknown'
        })
      });
      
      if (data.success) {
        console.log('Score submitted to backend:', data);
        
        // Show winner message if player is #1
        if (data.is_winner) {
          alert(`🎉 Congratulations! You're #1 on the leaderboard! You win 30 minutes FREE gaming!`);
        }
      }
    } catch (error) {
      console.error('Failed to submit score to backend:', error);
      // Continue even if backend submission fails (localStorage still works)
    }
  }, [leaderboard, highScore, enemiesShot, bossesShot, totalClicks]);

  // Generate random enemy creature
  const generateEnemy = useCallback(() => {
    if (!isPlayingRef.current) return;

    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    
    const areaWidth = gameArea.clientWidth;
    const areaHeight = gameArea.clientHeight;
    
    if (areaWidth < 100 || areaHeight < 100) return; // Safety check

    const id = Date.now() + Math.random();
    const size = Math.random() * 20 + 40; // 40-60px creatures
    const points = Math.floor(150 - size); // Smaller = more points
    const speed = Math.random() * 3 + 2; // 2-5 pixels per frame
    const lifetime = Math.random() * 3000 + 4000; // 4-7 seconds

    // Spawn enemies at random positions inside the game area
    const padding = 50;
    const startX = padding + Math.random() * (areaWidth - size - padding * 2);
    const startY = padding + Math.random() * (areaHeight - size - padding * 2);
    
    // Random movement direction
    const angle = Math.random() * Math.PI * 2;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);

    // More creature variety
    const creatureTypes = ['👾', '👻', '🦇', '🐙', '🦖', '🐉', '🦂', '🕷️', '🎃', '💀', '👹', '🦑', '🐍', '🦎', '🪲'];
    const enemy = {
      id,
      x: startX,
      y: startY,
      size,
      points,
      speed,
      directionX,
      directionY,
      type: Math.random() > 0.85 ? 'boss' : 'normal', // 15% boss creatures
      creature: creatureTypes[Math.floor(Math.random() * creatureTypes.length)],
      rotation: 0,
      spawnTime: Date.now()
    };

    setEnemies(prev => [...prev, enemy]);

    // Remove enemy after lifetime
    setTimeout(() => {
      setEnemies(prev => prev.filter(e => e.id !== id));
      setClickedEnemies(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, lifetime);
  }, []);

  // Animate enemies movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animate = () => {
      setEnemies(prevEnemies => 
        prevEnemies.map(enemy => {
          const gameArea = gameAreaRef.current;
          if (!gameArea) return enemy;

          let newX = enemy.x + (enemy.directionX * enemy.speed);
          let newY = enemy.y + (enemy.directionY * enemy.speed);
          let newDirX = enemy.directionX;
          let newDirY = enemy.directionY;

          // Bounce off edges
          if (newX < 0 || newX > gameArea.clientWidth - enemy.size) {
            newDirX = -enemy.directionX;
            newX = enemy.x;
          }
          if (newY < 0 || newY > gameArea.clientHeight - enemy.size) {
            newDirY = -enemy.directionY;
            newY = enemy.y;
          }

          return {
            ...enemy,
            x: newX,
            y: newY,
            directionX: newDirX,
            directionY: newDirY,
            rotation: enemy.rotation + 2
          };
        })
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // Handle enemy click (shoot)
  const handleEnemyClick = useCallback((enemy, e) => {
    if (clickedEnemies.has(enemy.id)) return;
    
    // Prevent click event from bubbling
    e?.stopPropagation();

    // Calculate combo multiplier
    const now = Date.now();
    let newCombo = combo;
    if (now - lastHitTime < 1500) { // 1.5 second window for combo
      newCombo = combo + 1;
    } else {
      newCombo = 1;
    }
    setCombo(newCombo);
    setLastHitTime(now);
    setMaxCombo(prev => Math.max(prev, newCombo));
    
    // Reset combo timeout
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = setTimeout(() => {
      setCombo(0);
    }, 1500);

    // Calculate points with combo bonus
    const comboMultiplier = 1 + (Math.min(newCombo, 10) * 0.1); // Up to 2x at 10 combo
    const basePoints = enemy.type === 'boss' ? enemy.points * 3 : enemy.points;
    const pointsEarned = Math.floor(basePoints * comboMultiplier);
    
    setScore(prev => prev + pointsEarned);
    setClickedEnemies(prev => new Set(prev).add(enemy.id));

    // Update statistics
    setEnemiesShot(prev => prev + 1);
    if (enemy.type === 'boss') {
      setBossesShot(prev => prev + 1);
    }
    setTotalClicks(prev => prev + 1);
    
    // Add hit effect
    const hitEffect = {
      id: Date.now(),
      x: enemy.x + enemy.size / 2,
      y: enemy.y + enemy.size / 2,
      points: pointsEarned,
      combo: newCombo,
      isBoss: enemy.type === 'boss'
    };
    setHitEffects(prev => [...prev, hitEffect]);
    
    // Remove hit effect after animation
    setTimeout(() => {
      setHitEffects(prev => prev.filter(effect => effect.id !== hitEffect.id));
    }, 800);
    
    // Screen shake for boss kills
    if (enemy.type === 'boss') {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    }

    // Remove enemy immediately with explosion effect
    setEnemies(prev => prev.filter(e => e.id !== enemy.id));
  }, [clickedEnemies, combo, lastHitTime]);

  // Start game
  const startGame = useCallback(() => {
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    // Set the playing ref BEFORE everything else
    isPlayingRef.current = true;

    setIsNameEntered(true);
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setEnemies([]);
    setClickedEnemies(new Set());
    setEnemiesShot(0);
    setBossesShot(0);
    setTotalClicks(0);
    setCombo(0);
    setMaxCombo(0);
    setHitEffects([]);

    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // End game when time runs out
          isPlayingRef.current = false;
          setGameState('gameover');
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
          }
          if (enemySpawnRef.current) {
            clearInterval(enemySpawnRef.current);
            enemySpawnRef.current = null;
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start spawning enemies
    enemySpawnRef.current = setInterval(() => {
      generateEnemy();
    }, 1000); // Spawn every 1 second
  }, [playerName, generateEnemy]);

  // End game
  const endGame = useCallback(() => {
    setGameState('gameover');
    
    // Clear intervals
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (enemySpawnRef.current) {
      clearInterval(enemySpawnRef.current);
      enemySpawnRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Save to leaderboard
    if (playerName.trim()) {
      saveToLeaderboard(playerName.trim(), score);
    }

    // Clear enemies
    setEnemies([]);
    setClickedEnemies(new Set());
  }, [score, playerName, saveToLeaderboard]);

  // Pause game
  const pauseGame = () => {
    isPlayingRef.current = false;
    setGameState('paused');
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    if (enemySpawnRef.current) {
      clearInterval(enemySpawnRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Resume game
  const resumeGame = useCallback(() => {
    isPlayingRef.current = true;
    setGameState('playing');
    
    // Restart timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          isPlayingRef.current = false;
          setGameState('gameover');
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
          }
          if (enemySpawnRef.current) {
            clearInterval(enemySpawnRef.current);
            enemySpawnRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Restart spawning
    enemySpawnRef.current = setInterval(() => {
      generateEnemy();
    }, 1000);
  }, [generateEnemy]);

  // Reset game
  const resetGame = () => {
    isPlayingRef.current = false;
    setGameState('menu');
    setScore(0);
    setTimeLeft(60);
    setEnemies([]);
    setClickedEnemies(new Set());
    setIsNameEntered(false);
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (enemySpawnRef.current) {
      clearInterval(enemySpawnRef.current);
      enemySpawnRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (enemySpawnRef.current) clearInterval(enemySpawnRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  // Check if player qualifies for free gaming
  const qualifiesForPrize = leaderboard.length > 0 && 
    leaderboard[0].name.toLowerCase() === playerName.toLowerCase() &&
    gameState === 'gameover';

  return (
    <div className="discount-game-page" ref={gameContainerRef}>
      {!isFullscreen && <Navbar showCenter={false} />}
      
      {/* Animated Background */}
      <div className="game-bg-effects">
        <div className="game-bg-orb game-bg-orb-1"></div>
        <div className="game-bg-orb game-bg-orb-2"></div>
        <div className="game-bg-orb game-bg-orb-3"></div>
        <div className="game-bg-grid"></div>
      </div>

      <div className="container game-container">
        {/* Hero Section */}
        <motion.div 
          className="game-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-badge">
            <FiGift className="badge-icon" />
            Win Free Gaming Time!
          </div>
          <h1 className="game-title">
            <FiAward className="title-icon" />
            Creature Shooter Challenge
          </h1>
          <p className="game-subtitle">
            Shoot the moving creatures! Top scorer wins <span className="highlight">30 minutes FREE gaming!</span>
          </p>
        </motion.div>

        <div className="game-content">
          {/* Game Info Cards */}
          <div className="game-info-cards">
            <motion.div 
              className="info-card"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FiTarget className="info-icon" />
              <div className="info-content">
                <h3>How to Play</h3>
                <p>Aim with your cursor and shoot moving creatures. Smaller = more points!</p>
              </div>
            </motion.div>

            <motion.div 
              className="info-card"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FiZap className="info-icon" />
              <div className="info-content">
                <h3>Boss Creatures</h3>
                <p>Red boss creatures give 3x points. Don't miss them!</p>
              </div>
            </motion.div>

            <motion.div 
              className="info-card"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FiAward className="info-icon" />
              <div className="info-content">
                <h3>Win the Prize</h3>
                <p>Be the #1 on the leaderboard to win 30 mins of free gaming!</p>
              </div>
            </motion.div>
          </div>

          {/* Main Game Area */}
          <div className="game-main-section">
            <motion.div 
              className="game-panel"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Game Stats */}
              <div className="game-stats">
                <div className="stat-item">
                  <FiTarget className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{score}</span>
                  </div>
                </div>

                <div className="stat-item">
                  <FiClock className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Time</span>
                    <span className={`stat-value ${timeLeft <= 10 ? 'time-low' : ''}`}>{timeLeft}s</span>
                  </div>
                </div>

                <div className="stat-item">
                  <FiZap className="stat-icon combo-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Combo</span>
                    <span className={`stat-value ${combo >= 5 ? 'combo-high' : ''}`}>{combo}x</span>
                  </div>
                </div>

                <div className="stat-item">
                  <FiAward className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Best</span>
                    <span className="stat-value">{highScore}</span>
                  </div>
                </div>
              </div>

              {/* Game Area */}
              <div className="game-area-container">
                {gameState === 'menu' && (
                  <motion.div 
                    className="game-menu"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <FiTarget className="menu-icon" />
                    <h2>Ready to Play?</h2>
                    <p>Enter your name to start the challenge!</p>
                    
                    <input
                      type="text"
                      className="player-name-input"
                      placeholder="Enter your name..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startGame()}
                      maxLength={20}
                    />
                    
                    <div className="menu-buttons">
                      <button 
                        className="btn-start-game"
                        onClick={startGame}
                        disabled={!playerName.trim()}
                      >
                        <FiPlay />
                        Start Game
                      </button>

                      <button 
                        className="btn-fullscreen-start"
                        onClick={() => {
                          toggleFullscreen();
                          if (playerName.trim()) {
                            setTimeout(() => startGame(), 300);
                          }
                        }}
                        disabled={!playerName.trim()}
                      >
                        <FiMaximize />
                        Play Fullscreen
                      </button>
                    </div>

                    <button 
                      className="btn-view-leaderboard"
                      onClick={() => setShowLeaderboard(true)}
                    >
                      <FiUsers />
                      View Leaderboard
                    </button>
                  </motion.div>
                )}

                {gameState === 'playing' && (
                  <div 
                    className={`game-area shooter-mode ${screenShake ? 'screen-shake' : ''}`}
                    ref={gameAreaRef}
                    style={{ cursor: 'none' }}
                    onClick={() => setTotalClicks(prev => prev + 1)}
                  >
                    {/* Combo Display */}
                    {combo >= 2 && (
                      <motion.div 
                        className="combo-display"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={combo}
                      >
                        <span className="combo-count">{combo}x</span>
                        <span className="combo-text">COMBO!</span>
                      </motion.div>
                    )}
                    
                    {/* Hit Effects */}
                    <AnimatePresence>
                      {hitEffects.map(effect => (
                        <motion.div
                          key={effect.id}
                          className={`hit-effect ${effect.isBoss ? 'boss-hit' : ''}`}
                          style={{ left: effect.x, top: effect.y }}
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -60, scale: 1.5 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        >
                          <span className="hit-points">+{effect.points}</span>
                          {effect.combo >= 2 && (
                            <span className="hit-combo">{effect.combo}x</span>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Crosshair Cursor */}
                    <div 
                      className="crosshair"
                      style={{
                        left: mousePosition.x,
                        top: mousePosition.y,
                        position: 'fixed',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="crosshair-line crosshair-horizontal"></div>
                      <div className="crosshair-line crosshair-vertical"></div>
                      <div className="crosshair-center"></div>
                    </div>

                    {/* Moving Enemies */}
                    <AnimatePresence>
                      {enemies.map(enemy => (
                        <motion.div
                          key={enemy.id}
                          className={`enemy ${enemy.type === 'boss' ? 'boss' : ''} ${
                            clickedEnemies.has(enemy.id) ? 'shot' : ''
                          }`}
                          style={{
                            left: enemy.x,
                            top: enemy.y,
                            width: enemy.size,
                            height: enemy.size,
                            transform: `rotate(${enemy.rotation}deg)`
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0, rotate: 360 }}
                          onClick={(e) => handleEnemyClick(enemy, e)}
                        >
                          <span className="enemy-creature">{enemy.creature}</span>
                          <span className="enemy-points">+{enemy.points}</span>
                          {enemy.type === 'boss' && <div className="boss-glow"></div>}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Control Buttons */}
                    <div className="game-controls">
                      <button className="btn-pause-game" onClick={pauseGame}>
                        <FiPause />
                      </button>
                      <button className="btn-fullscreen" onClick={toggleFullscreen}>
                        {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                      </button>
                    </div>
                  </div>
                )}

                {gameState === 'paused' && (
                  <motion.div 
                    className="game-paused"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FiPause className="pause-icon" />
                    <h2>Game Paused</h2>
                    <div className="pause-actions">
                      <button className="btn-resume" onClick={resumeGame}>
                        <FiPlay />
                        Resume
                      </button>
                      <button className="btn-quit" onClick={resetGame}>
                        <FiRotateCcw />
                        Quit
                      </button>
                    </div>
                  </motion.div>
                )}

                {gameState === 'gameover' && (
                  <motion.div 
                    className="game-over"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {qualifiesForPrize ? (
                      <>
                        <FiAward className="trophy-icon winner" />
                        <h2 className="winner-title">🎉 Congratulations! 🎉</h2>
                        <p className="winner-text">
                          You're the TOP SCORER!
                        </p>
                        <div className="prize-banner">
                          <FiGift className="gift-icon" />
                          <span>You won 30 MINUTES of FREE GAMING!</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <FiTarget className="trophy-icon" />
                        <h2>Game Over!</h2>
                      </>
                    )}
                    
                    <div className="final-score-card">
                      <div className="score-row">
                        <span>Your Score:</span>
                        <span className="score-value">{score}</span>
                      </div>
                      <div className="score-row">
                        <span>Creatures Shot:</span>
                        <span className="score-value">{enemiesShot}</span>
                      </div>
                      <div className="score-row">
                        <span>Max Combo:</span>
                        <span className="score-value combo-value">{maxCombo}x</span>
                      </div>
                      <div className="score-row">
                        <span>Accuracy:</span>
                        <span className="score-value">
                          {totalClicks > 0 ? Math.round((enemiesShot / totalClicks) * 100) : 0}%
                        </span>
                      </div>
                      <div className="score-row highlight-row">
                        <span>High Score:</span>
                        <span className="score-value">{highScore}</span>
                      </div>
                      {!qualifiesForPrize && leaderboard.length > 0 && (
                        <div className="score-row beat-row">
                          <span>Score to Beat:</span>
                          <span className="score-value highlight">{leaderboard[0].score}</span>
                        </div>
                      )}
                    </div>

                    <div className="gameover-actions">
                      <button className="btn-play-again" onClick={startGame}>
                        <FiRotateCcw />
                        Play Again
                      </button>
                      <button className="btn-view-ranks" onClick={() => setShowLeaderboard(true)}>
                        <FiUsers />
                        View Rankings
                      </button>
                      <button className="btn-menu" onClick={resetGame}>
                        Back to Menu
                      </button>
                    </div>

                    {qualifiesForPrize && (
                      <p className="prize-note">
                        Show this screen to our staff to claim your prize! 🎮
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Game Instructions */}
              {gameState === 'menu' && (
                <div className="game-instructions">
                  <h3>🎯 Game Rules:</h3>
                  <ul>
                    <li>⏱️ You have 60 seconds to score as many points as possible</li>
                    <li>👾 Click creatures quickly before they escape</li>
                    <li>🔥 Smaller creatures = More points</li>
                    <li>👹 Red BOSS creatures give 3x points!</li>
                    <li>⚡ Build COMBOS for bonus multipliers (up to 2x!)</li>
                    <li>🏆 Top scorer wins 30 minutes of FREE gaming!</li>
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Leaderboard Panel */}
            <motion.div 
              className="leaderboard-panel"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="leaderboard-header">
                <FiAward className="leaderboard-icon" />
                <h2>Top Players</h2>
              </div>

              <div className="leaderboard-list">
                {leaderboard.length === 0 ? (
                  <div className="empty-leaderboard">
                    <FiUsers className="empty-icon" />
                    <p>No players yet!</p>
                    <p className="empty-subtitle">Be the first to play!</p>
                  </div>
                ) : (
                  leaderboard.map((player, index) => (
                    <motion.div
                      key={index}
                      className={`leaderboard-item ${index === 0 ? 'winner' : ''} ${
                        player.name.toLowerCase() === playerName.toLowerCase() ? 'current-player' : ''
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="rank">
                        {index === 0 && <FiAward className="rank-icon gold" />}
                        {index === 1 && <FiStar className="rank-icon silver" />}
                        {index === 2 && <FiStar className="rank-icon bronze" />}
                        {index > 2 && <span className="rank-number">#{index + 1}</span>}
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        {index === 0 && <span className="winner-badge">🏆 Winner</span>}
                      </div>
                      <div className="player-score">{player.score}</div>
                    </motion.div>
                  ))
                )}
              </div>

              {leaderboard.length > 0 && (
                <div className="prize-info">
                  <FiGift className="prize-icon" />
                  <p>Current winner gets 30 mins FREE gaming!</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div 
            className="modal-overlay"
            onClick={() => setShowLeaderboard(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content leaderboard-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="modal-header">
                <FiAward className="modal-icon" />
                <h2>Leaderboard Rankings</h2>
              </div>

              <div className="modal-leaderboard">
                {leaderboard.length === 0 ? (
                  <div className="empty-modal-leaderboard">
                    <FiUsers className="empty-icon" />
                    <p>No players yet!</p>
                  </div>
                ) : (
                  leaderboard.map((player, index) => (
                    <div
                      key={index}
                      className={`modal-leaderboard-item ${index === 0 ? 'winner' : ''}`}
                    >
                      <div className="modal-rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                      <div className="modal-player-info">
                        <span className="modal-player-name">{player.name}</span>
                        <span className="modal-player-date">
                          {new Date(player.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="modal-player-score">{player.score} pts</div>
                    </div>
                  ))
                )}
              </div>

              <button 
                className="btn-close-modal"
                onClick={() => setShowLeaderboard(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default DiscountGamePage;
