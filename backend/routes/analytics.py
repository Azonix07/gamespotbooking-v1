"""
Analytics API Routes
Tracks visitor data and provides analytics insights
"""

from flask import Blueprint, request, jsonify
from config.database import get_db_connection
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/track', methods=['POST', 'OPTIONS'])
def track_visit():
    """Track page visit"""
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        page = data.get('page', '/')
        user_agent = request.headers.get('User-Agent', '')
        ip_address = request.remote_addr
        referrer = data.get('referrer', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = '''
            INSERT INTO page_visits 
            (page, user_agent, ip_address, referrer, visit_time) 
            VALUES (%s, %s, %s, %s, NOW())
        '''
        cursor.execute(query, (page, user_agent, ip_address, referrer))
        conn.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Analytics tracking error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@analytics_bp.route('/api/analytics/stats', methods=['GET', 'OPTIONS'])
def get_analytics_stats():
    """Get comprehensive analytics statistics"""
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total visits (all time)
        cursor.execute('SELECT COUNT(*) as count FROM page_visits')
        total_visits = cursor.fetchone()['count']
        
        # Unique visitors (based on IP)
        cursor.execute('SELECT COUNT(DISTINCT ip_address) as count FROM page_visits')
        unique_visitors = cursor.fetchone()['count']
        
        # Today's visits
        cursor.execute('''
            SELECT COUNT(*) as count FROM page_visits 
            WHERE DATE(visit_time) = CURDATE()
        ''')
        today_visits = cursor.fetchone()['count']
        
        # This month's visits
        cursor.execute('''
            SELECT COUNT(*) as count FROM page_visits 
            WHERE MONTH(visit_time) = MONTH(CURDATE()) 
            AND YEAR(visit_time) = YEAR(CURDATE())
        ''')
        month_visits = cursor.fetchone()['count']
        
        # This week's visits
        cursor.execute('''
            SELECT COUNT(*) as count FROM page_visits 
            WHERE YEARWEEK(visit_time, 1) = YEARWEEK(CURDATE(), 1)
        ''')
        week_visits = cursor.fetchone()['count']
        
        # Yesterday's visits
        cursor.execute('''
            SELECT COUNT(*) as count FROM page_visits 
            WHERE DATE(visit_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ''')
        yesterday_visits = cursor.fetchone()['count']
        
        # Last 7 days visits (daily breakdown)
        cursor.execute('''
            SELECT 
                DATE(visit_time) as date,
                COUNT(*) as count 
            FROM page_visits 
            WHERE visit_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(visit_time)
            ORDER BY date ASC
        ''')
        daily_visits = cursor.fetchall()
        
        # Top pages
        cursor.execute('''
            SELECT 
                page,
                COUNT(*) as visits 
            FROM page_visits 
            GROUP BY page 
            ORDER BY visits DESC 
            LIMIT 10
        ''')
        top_pages = cursor.fetchall()
        
        # Top referrers
        cursor.execute('''
            SELECT 
                referrer,
                COUNT(*) as count 
            FROM page_visits 
            WHERE referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 10
        ''')
        top_referrers = cursor.fetchall()
        
        # Browser stats (simplified from user agent)
        cursor.execute('''
            SELECT 
                CASE
                    WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
                    WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
                    WHEN user_agent LIKE '%Safari%' AND user_agent NOT LIKE '%Chrome%' THEN 'Safari'
                    WHEN user_agent LIKE '%Edge%' THEN 'Edge'
                    ELSE 'Other'
                END as browser,
                COUNT(*) as count
            FROM page_visits
            GROUP BY browser
            ORDER BY count DESC
        ''')
        browser_stats = cursor.fetchall()
        
        # Device stats (desktop vs mobile)
        cursor.execute('''
            SELECT 
                CASE
                    WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' THEN 'Mobile'
                    WHEN user_agent LIKE '%Tablet%' OR user_agent LIKE '%iPad%' THEN 'Tablet'
                    ELSE 'Desktop'
                END as device,
                COUNT(*) as count
            FROM page_visits
            GROUP BY device
            ORDER BY count DESC
        ''')
        device_stats = cursor.fetchall()
        
        # Peak hours
        cursor.execute('''
            SELECT 
                HOUR(visit_time) as hour,
                COUNT(*) as count
            FROM page_visits
            WHERE visit_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY hour
            ORDER BY hour ASC
        ''')
        hourly_stats = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'analytics': {
                'total_visits': total_visits,
                'unique_visitors': unique_visitors,
                'today_visits': today_visits,
                'yesterday_visits': yesterday_visits,
                'week_visits': week_visits,
                'month_visits': month_visits,
                'daily_visits': daily_visits,
                'top_pages': top_pages,
                'top_referrers': top_referrers,
                'browser_stats': browser_stats,
                'device_stats': device_stats,
                'hourly_stats': hourly_stats
            }
        })
        
    except Exception as e:
        print(f"Analytics stats error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
