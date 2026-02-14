"""
Quest Pass (Story Mode Membership) Routes
₹500/month membership — play at ₹50/hour
Admin approval required, dedicated device with saved game progress
"""

from flask import Blueprint, request, jsonify, session
from datetime import date, timedelta, datetime
from config.database import get_db_connection
from middleware.auth import require_login

quest_pass_bp = Blueprint('quest_pass', __name__)

QUEST_PASS_PRICE = 500       # ₹500/month
QUEST_PLAY_RATE = 50         # ₹50/hour while active
QUEST_DURATION_DAYS = 30     # 30-day membership

# ─── Auto-migrate: create quest_pass tables if missing ───
def ensure_quest_tables(cursor):
    """Create quest_pass and quest_progress tables if they don't exist."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quest_pass (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            status ENUM('pending', 'active', 'expired', 'cancelled', 'rejected') DEFAULT 'pending',
            device_number INT DEFAULT NULL,
            game_name VARCHAR(255) DEFAULT NULL,
            start_date DATE DEFAULT NULL,
            end_date DATE DEFAULT NULL,
            price DECIMAL(10,2) DEFAULT 500.00,
            play_rate DECIMAL(10,2) DEFAULT 50.00,
            admin_notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quest_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quest_pass_id INT NOT NULL,
            user_id INT NOT NULL,
            game_name VARCHAR(255) NOT NULL,
            device_number INT NOT NULL,
            progress_notes TEXT DEFAULT NULL,
            hours_played DECIMAL(10,2) DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quest_pass_id) REFERENCES quest_pass(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)


# ─── GET /api/quest-pass/info ─── Public plan info
@quest_pass_bp.route('/api/quest-pass/info', methods=['GET', 'OPTIONS'])
def quest_pass_info():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({
        'success': True,
        'plan': {
            'name': 'Quest Pass',
            'tagline': 'Your Story, Your Console',
            'price': QUEST_PASS_PRICE,
            'play_rate': QUEST_PLAY_RATE,
            'duration_days': QUEST_DURATION_DAYS,
            'features': [
                'Dedicated PS5 unit reserved for you',
                'Game progress saved exclusively',
                'Play at just ₹50/hour',
                'Monthly subscription — ₹500/month',
                'Priority booking on your device',
                'Resume your story anytime'
            ]
        }
    })


# ─── GET /api/quest-pass/status ─── Current user's quest pass status
@quest_pass_bp.route('/api/quest-pass/status', methods=['GET', 'OPTIONS'])
@require_login
def quest_pass_status():
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        user_id = session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        # Active pass
        cursor.execute("""
            SELECT id, status, device_number, game_name, start_date, end_date,
                   price, play_rate, admin_notes,
                   DATEDIFF(end_date, CURDATE()) as days_remaining
            FROM quest_pass
            WHERE user_id = %s AND status = 'active' AND end_date >= CURDATE()
            ORDER BY end_date DESC LIMIT 1
        """, (user_id,))
        active = cursor.fetchone()

        # Pending pass
        cursor.execute("""
            SELECT id, status, game_name, created_at
            FROM quest_pass
            WHERE user_id = %s AND status = 'pending'
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        pending = cursor.fetchone()

        # Progress history
        progress = []
        if active:
            cursor.execute("""
                SELECT game_name, device_number, hours_played, progress_notes, last_played
                FROM quest_progress
                WHERE quest_pass_id = %s
                ORDER BY last_played DESC
            """, (active['id'],))
            progress = cursor.fetchall()

        result = {
            'success': True,
            'has_active': bool(active),
            'active_pass': None,
            'has_pending': bool(pending),
            'pending_pass': None,
            'progress': []
        }

        if active:
            active['start_date'] = active['start_date'].isoformat()
            active['end_date'] = active['end_date'].isoformat()
            active['price'] = float(active['price'])
            active['play_rate'] = float(active['play_rate'])
            result['active_pass'] = active

        if pending:
            if pending.get('created_at'):
                pending['created_at'] = pending['created_at'].isoformat()
            result['pending_pass'] = pending

        for p in progress:
            p['hours_played'] = float(p['hours_played'])
            if p.get('last_played'):
                p['last_played'] = p['last_played'].isoformat()
            result['progress'].append(p)

        return jsonify(result)

    except Exception as e:
        print(f"Quest pass status error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ─── POST /api/quest-pass/subscribe ─── Request a Quest Pass
@quest_pass_bp.route('/api/quest-pass/subscribe', methods=['POST', 'OPTIONS'])
@require_login
def subscribe_quest_pass():
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        user_id = session.get('user_id')
        data = request.get_json() or {}
        game_name = data.get('game_name', '').strip()

        if not game_name:
            return jsonify({'success': False, 'error': 'Please select a game for your Quest Pass'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        # Check existing active
        cursor.execute("""
            SELECT id FROM quest_pass
            WHERE user_id = %s AND status = 'active' AND end_date >= CURDATE()
        """, (user_id,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'You already have an active Quest Pass'}), 400

        # Check existing pending
        cursor.execute("""
            SELECT id FROM quest_pass WHERE user_id = %s AND status = 'pending'
        """, (user_id,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'You already have a pending Quest Pass request. Please wait for admin approval.'}), 400

        # Create pending request
        start_date = date.today()
        end_date = start_date + timedelta(days=QUEST_DURATION_DAYS)

        cursor.execute("""
            INSERT INTO quest_pass (user_id, status, game_name, start_date, end_date, price, play_rate)
            VALUES (%s, 'pending', %s, %s, %s, %s, %s)
        """, (user_id, game_name, start_date, end_date, QUEST_PASS_PRICE, QUEST_PLAY_RATE))
        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Quest Pass request submitted for "{game_name}"! Visit the shop to pay ₹{QUEST_PASS_PRICE} and get approved.',
            'quest_pass_id': cursor.lastrowid
        }), 201

    except Exception as e:
        print(f"Quest pass subscribe error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ─── POST /api/quest-pass/cancel ─── Cancel own Quest Pass
@quest_pass_bp.route('/api/quest-pass/cancel', methods=['POST', 'OPTIONS'])
@require_login
def cancel_quest_pass():
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        user_id = session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        cursor.execute("""
            SELECT id FROM quest_pass
            WHERE user_id = %s AND status IN ('active', 'pending')
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        qp = cursor.fetchone()

        if not qp:
            return jsonify({'success': False, 'error': 'No active or pending Quest Pass found'}), 404

        cursor.execute("UPDATE quest_pass SET status = 'cancelled' WHERE id = %s", (qp['id'],))
        conn.commit()

        return jsonify({'success': True, 'message': 'Quest Pass cancelled successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ─── ADMIN ENDPOINTS ───

# GET /api/admin/quest-pass — List all quest passes
@quest_pass_bp.route('/api/admin/quest-pass', methods=['GET', 'OPTIONS'])
def admin_list_quest_passes():
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        cursor.execute("""
            SELECT qp.*, u.name as user_name, u.phone as user_phone, u.email as user_email
            FROM quest_pass qp
            LEFT JOIN users u ON qp.user_id = u.id
            ORDER BY 
                CASE qp.status 
                    WHEN 'pending' THEN 0 
                    WHEN 'active' THEN 1 
                    ELSE 2 
                END,
                qp.created_at DESC
        """)
        passes = cursor.fetchall()

        for p in passes:
            if p.get('start_date'): p['start_date'] = p['start_date'].isoformat()
            if p.get('end_date'): p['end_date'] = p['end_date'].isoformat()
            if p.get('created_at'): p['created_at'] = p['created_at'].isoformat()
            if p.get('updated_at'): p['updated_at'] = p['updated_at'].isoformat()
            p['price'] = float(p['price']) if p.get('price') else 500
            p['play_rate'] = float(p['play_rate']) if p.get('play_rate') else 50

        return jsonify({
            'success': True,
            'quest_passes': passes,
            'stats': {
                'total': len(passes),
                'pending': sum(1 for p in passes if p['status'] == 'pending'),
                'active': sum(1 for p in passes if p['status'] == 'active'),
            }
        })

    except Exception as e:
        print(f"Admin quest pass list error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# POST /api/admin/quest-pass/approve/:id — Approve a quest pass + assign device
@quest_pass_bp.route('/api/admin/quest-pass/approve/<int:pass_id>', methods=['POST', 'OPTIONS'])
def admin_approve_quest_pass(pass_id):
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        device_number = data.get('device_number')

        if not device_number or device_number not in [1, 2, 3]:
            return jsonify({'success': False, 'error': 'Please assign a valid PS5 unit (1, 2, or 3)'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        cursor.execute("SELECT * FROM quest_pass WHERE id = %s AND status = 'pending'", (pass_id,))
        qp = cursor.fetchone()
        if not qp:
            return jsonify({'success': False, 'error': 'Quest Pass not found or not pending'}), 404

        # Activate: set dates from today
        start_date = date.today()
        end_date = start_date + timedelta(days=QUEST_DURATION_DAYS)

        cursor.execute("""
            UPDATE quest_pass 
            SET status = 'active', device_number = %s, 
                start_date = %s, end_date = %s,
                admin_notes = %s
            WHERE id = %s
        """, (device_number, start_date, end_date, data.get('notes', ''), pass_id))

        # Initialize progress tracking
        cursor.execute("""
            INSERT INTO quest_progress (quest_pass_id, user_id, game_name, device_number)
            VALUES (%s, %s, %s, %s)
        """, (pass_id, qp['user_id'], qp['game_name'], device_number))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Quest Pass approved! Device PS5-{device_number} assigned for "{qp["game_name"]}"'
        })

    except Exception as e:
        print(f"Admin approve quest pass error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# POST /api/admin/quest-pass/reject/:id — Reject a quest pass
@quest_pass_bp.route('/api/admin/quest-pass/reject/<int:pass_id>', methods=['POST', 'OPTIONS'])
def admin_reject_quest_pass(pass_id):
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        cursor.execute("SELECT * FROM quest_pass WHERE id = %s AND status = 'pending'", (pass_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Quest Pass not found or not pending'}), 404

        cursor.execute("""
            UPDATE quest_pass SET status = 'rejected', admin_notes = %s WHERE id = %s
        """, (data.get('reason', ''), pass_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Quest Pass rejected'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# POST /api/admin/quest-pass/progress/:id — Update progress notes/hours
@quest_pass_bp.route('/api/admin/quest-pass/progress/<int:pass_id>', methods=['POST', 'OPTIONS'])
def admin_update_progress(pass_id):
    if request.method == 'OPTIONS':
        return '', 200
    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        hours = data.get('hours_played', 0)
        notes = data.get('progress_notes', '')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_quest_tables(cursor)
        conn.commit()

        cursor.execute("""
            SELECT id FROM quest_progress WHERE quest_pass_id = %s
            ORDER BY created_at DESC LIMIT 1
        """, (pass_id,))
        prog = cursor.fetchone()

        if prog:
            cursor.execute("""
                UPDATE quest_progress 
                SET hours_played = hours_played + %s, progress_notes = %s, last_played = NOW()
                WHERE id = %s
            """, (hours, notes, prog['id']))
        else:
            # Get quest pass info to create progress entry
            cursor.execute("SELECT user_id, game_name, device_number FROM quest_pass WHERE id = %s", (pass_id,))
            qp = cursor.fetchone()
            if qp:
                cursor.execute("""
                    INSERT INTO quest_progress (quest_pass_id, user_id, game_name, device_number, hours_played, progress_notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (pass_id, qp['user_id'], qp['game_name'], qp['device_number'] or 1, hours, notes))

        conn.commit()
        return jsonify({'success': True, 'message': 'Progress updated'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
