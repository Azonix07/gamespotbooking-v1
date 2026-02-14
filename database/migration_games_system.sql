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
-- SEED DATA: ACTUAL GAMESPOT INSTALLED GAMES
-- ===================================

-- Clear old data first
DELETE FROM ps5_games;
DELETE FROM games;

-- Insert the ACTUAL games installed at GameSpot
INSERT INTO games (id, name, cover_image, genre, max_players, rating, description, release_year) VALUES
(1, 'Spider-Man 2', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6bw6.jpg', 'Action-Adventure', 1, 9.0, 'The incredible power of the symbiote forces Peter and Miles to face the ultimate test.', 2023),
(2, 'FC 26', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0w.jpg', 'Sports', 4, 8.5, 'The latest EA Sports football experience with next-gen gameplay.', 2025),
(3, 'WWE 2K24', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7kso.jpg', 'Fighting', 4, 8.0, 'Step into the ring with WWE superstars in the most electrifying wrestling game.', 2024),
(4, 'Split Fiction', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co9bvk.jpg', 'Co-op Adventure', 2, 9.0, 'A co-op adventure where two writers get trapped inside their own stories.', 2025),
(5, 'It Takes Two', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2t8f.jpg', 'Co-op Adventure', 2, 9.2, 'An award-winning co-op platformer about a couple turned into dolls.', 2021),
(6, 'Marvel Rivals', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co8t4b.jpg', 'Shooter', 2, 8.3, 'Team-based PvP shooter featuring iconic Marvel heroes and villains.', 2024),
(7, 'Mortal Kombat 1', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6bkp.jpg', 'Fighting', 2, 8.3, 'A new beginning for the iconic fighting franchise. Liu Kang has reshaped the universe.', 2023),
(8, 'GTA 5', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg', 'Action-Adventure', 2, 9.7, 'The blockbuster open-world adventure in Los Santos, now on PS5.', 2022),
(9, 'WWE 2K25', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co9dpi.jpg', 'Fighting', 4, 8.2, 'The newest WWE wrestling game with updated rosters and gameplay.', 2025),
(10, 'Gran Turismo 7', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3mni.jpg', 'Racing', 2, 8.5, 'The real driving simulator. The definitive Gran Turismo experience.', 2022),
(11, 'Forza Horizon 5', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3ofx.jpg', 'Racing', 1, 9.1, 'Explore the vibrant world of Mexico in the ultimate open-world racing game.', 2021),
(12, 'The Crew Motorfest', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6g4a.jpg', 'Racing', 1, 7.8, 'A festival of speed set in the paradise of Hawaii.', 2023);

-- ===================================
-- ASSOCIATE GAMES WITH PS5/DEVICES
-- ===================================

-- PS5-1: Spider-Man 2, FC26, WWE 2K24, Split Fiction, It Takes Two, Marvel Rivals, Mortal Kombat 1, GTA 5
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(1, 1),  -- Spider-Man 2
(1, 2),  -- FC 26
(1, 3),  -- WWE 2K24
(1, 4),  -- Split Fiction
(1, 5),  -- It Takes Two
(1, 6),  -- Marvel Rivals
(1, 7),  -- Mortal Kombat 1
(1, 8);  -- GTA 5

-- PS5-2: FC26, WWE 2K24, Split Fiction, It Takes Two, Mortal Kombat 1, GTA 5
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(2, 2),  -- FC 26
(2, 3),  -- WWE 2K24
(2, 4),  -- Split Fiction
(2, 5),  -- It Takes Two
(2, 7),  -- Mortal Kombat 1
(2, 8);  -- GTA 5

-- PS5-3: FC26, WWE 2K25, Split Fiction, It Takes Two, Mortal Kombat 1, GTA 5, Gran Turismo 7
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(3, 2),  -- FC 26
(3, 9),  -- WWE 2K25
(3, 4),  -- Split Fiction
(3, 5),  -- It Takes Two
(3, 7),  -- Mortal Kombat 1
(3, 8),  -- GTA 5
(3, 10); -- Gran Turismo 7

-- Driving Simulator (Unit 4): Forza Horizon 5, The Crew Motorfest, Gran Turismo 7
INSERT INTO ps5_games (ps5_number, game_id) VALUES
(4, 11), -- Forza Horizon 5
(4, 12), -- The Crew Motorfest
(4, 10); -- Gran Turismo 7

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
