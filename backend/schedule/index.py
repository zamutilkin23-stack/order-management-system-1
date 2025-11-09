"""
Business: Manage time tracking with monthly timesheet view and editing
Args: event with httpMethod, query params for month/year filtering
Returns: Time tracking data grouped by user or operation result
"""

import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('user_id')
            month = params.get('month')
            year = params.get('year')
            
            if month and year:
                start_date = f"{year}-{month:0>2}-01"
                
                if int(month) == 12:
                    end_date = f"{int(year)+1}-01-01"
                else:
                    end_date = f"{year}-{int(month)+1:0>2}-01"
                
                if user_id:
                    cur.execute(
                        """SELECT id, full_name, fired_at
                           FROM users
                           WHERE id = %s
                           AND role IN ('worker', 'supervisor')""",
                        (user_id,)
                    )
                else:
                    cur.execute(
                        """SELECT id, full_name, fired_at
                           FROM users
                           WHERE role IN ('worker', 'supervisor')
                           AND status = 'active'
                           ORDER BY full_name"""
                    )
                
                users = cur.fetchall()
                users_map = {}
                
                for user in users:
                    uid = user['id']
                    users_map[uid] = {
                        'user_id': uid,
                        'full_name': user['full_name'],
                        'fired_at': user['fired_at'],
                        'days': {}
                    }
                
                if users_map:
                    user_ids = list(users_map.keys())
                    placeholders = ','.join(['%s'] * len(user_ids))
                    
                    cur.execute(
                        f"""SELECT user_id, work_date, hours, comment, id as record_id
                            FROM time_tracking
                            WHERE user_id IN ({placeholders})
                            AND work_date >= %s::date
                            AND work_date < %s::date
                            ORDER BY work_date""",
                        (*user_ids, start_date, end_date)
                    )
                    
                    time_records = cur.fetchall()
                    
                    for record in time_records:
                        uid = record['user_id']
                        day_key = record['work_date'].strftime('%Y-%m-%d')
                        users_map[uid]['days'][day_key] = {
                            'hours': float(record['hours']),
                            'comment': record['comment'],
                            'record_id': record['record_id']
                        }
                
                result = list(users_map.values())
            
            else:
                cur.execute(
                    """SELECT tt.*, u.full_name, u.role, u.fired_at
                       FROM time_tracking tt 
                       JOIN users u ON tt.user_id = u.id 
                       WHERE u.role IN ('worker', 'supervisor')
                       ORDER BY tt.work_date DESC 
                       LIMIT 100"""
                )
                records = cur.fetchall()
                result = [dict(row) for row in records]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            hours = body_data.get('hours', 0)
            comment = body_data.get('comment', '')
            
            if not all([user_id, work_date]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO time_tracking (user_id, work_date, hours, comment) 
                   VALUES (%s, %s, %s, %s) 
                   ON CONFLICT (user_id, work_date) 
                   DO UPDATE SET hours = EXCLUDED.hours, comment = EXCLUDED.comment, updated_at = NOW()
                   RETURNING *""",
                (user_id, work_date, hours, comment)
            )
            record = cur.fetchone()
            conn.commit()
            result = dict(record)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            record_id = body_data.get('id')
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            hours = body_data.get('hours')
            comment = body_data.get('comment', '')
            
            if record_id:
                cur.execute(
                    """UPDATE time_tracking 
                       SET hours = %s, comment = %s, updated_at = NOW() 
                       WHERE id = %s 
                       RETURNING *""",
                    (hours, comment, record_id)
                )
            elif user_id and work_date:
                cur.execute(
                    """INSERT INTO time_tracking (user_id, work_date, hours, comment) 
                       VALUES (%s, %s, %s, %s) 
                       ON CONFLICT (user_id, work_date) 
                       DO UPDATE SET hours = EXCLUDED.hours, comment = EXCLUDED.comment, updated_at = NOW()
                       RETURNING *""",
                    (user_id, work_date, hours, comment)
                )
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите ID записи или user_id с work_date'}),
                    'isBase64Encoded': False
                }
            
            record = cur.fetchone()
            conn.commit()
            result = dict(record) if record else None
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            record_id = params.get('id')
            
            if not record_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM time_tracking WHERE id = %s", (record_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }