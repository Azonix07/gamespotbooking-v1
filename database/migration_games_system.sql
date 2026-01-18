-- ===================================
-- GAMES SYSTEM DATABASE MIGRATION
-- ===================================
-- This migration creates tables for:
-- 1. Games catalog
-- 2. PS5-Game associations
-- 3. Game recommendations with voting

USE gamespot_booking;

-- ===================================
-- 1. GAMES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    cover_image VARCHAR(500),
    genre VARCHAR(100),
    max_players INT DEFAULT 1,
    rating DECIMAL(3,1) DEFAULT 0.0,
    description TEXT,
    release_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 2. PS5_GAMES JUNCTION TABLE
-- ===================================
-- Tracks which PS5 console has which games installed
CREATE TABLE IF NOT EXISTS ps5_games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ps5_number INT NOT NULL, -- 1, 2, or 3
    game_id INT NOT NULL,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ps5_game (ps5_number, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 3. GAME RECOMMENDATIONS TABLE
-- ===================================
-- Users can request games they want added
CREATE TABLE IF NOT EXISTS game_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    game_name VARCHAR(255) NOT NULL,
    description TEXT,
    votes INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 4. GAME VOTES TABLE
-- ===================================
-- Track who voted for which recommendation
CREATE TABLE IF NOT EXISTS game_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    recommendation_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (user_id, recommendation_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES game_recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SEED DATA: POPULAR PS5 GAMES
-- ===================================

-- Insert popular games
INSERT INTO games (name, cover_image, genre, max_players, rating, description, release_year) VALUES
('God of War Ragnarök', '/images/games/god-of-war.jpg', 'Action-Adventure', 1, 9.5, 'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go.', 2022),
('Spider-Man 2', '/images/games/spiderman-2.jpg', 'Action-Adventure', 1, 9.0, 'The incredible power of the symbiote forces Peter and Miles to face the ultimate test of strength.', 2023),
('Horizon Forbidden West', '/images/games/horizon.jpg', 'Action RPG', 1, 8.8, 'Join Aloy as she braves the Forbidden West - a majestic but dangerous frontier.', 2022),
('The Last of Us Part II', '/images/games/tlou2.jpg', 'Action-Adventure', 1, 9.2, 'Experience the emotional story of Ellie on her quest for justice and revenge.', 2020),
('Gran Turismo 7', '/images/games/gt7.jpg', 'Racing', 1, 8.5, 'The ultimate driving simulator returns with over 400 cars and stunning graphics.', 2022),
('Call of Duty: Modern Warfare III', '/images/games/cod-mw3.jpg', 'First-Person Shooter', 4, 8.0, 'The direct sequel to 2022s Modern Warfare II continues the story.', 2023),
('FIFA 24', '/images/games/fifa24.jpg', 'Sports', 4, 8.2, 'The world\'s game featuring HyperMotionV technology and over 19,000 players.', 2023),
('NBA 2K24', '/images/games/nba2k24.jpg', 'Sports', 4, 8.0, 'Experience basketball like never before with ProPLAY technology.', 2023),
('Mortal Kombat 1', '/images/games/mk1.jpg', 'Fighting', 2, 8.3, 'A new beginning for the iconic fighting franchise.', 2023),
('Resident Evil 4 Remake', '/images/games/re4.jpg', 'Survival Horror', 1, 9.3, 'Experience the horror classic reimagined with cutting-edge graphics.', 2023),
('Elden Ring', '/images/games/elden-ring.jpg', 'Action RPG', 1, 9.6, 'A new fantasy action RPG. Rise, Tarnished, and be guided by grace.', 2022),
('Hogwarts Legacy', '/images/games/hogwarts.jpg', 'Action RPG', 1, 8.4, 'Experience life as a student at Hogwarts School of Witchcraft and Wizardry.', 2023),
('Tekken 8', '/images/games/tekken8.jpg', 'Fighting', 2, 8.6, 'The legendary fighting game returns with stunning graphics.', 2024),
('Red Dead Redemption 2', '/images/games/rdr2.jpg', 'Action-Adventure', 1, 9.8, 'America, 1899. The end of the Wild West era has begun.', 2018),
('Assassins Creed Mirage', '/images/games/ac-mirage.jpg', 'Action-Adventure', 1, 8.1, 'Experience the story of Basim, a cunning street thief in Baghdad.', 2023),
('FC 24', '/images/games/fc24.jpg', 'Sports', 4, 8.3, 'EA SPORTS FC 24 welcomes you to a new era of football.', 2023),
('Uncharted: Legacy of Thieves', '/images/games/uncharted.jpg', 'Action-Adventure', 1, 8.9, 'Play as Nathan Drake and Chloe Frazer in remastered adventures.', 2022),
('Ghost of Tsushima', '/images/games/ghost-tsushima.jpg', 'Action-Adventure', 1, 9.1, 'A beautiful open-world samurai epic set in feudal Japan.', 2020),
('Demon\'s Souls', '/images/games/demons-souls.jpg', 'Action RPG', 1, 9.2, 'Entirely rebuilt from the ground up, this remake invites you to experience the unsettling story.', 2020),
('Ratchet & Clank: Rift Apart', '/images/games/ratchet.jpg', 'Action-Platformer', 1, 8.8, 'Go dimension-hopping with Ratchet and Clank.', 2021);

-- ===================================
-- ASSOCIATE GAMES WITH PS5 CONSOLES
-- ===================================

-- PS5-1: Action & Adventure focused
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(1, 1),  -- God of War Ragnarök
(1, 2),  -- Spider-Man 2
(1, 4),  -- The Last of Us Part II
(1, 10), -- Resident Evil 4
(1, 11), -- Elden Ring
(1, 14), -- Red Dead Redemption 2
(1, 18), -- Ghost of Tsushima
(1, 19), -- Demon's Souls
(1, 20); -- Ratchet & Clank

-- PS5-2: Sports & Multiplayer focused
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(2, 5),  -- Gran Turismo 7
(2, 6),  -- Call of Duty MW3
(2, 7),  -- FIFA 24
(2, 8),  -- NBA 2K24
(2, 9),  -- Mortal Kombat 1
(2, 13), -- Tekken 8
(2, 16), -- FC 24
(2, 2),  -- Spider-Man 2 (also here)
(2, 17); -- Uncharted

-- PS5-3: RPG & Story focused
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(3, 1),  -- God of War Ragnarök
(3, 3),  -- Horizon Forbidden West
(3, 11), -- Elden Ring
(3, 12), -- Hogwarts Legacy
(3, 14), -- Red Dead Redemption 2
(3, 15), -- Assassin's Creed Mirage
(3, 18), -- Ghost of Tsushima
(3, 19), -- Demon's Souls
(3, 4);  -- The Last of Us Part II

-- ===================================
-- SEED SAMPLE RECOMMENDATIONS
-- ===================================

INSERT INTO game_recommendations (user_id, game_name, description, votes, status) VALUES
(NULL, 'GTA VI', 'The most anticipated game! Would love to see it here.', 45, 'pending'),
(NULL, 'Elden Ring DLC', 'Shadow of the Erdtree expansion pack.', 32, 'pending'),
(NULL, 'Baldurs Gate 3', 'Award-winning RPG that everyone is talking about.', 28, 'pending'),
(NULL, 'Final Fantasy XVI', 'Latest entry in the legendary series.', 22, 'pending'),
(NULL, 'Cyberpunk 2077', 'Now fully fixed and amazing on PS5!', 18, 'pending');

-- ===================================
-- MIGRATION COMPLETE
-- ===================================

SELECT 'Games System Migration Completed!' as Status;
SELECT COUNT(*) as 'Total Games' FROM games;
SELECT COUNT(*) as 'PS5-Game Associations' FROM ps5_games;
SELECT COUNT(*) as 'Sample Recommendations' FROM game_recommendations;
