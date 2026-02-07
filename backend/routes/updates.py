from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from middleware.auth import require_admin
from datetime import datetime

updates_bp = Blueprint('updates', __name__)

@updates_bp.route('/api/updates/latest', methods=['GET'])
def get_latest_updates():
    """Get latest active updates"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get limit from query params (default 6)
        limit = request.args.get('limit', 6, type=int)
        category = request.args.get('category')
        
        query = """
            SELECT id, title, description, category, image_url, priority, created_at
            FROM shop_updates
            WHERE is_active = TRUE
        """
        
        params = []
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY priority DESC, created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        updates = cursor.fetchall()
        
        # Format dates
        for update in updates:
            if update['created_at']:
                update['created_at'] = update['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'updates': updates,
            'count': len(updates)
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] fetching updates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch updates',
            'error': 'An error occurred'
        }), 500

@updates_bp.route('/api/updates/categories', methods=['GET'])
def get_update_categories():
    """Get update categories with counts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM shop_updates
            WHERE is_active = TRUE
            GROUP BY category
            ORDER BY count DESC
        """)
        
        categories = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'categories': categories
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] fetching categories: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch categories',
            'error': 'An error occurred'
        }), 500

@updates_bp.route('/api/updates/<int:update_id>', methods=['GET'])
def get_update_by_id(update_id):
    """Get single update by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, title, description, category, image_url, priority, created_at
            FROM shop_updates
            WHERE id = %s AND is_active = TRUE
        """, (update_id,))
        
        update = cursor.fetchone()
        
        if update and update['created_at']:
            update['created_at'] = update['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        if update:
            return jsonify({
                'success': True,
                'update': update
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Update not found'
            }), 404
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] fetching update: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch update',
            'error': 'An error occurred'
        }), 500

# Admin routes — require admin authentication
@updates_bp.route('/api/admin/updates', methods=['POST'])
def create_update():
    """Create new update (admin only)"""
    auth_error = require_admin()
    if auth_error:
        return auth_error
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO shop_updates (title, description, category, image_url, priority, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data['title'],
            data['description'],
            data['category'],
            data.get('image_url'),
            data.get('priority', 'medium'),
            data.get('is_active', True)
        ))
        
        conn.commit()
        update_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Update created successfully',
            'update_id': update_id
        }), 201
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] creating update: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create update',
            'error': 'An error occurred'
        }), 500

@updates_bp.route('/api/admin/updates/<int:update_id>', methods=['PUT'])
def update_update(update_id):
    """Update existing update (admin only)"""
    auth_error = require_admin()
    if auth_error:
        return auth_error
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE shop_updates
            SET title = %s, description = %s, category = %s, 
                image_url = %s, priority = %s, is_active = %s
            WHERE id = %s
        """, (
            data['title'],
            data['description'],
            data['category'],
            data.get('image_url'),
            data.get('priority', 'medium'),
            data.get('is_active', True),
            update_id
        ))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Update updated successfully'
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] updating update: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update',
            'error': 'An error occurred'
        }), 500

@updates_bp.route('/api/admin/updates/<int:update_id>', methods=['DELETE'])
def delete_update(update_id):
    """Delete/deactivate update (admin only)"""
    auth_error = require_admin()
    if auth_error:
        return auth_error
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Soft delete - set is_active to FALSE
        cursor.execute("""
            UPDATE shop_updates
            SET is_active = FALSE
            WHERE id = %s
        """, (update_id,))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Update deleted successfully'
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f"[Error] deleting update: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete update',
            'error': 'An error occurred'
        }), 500
