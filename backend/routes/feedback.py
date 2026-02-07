from flask import Blueprint, request, jsonify, session
from datetime import datetime
import mysql.connector
from config.database import get_db_connection

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/api/feedback/submit', methods=['POST'])
def submit_feedback():
    """Submit user feedback/suggestion"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('type') or not data.get('message'):
            return jsonify({
                'success': False,
                'error': 'Feedback type and message are required'
            }), 400
        
        feedback_type = data.get('type')  # suggestion, bug, query, feature, other
        message = data.get('message')
        name = data.get('name', 'Anonymous')
        email = data.get('email', '')
        priority = data.get('priority', 'medium')  # low, medium, high
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO user_feedback 
            (type, message, name, email, priority, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', NOW())
        """
        
        cursor.execute(query, (feedback_type, message, name, email, priority))
        conn.commit()
        
        feedback_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback! We will review it shortly.',
            'feedback_id': feedback_id
        })
        
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit feedback'
        }), 500
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feedback_bp.route('/api/feedback/all', methods=['GET'])
def get_all_feedback():
    """Get all feedback (admin only)"""
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status', 'all')  # all, pending, reviewed, resolved
        type_filter = request.args.get('type', 'all')  # all, suggestion, bug, query, feature, other
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM user_feedback WHERE 1=1"
        params = []
        
        if status_filter != 'all':
            query += " AND status = %s"
            params.append(status_filter)
        
        if type_filter != 'all':
            query += " AND type = %s"
            params.append(type_filter)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        feedback_list = cursor.fetchall()
        
        # Convert datetime objects to strings
        for feedback in feedback_list:
            if feedback.get('created_at'):
                feedback['created_at'] = feedback['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if feedback.get('updated_at'):
                feedback['updated_at'] = feedback['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'feedback': feedback_list,
            'count': len(feedback_list)
        })
        
    except Exception as e:
        print(f"Error fetching feedback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feedback_bp.route('/api/feedback/<int:feedback_id>/status', methods=['PUT'])
def update_feedback_status(feedback_id):
    """Update feedback status (admin only)"""
    try:
        data = request.json
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', '')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            UPDATE user_feedback 
            SET status = %s, admin_notes = %s, updated_at = NOW()
            WHERE id = %s
        """
        
        cursor.execute(query, (new_status, admin_notes, feedback_id))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Feedback status updated successfully'
        })
        
    except Exception as e:
        print(f"Error updating feedback status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feedback_bp.route('/api/feedback/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    """Delete feedback (admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM user_feedback WHERE id = %s", (feedback_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Feedback deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting feedback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feedback_bp.route('/api/feedback/stats', methods=['GET'])
def get_feedback_stats():
    """Get feedback statistics (admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get counts by status
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
            FROM user_feedback
        """)
        status_stats = cursor.fetchone()
        
        # Get counts by type
        cursor.execute("""
            SELECT type, COUNT(*) as count
            FROM user_feedback
            GROUP BY type
            ORDER BY count DESC
        """)
        type_stats = cursor.fetchall()
        
        # Get recent feedback count (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as recent_count
            FROM user_feedback
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        recent = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total': status_stats['total'] or 0,
                'pending': status_stats['pending'] or 0,
                'reviewed': status_stats['reviewed'] or 0,
                'resolved': status_stats['resolved'] or 0,
                'recent_week': recent['recent_count'] or 0,
                'by_type': type_stats
            }
        })
        
    except Exception as e:
        print(f"Error fetching feedback stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
