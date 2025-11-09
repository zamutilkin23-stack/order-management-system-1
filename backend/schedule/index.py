"""
Business: Manage work schedule with hours tracking per employee
Args: event with httpMethod, query params for filtering by user/month
Returns: Schedule data or operation result
"""

import json
import os
from typing import Dict, Any
from datetime import datetime
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
            
            if user_id and month and year:
                cur.execute(
                    """SELECT ws.*, u.full_name 
                       FROM work_schedule ws 
                       JOIN users u ON ws.user_id = u.id 
                       WHERE ws.user_id = %s 
                       AND EXTRACT(MONTH FROM ws.work_date) = %s 
                       AND EXTRACT(YEAR FROM ws.work_date) = %s 
                       ORDER BY ws.work_date""",
                    (user_id, month, year)
                )
                records = cur.fetchall()
                result = [dict(row) for row in records]
                
                total_hours = sum(float(row['hours']) for row in records)
                result = {
                    'records': result,
                    'total_hours': total_hours
                }
            
            elif month and year:
                cur.execute(
                    """SELECT ws.*, u.full_name 
                       FROM work_schedule ws 
                       JOIN users u ON ws.user_id = u.id 
                       WHERE EXTRACT(MONTH FROM ws.work_date) = %s 
                       AND EXTRACT(YEAR FROM ws.work_date) = %s 
                       AND u.role IN ('worker', 'supervisor')
                       ORDER BY ws.work_date, u.full_name""",
                    (month, year)
                )
                records = cur.fetchall()
                result = [dict(row) for row in records]
            
            else:
                cur.execute(
                    """SELECT ws.*, u.full_name 
                       FROM work_schedule ws 
                       JOIN users u ON ws.user_id = u.id 
                       WHERE u.role IN ('worker', 'supervisor')
                       ORDER BY ws.work_date DESC 
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
            hours = body_data.get('hours')
            created_by = body_data.get('created_by')
            
            if not all([user_id, work_date, hours]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            try:
                cur.execute(
                    """INSERT INTO work_schedule (user_id, work_date, hours, created_by) 
                       VALUES (%s, %s, %s, %s) RETURNING *""",
                    (user_id, work_date, hours, created_by)
                )
                record = cur.fetchone()
                conn.commit()
                result = dict(record)
            except psycopg2.IntegrityError:
                conn.rollback()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Запись на эту дату уже существует'}),
                    'isBase64Encoded': False
                }
            
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
            hours = body_data.get('hours')
            
            if not all([record_id, hours]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID и часы обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE work_schedule SET hours = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                (hours, record_id)
            )
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
            
            cur.execute("DELETE FROM work_schedule WHERE id = %s", (record_id,))
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
