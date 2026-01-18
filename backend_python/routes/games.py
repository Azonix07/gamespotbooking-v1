"""
Games API Routes
Handles game catalog, PS5 filtering, and game recommendations with voting
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from functools import wraps

games_bp = Blueprint('games', __name__)

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
        
    except Exception as e:
        print(f"Error fetching games: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch games: {str(e)}'
        }), 500


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
        
    except Exception as e:
        print(f"Error fetching recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch recommendations: {str(e)}'
        }), 500


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
