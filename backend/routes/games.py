"""
Games API Routes
Handles game catalog, PS5 filtering, and game recommendations with voting
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from functools import wraps
import mysql.connector

games_bp = Blueprint('games', __name__)

# Fallback games data when database tables don't exist
FALLBACK_GAMES = [
    {'id': 1, 'name': 'God of War Ragnarök', 'cover_image': '/images/games/god-of-war.jpg', 'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.5, 'description': 'Embark on an epic journey as Kratos and Atreus.', 'release_year': 2022, 'ps5_numbers': [1, 3]},
    {'id': 2, 'name': 'Spider-Man 2', 'cover_image': '/images/games/spiderman-2.jpg', 'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.0, 'description': 'The incredible power of the symbiote forces Peter and Miles to face the ultimate test.', 'release_year': 2023, 'ps5_numbers': [1, 2]},
    {'id': 3, 'name': 'Horizon Forbidden West', 'cover_image': '/images/games/horizon.jpg', 'genre': 'Action RPG', 'max_players': 1, 'rating': 8.8, 'description': 'Join Aloy as she braves the Forbidden West.', 'release_year': 2022, 'ps5_numbers': [3]},
    {'id': 4, 'name': 'The Last of Us Part II', 'cover_image': '/images/games/tlou2.jpg', 'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.2, 'description': 'Experience the emotional story of Ellie.', 'release_year': 2020, 'ps5_numbers': [1, 3]},
    {'id': 5, 'name': 'Gran Turismo 7', 'cover_image': '/images/games/gt7.jpg', 'genre': 'Racing', 'max_players': 2, 'rating': 8.5, 'description': 'The ultimate driving simulator.', 'release_year': 2022, 'ps5_numbers': [2]},
    {'id': 6, 'name': 'Call of Duty: Modern Warfare III', 'cover_image': '/images/games/cod-mw3.jpg', 'genre': 'First-Person Shooter', 'max_players': 4, 'rating': 8.0, 'description': 'The latest Call of Duty experience.', 'release_year': 2023, 'ps5_numbers': [2]},
    {'id': 7, 'name': 'FIFA 24', 'cover_image': '/images/games/fifa24.jpg', 'genre': 'Sports', 'max_players': 4, 'rating': 8.2, 'description': 'The world\'s game with HyperMotionV technology.', 'release_year': 2023, 'ps5_numbers': [2]},
    {'id': 8, 'name': 'NBA 2K24', 'cover_image': '/images/games/nba2k24.jpg', 'genre': 'Sports', 'max_players': 4, 'rating': 8.0, 'description': 'Experience basketball like never before.', 'release_year': 2023, 'ps5_numbers': [2]},
    {'id': 9, 'name': 'Mortal Kombat 1', 'cover_image': '/images/games/mk1.jpg', 'genre': 'Fighting', 'max_players': 2, 'rating': 8.3, 'description': 'A new beginning for the iconic fighting franchise.', 'release_year': 2023, 'ps5_numbers': [2]},
    {'id': 10, 'name': 'Resident Evil 4 Remake', 'cover_image': '/images/games/re4.jpg', 'genre': 'Survival Horror', 'max_players': 1, 'rating': 9.3, 'description': 'The horror classic reimagined.', 'release_year': 2023, 'ps5_numbers': [1]},
    {'id': 11, 'name': 'Elden Ring', 'cover_image': '/images/games/elden-ring.jpg', 'genre': 'Action RPG', 'max_players': 1, 'rating': 9.6, 'description': 'Rise, Tarnished, and be guided by grace.', 'release_year': 2022, 'ps5_numbers': [1, 3]},
    {'id': 12, 'name': 'Hogwarts Legacy', 'cover_image': '/images/games/hogwarts.jpg', 'genre': 'Action RPG', 'max_players': 1, 'rating': 8.4, 'description': 'Experience life at Hogwarts School.', 'release_year': 2023, 'ps5_numbers': [3]},
    {'id': 13, 'name': 'Tekken 8', 'cover_image': '/images/games/tekken8.jpg', 'genre': 'Fighting', 'max_players': 2, 'rating': 8.6, 'description': 'The legendary fighting game returns.', 'release_year': 2024, 'ps5_numbers': [2]},
    {'id': 14, 'name': 'Red Dead Redemption 2', 'cover_image': '/images/games/rdr2.jpg', 'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.8, 'description': 'America, 1899. The end of the Wild West era.', 'release_year': 2018, 'ps5_numbers': [1, 3]},
    {'id': 15, 'name': 'Ghost of Tsushima', 'cover_image': '/images/games/ghost-tsushima.jpg', 'genre': 'Action-Adventure', 'max_players': 1, 'rating': 9.1, 'description': 'A beautiful samurai epic set in feudal Japan.', 'release_year': 2020, 'ps5_numbers': [1, 3]},
]

FALLBACK_RECOMMENDATIONS = [
    {'id': 1, 'game_name': 'GTA VI', 'description': 'The most anticipated game! Would love to see it here.', 'votes': 45, 'status': 'pending'},
    {'id': 2, 'game_name': 'Elden Ring DLC', 'description': 'Shadow of the Erdtree expansion pack.', 'votes': 32, 'status': 'pending'},
    {'id': 3, 'game_name': 'Baldurs Gate 3', 'description': 'Award-winning RPG that everyone is talking about.', 'votes': 28, 'status': 'pending'},
    {'id': 4, 'game_name': 'Final Fantasy XVI', 'description': 'Latest entry in the legendary series.', 'votes': 22, 'status': 'pending'},
]

def require_auth(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


@games_bp.route('/api/games', methods=['GET', 'OPTIONS'])
def get_games():
    """
    Get all games or filter by PS5 number
    Query params: ps5 (optional) - Filter by PS5 number (1, 2, or 3)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        ps5_filter = request.args.get('ps5', None)
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if ps5_filter:
            # Get games for specific PS5
            query = """
                SELECT DISTINCT 
                    g.id, g.name, g.cover_image, g.genre, 
                    g.max_players, g.rating, g.description, g.release_year,
                    GROUP_CONCAT(DISTINCT pg.ps5_number ORDER BY pg.ps5_number) as ps5_numbers
                FROM games g
                INNER JOIN ps5_games pg ON g.id = pg.game_id
                WHERE pg.ps5_number = %s
                GROUP BY g.id
                ORDER BY g.rating DESC, g.name ASC
            """
            cursor.execute(query, (ps5_filter,))
        else:
            # Get all games with PS5 associations
            query = """
                SELECT 
                    g.id, g.name, g.cover_image, g.genre, 
                    g.max_players, g.rating, g.description, g.release_year,
                    GROUP_CONCAT(DISTINCT pg.ps5_number ORDER BY pg.ps5_number) as ps5_numbers
                FROM games g
                LEFT JOIN ps5_games pg ON g.id = pg.game_id
                GROUP BY g.id
                ORDER BY g.rating DESC, g.name ASC
            """
            cursor.execute(query)
        
        games = cursor.fetchall()
        
        # Convert ps5_numbers to list
        for game in games:
            if game['ps5_numbers']:
                game['ps5_numbers'] = [int(num) for num in game['ps5_numbers'].split(',')]
            else:
                game['ps5_numbers'] = []
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'games': games,
            'count': len(games),
            'filter': ps5_filter if ps5_filter else 'all'
        }), 200
        
    except mysql.connector.Error as e:
        # Check if it's a "table doesn't exist" error
        if e.errno == 1146:  # Table doesn't exist
            print(f"Games tables not found, using fallback data")
            # Filter fallback games by PS5 if needed
            ps5_filter = request.args.get('ps5', None)
            games = FALLBACK_GAMES
            if ps5_filter:
                ps5_num = int(ps5_filter)
                games = [g for g in FALLBACK_GAMES if ps5_num in g['ps5_numbers']]
            
            return jsonify({
                'success': True,
                'games': games,
                'count': len(games),
                'filter': ps5_filter if ps5_filter else 'all',
                'fallback': True
            }), 200
        else:
            print(f"Error fetching games: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Failed to fetch games: {str(e)}'
            }), 500
            
    except Exception as e:
        print(f"Error fetching games: {str(e)}")
        # Return fallback data on any error
        ps5_filter = request.args.get('ps5', None)
        games = FALLBACK_GAMES
        if ps5_filter:
            ps5_num = int(ps5_filter)
            games = [g for g in FALLBACK_GAMES if ps5_num in g['ps5_numbers']]
        
        return jsonify({
            'success': True,
            'games': games,
            'count': len(games),
            'filter': ps5_filter if ps5_filter else 'all',
            'fallback': True
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
            print(f"Error fetching recommendations: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Failed to fetch recommendations: {str(e)}'
            }), 500
            
    except Exception as e:
        print(f"Error fetching recommendations: {str(e)}")
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
        print(f"Error creating recommendation: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to submit recommendation: {str(e)}'
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
        print(f"Error voting: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to vote: {str(e)}'
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
        print(f"Error fetching stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch stats: {str(e)}'
        }), 500
