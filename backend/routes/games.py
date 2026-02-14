"""
Games API Routes
Handles game catalog, PS5 filtering, and game recommendations with voting
"""

import sys
from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_login as require_auth
import mysql.connector

games_bp = Blueprint('games', __name__)

# Fallback games data when database tables don't exist
# These are the ACTUAL games installed on each device at GameSpot
FALLBACK_GAMES = [
    {
        'id': 1, 'name': 'Spider-Man 2', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/library_600x900.jpg',
        'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.0,
        'description': 'The incredible power of the symbiote forces Peter and Miles to face the ultimate test.',
        'release_year': 2023, 'ps5_numbers': [1]
    },
    {
        'id': 2, 'name': 'FC 26', 
        'cover_image': 'https://image.api.playstation.com/vulcan/ap/rnd/202507/1617/27132291f4187708f316b43f65ab887a74fdf325f4ece306.png',
        'genre': 'Sports', 'max_players': 4, 'rating': 8.5,
        'description': 'The latest EA Sports football experience with next-gen gameplay.',
        'release_year': 2025, 'ps5_numbers': [1, 2, 3]
    },
    {
        'id': 3, 'name': 'WWE 2K24', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2315690/library_600x900.jpg',
        'genre': 'Fighting', 'max_players': 4, 'rating': 8.0,
        'description': 'Step into the ring with WWE superstars in the most electrifying wrestling game.',
        'release_year': 2024, 'ps5_numbers': [1, 2]
    },
    {
        'id': 4, 'name': 'Split Fiction', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2001120/library_600x900.jpg',
        'genre': 'Co-op Adventure', 'max_players': 2, 'rating': 9.0,
        'description': 'A co-op adventure where two writers get trapped inside their own stories.',
        'release_year': 2025, 'ps5_numbers': [1, 2, 3]
    },
    {
        'id': 5, 'name': 'It Takes Two', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/library_600x900.jpg',
        'genre': 'Co-op Adventure', 'max_players': 2, 'rating': 9.2,
        'description': 'An award-winning co-op platformer about a couple turned into dolls.',
        'release_year': 2021, 'ps5_numbers': [1, 2, 3]
    },
    {
        'id': 6, 'name': 'Marvel Rivals', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/library_600x900.jpg',
        'genre': 'Shooter', 'max_players': 2, 'rating': 8.3,
        'description': 'Team-based PvP shooter featuring iconic Marvel heroes and villains.',
        'release_year': 2024, 'ps5_numbers': [1]
    },
    {
        'id': 7, 'name': 'Mortal Kombat 1', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg',
        'genre': 'Fighting', 'max_players': 2, 'rating': 8.3,
        'description': 'A new beginning for the iconic fighting franchise. Liu Kang has reshaped the universe.',
        'release_year': 2023, 'ps5_numbers': [1, 2, 3]
    },
    {
        'id': 8, 'name': 'GTA 5', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',
        'genre': 'Action-Adventure', 'max_players': 2, 'rating': 9.7,
        'description': 'The blockbuster open-world adventure in Los Santos, now on PS5.',
        'release_year': 2022, 'ps5_numbers': [1, 2, 3]
    },
    {
        'id': 9, 'name': 'WWE 2K25', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2895490/library_600x900.jpg',
        'genre': 'Fighting', 'max_players': 4, 'rating': 8.2,
        'description': 'The newest WWE wrestling game with updated rosters and gameplay.',
        'release_year': 2025, 'ps5_numbers': [3]
    },
    {
        'id': 10, 'name': 'Gran Turismo 7', 
        'cover_image': 'https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/y7iyxoBE8VKotN89QCFhLgLM.png',
        'genre': 'Racing', 'max_players': 2, 'rating': 8.5,
        'description': 'The real driving simulator. The definitive Gran Turismo experience.',
        'release_year': 2022, 'ps5_numbers': [3, 4]
    },
    {
        'id': 11, 'name': 'Forza Horizon 5', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1551360/library_600x900.jpg',
        'genre': 'Racing', 'max_players': 1, 'rating': 9.1,
        'description': 'Explore the vibrant world of Mexico in the ultimate open-world racing game.',
        'release_year': 2021, 'ps5_numbers': [4],
        'device_type': 'driving_sim'
    },
    {
        'id': 12, 'name': 'The Crew Motorfest', 
        'cover_image': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2698940/library_600x900.jpg',
        'genre': 'Racing', 'max_players': 1, 'rating': 7.8,
        'description': 'A festival of speed set in the paradise of Hawaii.',
        'release_year': 2023, 'ps5_numbers': [4],
        'device_type': 'driving_sim'
    },
]

FALLBACK_RECOMMENDATIONS = [
    {'id': 1, 'game_name': 'GTA VI', 'description': 'The most anticipated game! Would love to see it here.', 'votes': 45, 'status': 'pending'},
    {'id': 2, 'game_name': 'Elden Ring DLC', 'description': 'Shadow of the Erdtree expansion pack.', 'votes': 32, 'status': 'pending'},
    {'id': 3, 'game_name': 'Baldurs Gate 3', 'description': 'Award-winning RPG that everyone is talking about.', 'votes': 28, 'status': 'pending'},
    {'id': 4, 'game_name': 'Final Fantasy XVI', 'description': 'Latest entry in the legendary series.', 'votes': 22, 'status': 'pending'},
]


@games_bp.route('/api/games', methods=['GET', 'OPTIONS'])
def get_games():
    """
    Get all games or filter by PS5 number.
    Always returns the hardcoded FALLBACK_GAMES which represent
    the ACTUAL games physically installed on each device at GameSpot.
    Query params: ps5 (optional) - Filter by PS5/device number (1, 2, 3, or 4)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    ps5_filter = request.args.get('ps5', None)
    games = FALLBACK_GAMES
    
    if ps5_filter:
        ps5_num = int(ps5_filter)
        games = [g for g in FALLBACK_GAMES if ps5_num in g['ps5_numbers']]
    
    return jsonify({
        'success': True,
        'games': games,
        'count': len(games),
        'filter': ps5_filter if ps5_filter else 'all'
    }), 200


@games_bp.route('/api/games/recommendations', methods=['GET', 'OPTIONS'])
def get_recommendations():
    """Get all game recommendations sorted by votes"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT 
                gr.id, gr.game_name, gr.description, gr.votes, 
                gr.status, gr.created_at,
                u.name as requester_name,
                CASE 
                    WHEN gv.user_id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as user_voted
            FROM game_recommendations gr
            LEFT JOIN users u ON gr.user_id = u.id
            LEFT JOIN game_votes gv ON gr.id = gv.recommendation_id 
                AND gv.user_id = %s
            WHERE gr.status = 'pending'
            ORDER BY gr.votes DESC, gr.created_at DESC
        """
        
        user_id = session.get('user_id', None)
        cursor.execute(query, (user_id,))
        recommendations = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations)
        }), 200
        
    except mysql.connector.Error as e:
        # Check if it's a "table doesn't exist" error
        if e.errno == 1146:  # Table doesn't exist
            print(f"Recommendations table not found, using fallback data")
            return jsonify({
                'success': True,
                'recommendations': FALLBACK_RECOMMENDATIONS,
                'count': len(FALLBACK_RECOMMENDATIONS),
                'fallback': True
            }), 200
        else:
            sys.stderr.write(f"[Games] Recommendations DB error: {e}\n")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch recommendations'
            }), 500
            
    except Exception as e:
        sys.stderr.write(f"[Games] Recommendations error: {e}\n")
        # Return fallback data on any error
        return jsonify({
            'success': True,
            'recommendations': FALLBACK_RECOMMENDATIONS,
            'count': len(FALLBACK_RECOMMENDATIONS),
            'fallback': True
        }), 200


@games_bp.route('/api/games/recommend', methods=['POST', 'OPTIONS'])
@require_auth
def recommend_game():
    """
    Submit a new game recommendation
    Body: { game_name: str, description: str (optional) }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        game_name = data.get('game_name', '').strip()
        description = data.get('description', '').strip()
        user_id = session.get('user_id')
        
        if not game_name:
            return jsonify({
                'success': False,
                'message': 'Game name is required'
            }), 400
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if this game is already recommended
        cursor.execute(
            "SELECT id, votes FROM game_recommendations WHERE LOWER(game_name) = LOWER(%s) AND status = 'pending'",
            (game_name,)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Already exists, just increment votes
            cursor.execute(
                "UPDATE game_recommendations SET votes = votes + 1 WHERE id = %s",
                (existing['id'],)
            )
            
            # Add user's vote
            try:
                cursor.execute(
                    "INSERT INTO game_votes (user_id, recommendation_id) VALUES (%s, %s)",
                    (user_id, existing['id'])
                )
            except:
                pass  # User already voted
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return jsonify({
                'success': True,
                'message': 'Vote added to existing recommendation!',
                'votes': existing['votes'] + 1
            }), 200
        else:
            # Create new recommendation
            cursor.execute(
                "INSERT INTO game_recommendations (user_id, game_name, description, votes) VALUES (%s, %s, %s, 1)",
                (user_id, game_name, description)
            )
            recommendation_id = cursor.lastrowid
            
            # Add user's vote
            cursor.execute(
                "INSERT INTO game_votes (user_id, recommendation_id) VALUES (%s, %s)",
                (user_id, recommendation_id)
            )
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return jsonify({
                'success': True,
                'message': 'Game recommendation submitted successfully!',
                'recommendation_id': recommendation_id
            }), 201
        
    except Exception as e:
        sys.stderr.write(f"[Games] Recommendation submit error: {e}\n")
        return jsonify({
            'success': False,
            'message': 'Failed to submit recommendation'
        }), 500


@games_bp.route('/api/games/vote', methods=['POST', 'OPTIONS'])
@require_auth
def vote_for_game():
    """
    Vote for an existing game recommendation
    Body: { recommendation_id: int }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        recommendation_id = data.get('recommendation_id')
        user_id = session.get('user_id')
        
        if not recommendation_id:
            return jsonify({
                'success': False,
                'message': 'Recommendation ID is required'
            }), 400
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user already voted
        cursor.execute(
            "SELECT id FROM game_votes WHERE user_id = %s AND recommendation_id = %s",
            (user_id, recommendation_id)
        )
        existing_vote = cursor.fetchone()
        
        if existing_vote:
            # Remove vote (unlike)
            cursor.execute(
                "DELETE FROM game_votes WHERE user_id = %s AND recommendation_id = %s",
                (user_id, recommendation_id)
            )
            cursor.execute(
                "UPDATE game_recommendations SET votes = votes - 1 WHERE id = %s",
                (recommendation_id,)
            )
            action = 'removed'
        else:
            # Add vote (like)
            cursor.execute(
                "INSERT INTO game_votes (user_id, recommendation_id) VALUES (%s, %s)",
                (user_id, recommendation_id)
            )
            cursor.execute(
                "UPDATE game_recommendations SET votes = votes + 1 WHERE id = %s",
                (recommendation_id,)
            )
            action = 'added'
        
        connection.commit()
        
        # Get updated vote count
        cursor.execute("SELECT votes FROM game_recommendations WHERE id = %s", (recommendation_id,))
        result = cursor.fetchone()
        votes = result['votes'] if result else 0
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': f'Vote {action} successfully!',
            'votes': votes,
            'action': action
        }), 200
        
    except Exception as e:
        sys.stderr.write(f"[Games] Vote error: {e}\n")
        return jsonify({
            'success': False,
            'message': 'Failed to vote'
        }), 500


@games_bp.route('/api/games/stats', methods=['GET', 'OPTIONS'])
def get_games_stats():
    """Get statistics about games and recommendations"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Total games
        cursor.execute("SELECT COUNT(*) as total FROM games")
        total_games = cursor.fetchone()['total']
        
        # Games per PS5
        cursor.execute("SELECT ps5_number, COUNT(*) as count FROM ps5_games GROUP BY ps5_number")
        ps5_counts = {row['ps5_number']: row['count'] for row in cursor.fetchall()}
        
        # Total recommendations
        cursor.execute("SELECT COUNT(*) as total FROM game_recommendations WHERE status = 'pending'")
        total_recommendations = cursor.fetchone()['total']
        
        # Total votes
        cursor.execute("SELECT COUNT(*) as total FROM game_votes")
        total_votes = cursor.fetchone()['total']
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_games': total_games,
                'ps5_1_games': ps5_counts.get(1, 0),
                'ps5_2_games': ps5_counts.get(2, 0),
                'ps5_3_games': ps5_counts.get(3, 0),
                'total_recommendations': total_recommendations,
                'total_votes': total_votes
            }
        }), 200
        
    except Exception as e:
        sys.stderr.write(f"[Games] Stats error: {e}\n")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch stats'
        }), 500
