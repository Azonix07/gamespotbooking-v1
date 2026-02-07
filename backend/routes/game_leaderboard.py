"""
Game Leaderboard API Routes
Handles shooter game scores, leaderboard, and winner management
"""

import sys
from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin
from middleware.rate_limiter import rate_limit
from datetime import datetime, timedelta
import re

game_leaderboard_bp = Blueprint('game_leaderboard', __name__)

def validate_score(score, max_score=5000):
    """Validate if score is reasonable to prevent cheating"""
    return 0 <= score <= max_score

def validate_player_name(name):
    """Validate player name format"""
    if not name or len(name) < 2 or len(name) > 50:
        return False
    # Allow letters, numbers, spaces, and some special characters
    pattern = r'^[a-zA-Z0-9 _-]+$'
    return re.match(pattern, name)

@game_leaderboard_bp.route('/api/game/leaderboard', methods=['GET', 'OPTIONS'])
def get_leaderboard():
    """Get game leaderboard (public endpoint)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        period = request.args.get('period', 'all')  # 'all', 'daily', 'weekly', 'monthly'
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Build query based on period
        query = '''
            SELECT 
                player_name,
                MAX(score) as score,
                SUM(enemies_shot) as total_enemies,
                SUM(boss_enemies_shot) as total_bosses,
                MAX(accuracy_percentage) as best_accuracy,
                MAX(played_at) as last_played,
                COUNT(*) as games_played,
                MAX(is_winner) as is_winner
            FROM game_leaderboard
            WHERE is_verified = TRUE AND is_flagged = FALSE
        '''
        
        params = []
        
        # Add period filter
        if period == 'daily':
            query += ' AND DATE(played_at) = CURDATE()'
        elif period == 'weekly':
            query += ' AND played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        elif period == 'monthly':
            query += ' AND played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        
        query += '''
            GROUP BY player_name
            ORDER BY score DESC
            LIMIT %s
        '''
        params.append(limit)
        
        cursor.execute(query, params)
        leaderboard = cursor.fetchall()
        
        # Add rank
        for idx, entry in enumerate(leaderboard):
            entry['rank'] = idx + 1
        
        # Get total players
        count_query = 'SELECT COUNT(DISTINCT player_name) as total FROM game_leaderboard WHERE is_verified = TRUE AND is_flagged = FALSE'
        cursor.execute(count_query)
        total_players = cursor.fetchone()['total']
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard,
            'total_players': total_players,
            'period': period
        })
        
    except Exception as e:
        sys.stderr.write(f"[Leaderboard] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Failed to fetch leaderboard'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@game_leaderboard_bp.route('/api/game/score', methods=['POST', 'OPTIONS'])
@rate_limit(max_requests=10, window_seconds=60)
def submit_score():
    """Submit game score (public, rate-limited)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['player_name', 'score']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate player name
        if not validate_player_name(data['player_name']):
            return jsonify({
                'success': False,
                'error': 'Invalid player name. Use 2-50 characters, letters and numbers only'
            }), 400
        
        # Validate score
        if not validate_score(data['score']):
            return jsonify({
                'success': False,
                'error': 'Invalid score. Score must be between 0 and 5000'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Generate session ID if not provided
        session_id = data.get('session_id', f"{data['player_name']}-{datetime.now().timestamp():.0f}")
        
        # Get IP address
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in ip_address:
            ip_address = ip_address.split(',')[0].strip()
        
        # Insert score
        query = '''
            INSERT INTO game_leaderboard (
                player_name, player_email, player_phone,
                score, enemies_shot, boss_enemies_shot, accuracy_percentage,
                game_duration_seconds, session_id, device_type, browser,
                ip_address, is_verified
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        '''
        
        params = (
            data['player_name'],
            data.get('player_email', ''),
            data.get('player_phone', ''),
            data['score'],
            data.get('enemies_shot', 0),
            data.get('boss_enemies_shot', 0),
            data.get('accuracy_percentage', 0.00),
            data.get('game_duration_seconds', 60),
            session_id,
            data.get('device_type', 'unknown'),
            data.get('browser', 'unknown'),
            ip_address,
            True  # Auto-verify for now; can add anti-cheat later
        )
        
        cursor.execute(query, params)
        conn.commit()
        
        score_id = cursor.lastrowid
        
        # Get player's rank
        rank_query = '''
            SELECT COUNT(*) + 1 as rank
            FROM (
                SELECT player_name, MAX(score) as max_score
                FROM game_leaderboard
                WHERE is_verified = TRUE AND is_flagged = FALSE
                GROUP BY player_name
            ) as ranked
            WHERE max_score > %s
        '''
        cursor.execute(rank_query, (data['score'],))
        rank_result = cursor.fetchone()
        player_rank = rank_result['rank'] if rank_result else None
        
        # Check if player is now #1 (winner)
        is_winner = (player_rank == 1)
        
        # Update is_winner flag
        if is_winner:
            update_query = 'UPDATE game_leaderboard SET is_winner = TRUE WHERE id = %s'
            cursor.execute(update_query, (score_id,))
            conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Score submitted successfully',
            'score_id': score_id,
            'rank': player_rank,
            'is_winner': is_winner,
            'prize_eligible': is_winner
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@game_leaderboard_bp.route('/api/game/player/<player_name>', methods=['GET', 'OPTIONS'])
def get_player_stats(player_name):
    """Get specific player's game statistics"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get player stats
        query = '''
            SELECT 
                player_name,
                COUNT(*) as games_played,
                MAX(score) as best_score,
                AVG(score) as avg_score,
                SUM(enemies_shot) as total_enemies,
                SUM(boss_enemies_shot) as total_bosses,
                MAX(accuracy_percentage) as best_accuracy,
                AVG(accuracy_percentage) as avg_accuracy,
                MIN(played_at) as first_played,
                MAX(played_at) as last_played,
                MAX(is_winner) as is_winner
            FROM game_leaderboard
            WHERE player_name = %s AND is_verified = TRUE AND is_flagged = FALSE
            GROUP BY player_name
        '''
        
        cursor.execute(query, (player_name,))
        stats = cursor.fetchone()
        
        if not stats:
            return jsonify({
                'success': False,
                'error': 'Player not found'
            }), 404
        
        # Get player's rank
        rank_query = '''
            SELECT COUNT(*) + 1 as rank
            FROM (
                SELECT player_name, MAX(score) as max_score
                FROM game_leaderboard
                WHERE is_verified = TRUE AND is_flagged = FALSE
                GROUP BY player_name
            ) as ranked
            WHERE max_score > %s
        '''
        cursor.execute(rank_query, (stats['best_score'],))
        rank_result = cursor.fetchone()
        stats['rank'] = rank_result['rank'] if rank_result else None
        
        # Get recent games
        recent_query = '''
            SELECT score, enemies_shot, boss_enemies_shot, accuracy_percentage, played_at
            FROM game_leaderboard
            WHERE player_name = %s AND is_verified = TRUE
            ORDER BY played_at DESC
            LIMIT 10
        '''
        cursor.execute(recent_query, (player_name,))
        recent_games = cursor.fetchall()
        stats['recent_games'] = recent_games
        
        return jsonify({
            'success': True,
            'player_stats': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@game_leaderboard_bp.route('/api/game/admin/scores', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def admin_manage_scores():
    """Admin: Manage game scores (flag, verify, delete)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin auth (supports both session and JWT)
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        # GET: Retrieve all scores with filters
        if request.method == 'GET':
            flagged = request.args.get('flagged', 'false').lower() == 'true'
            limit = request.args.get('limit', 100, type=int)
            offset = request.args.get('offset', 0, type=int)
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'SELECT * FROM game_leaderboard WHERE 1=1'
            params = []
            
            if flagged:
                query += ' AND is_flagged = TRUE'
            
            query += ' ORDER BY played_at DESC LIMIT %s OFFSET %s'
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            scores = cursor.fetchall()
            
            return jsonify({
                'success': True,
                'scores': scores,
                'limit': limit,
                'offset': offset
            })
        
        # PUT: Update score (flag/unflag, verify)
        elif request.method == 'PUT':
            data = request.get_json()
            score_id = data.get('score_id')
            
            if not score_id:
                return jsonify({
                    'success': False,
                    'error': 'Missing score_id'
                }), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            update_fields = []
            params = []
            
            if 'is_flagged' in data:
                update_fields.append('is_flagged = %s')
                params.append(data['is_flagged'])
            
            if 'flag_reason' in data:
                update_fields.append('flag_reason = %s')
                params.append(data['flag_reason'])
            
            if 'is_verified' in data:
                update_fields.append('is_verified = %s')
                params.append(data['is_verified'])
            
            if not update_fields:
                return jsonify({
                    'success': False,
                    'error': 'No fields to update'
                }), 400
            
            params.append(score_id)
            
            query = f'UPDATE game_leaderboard SET {", ".join(update_fields)} WHERE id = %s'
            cursor.execute(query, params)
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Score updated successfully'
            })
        
        # DELETE: Remove score
        elif request.method == 'DELETE':
            score_id = request.args.get('score_id', type=int)
            
            if not score_id:
                return jsonify({
                    'success': False,
                    'error': 'Missing score_id'
                }), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'DELETE FROM game_leaderboard WHERE id = %s'
            cursor.execute(query, (score_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Score deleted successfully'
            })
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@game_leaderboard_bp.route('/api/game/winners', methods=['GET', 'POST', 'OPTIONS'])
def manage_winners():
    """Manage game winners (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        # GET: Retrieve winners
        if request.method == 'GET':
            period = request.args.get('period', 'monthly')
            redeemed = request.args.get('redeemed')
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'SELECT * FROM game_winners WHERE 1=1'
            params = []
            
            if period:
                query += ' AND winning_period = %s'
                params.append(period)
            
            if redeemed is not None:
                query += ' AND redeemed = %s'
                params.append(redeemed.lower() == 'true')
            
            query += ' ORDER BY announced_at DESC'
            
            cursor.execute(query, params)
            winners = cursor.fetchall()
            
            return jsonify({
                'success': True,
                'winners': winners
            })
        
        # POST: Announce new winner (admin only)
        elif request.method == 'POST':
            auth_error = require_admin()
            if auth_error:
                return auth_error
            data = request.get_json()
            
            required_fields = ['leaderboard_id', 'player_name', 'winning_score', 'period_start_date', 'period_end_date']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Insert winner
            query = '''
                INSERT INTO game_winners (
                    leaderboard_id, player_name, player_email, player_phone,
                    winning_score, winning_period, period_start_date, period_end_date,
                    prize_description, prize_value, verified_by_admin, verified_at, admin_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s
                )
            '''
            
            params = (
                data['leaderboard_id'],
                data['player_name'],
                data.get('player_email', ''),
                data.get('player_phone', ''),
                data['winning_score'],
                data.get('winning_period', 'monthly'),
                data['period_start_date'],
                data['period_end_date'],
                data.get('prize_description', '30 minutes FREE gaming'),
                data.get('prize_value', 175.00),
                True,
                session.get('admin_id')
            )
            
            cursor.execute(query, params)
            conn.commit()
            
            winner_id = cursor.lastrowid
            
            return jsonify({
                'success': True,
                'message': 'Winner announced successfully',
                'winner_id': winner_id
            }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@game_leaderboard_bp.route('/api/game/stats', methods=['GET', 'OPTIONS'])
def get_game_stats():
    """Get game statistics (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin auth (supports both session and JWT)
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Overall stats
        stats_query = '''
            SELECT 
                COUNT(*) as total_games,
                COUNT(DISTINCT player_name) as unique_players,
                MAX(score) as highest_score,
                AVG(score) as average_score,
                SUM(enemies_shot) as total_enemies_shot,
                SUM(boss_enemies_shot) as total_bosses_shot,
                AVG(accuracy_percentage) as avg_accuracy,
                COUNT(CASE WHEN is_winner = TRUE THEN 1 END) as winner_games,
                COUNT(CASE WHEN is_flagged = TRUE THEN 1 END) as flagged_scores
            FROM game_leaderboard
            WHERE is_verified = TRUE
        '''
        cursor.execute(stats_query)
        stats = cursor.fetchone()
        
        # Daily stats (last 30 days)
        daily_query = '''
            SELECT 
                DATE(played_at) as date,
                COUNT(*) as games,
                COUNT(DISTINCT player_name) as players,
                MAX(score) as top_score
            FROM game_leaderboard
            WHERE played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(played_at)
            ORDER BY date DESC
        '''
        cursor.execute(daily_query)
        daily_stats = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'daily_stats': daily_stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
