"""
Business: Manage time tracking with monthly timesheet view and manual employee list
Args: event with httpMethod, query params for month/year filtering, type for employees management
Returns: Time tracking data grouped by employee or operation result
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
            req_type = params.get('type')
            
            if req_type == 'employees':
                cur.execute(
                    """SELECT id, full_name
                       FROM timesheet_employees
                       ORDER BY full_name"""
                )
                employees = cur.fetchall()
                result = [dict(row) for row in employees]
            
            else:
                month = params.get('month')
                year = params.get('year')
                employee_ids = params.get('employee_ids', '')
                
                if month and year and employee_ids:
                    start_date = f"{year}-{month:0>2}-01"
                    
                    if int(month) == 12:
                        end_date = f"{int(year)+1}-01-01"
                    else:
                        end_date = f"{year}-{int(month)+1:0>2}-01"
                    
                    emp_id_list = [int(x) for x in employee_ids.split(',') if x]
                    placeholders = ','.join(['%s'] * len(emp_id_list))
                    
                    cur.execute(
                        f"""SELECT id, full_name
                           FROM timesheet_employees
                           WHERE id IN ({placeholders})
                           ORDER BY full_name""",
                        tuple(emp_id_list)
                    )
                    
                    employees = cur.fetchall()
                    employees_map = {}
                    
                    for emp in employees:
                        eid = emp['id']
                        employees_map[eid] = {
                            'employee_id': eid,
                            'full_name': emp['full_name'],
                            'days': {}
                        }
                    
                    if employees_map:
                        cur.execute(
                            f"""SELECT employee_id, work_date, hours, id as record_id
                                FROM time_tracking
                                WHERE employee_id IN ({placeholders})
                                AND work_date >= %s::date
                                AND work_date < %s::date
                                ORDER BY work_date""",
                            (*emp_id_list, start_date, end_date)
                        )
                        
                        time_records = cur.fetchall()
                        
                        for record in time_records:
                            eid = record['employee_id']
                            if eid in employees_map:
                                day_key = record['work_date'].strftime('%Y-%m-%d')
                                employees_map[eid]['days'][day_key] = {
                                    'hours': float(record['hours']),
                                    'record_id': record['record_id']
                                }
                    
                    result = list(employees_map.values())
                else:
                    result = []
            
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
            req_type = body_data.get('type')
            
            if req_type == 'employee':
                full_name = body_data.get('full_name')
                
                if not full_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите ФИО'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO timesheet_employees (full_name) 
                       VALUES (%s) 
                       RETURNING *""",
                    (full_name,)
                )
                employee = cur.fetchone()
                conn.commit()
                result = dict(employee)
            
            else:
                employee_id = body_data.get('employee_id')
                work_date = body_data.get('work_date')
                hours = body_data.get('hours', 0)
                
                if not all([employee_id, work_date]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните обязательные поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO time_tracking (employee_id, work_date, hours) 
                       VALUES (%s, %s, %s) 
                       ON CONFLICT (employee_id, work_date) 
                       DO UPDATE SET hours = EXCLUDED.hours, updated_at = NOW()
                       RETURNING *""",
                    (employee_id, work_date, hours)
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
            employee_id = body_data.get('employee_id')
            work_date = body_data.get('work_date')
            hours = body_data.get('hours')
            
            if not all([employee_id is not None, work_date, hours is not None]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите employee_id, work_date и hours'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO time_tracking (employee_id, work_date, hours) 
                   VALUES (%s, %s, %s) 
                   ON CONFLICT (employee_id, work_date) 
                   DO UPDATE SET hours = EXCLUDED.hours, updated_at = NOW()
                   RETURNING *""",
                (employee_id, work_date, hours)
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
            req_type = params.get('type')
            resource_id = params.get('id')
            
            if req_type == 'employee' and resource_id:
                cur.execute("UPDATE time_tracking SET employee_id = NULL WHERE employee_id = %s", (resource_id,))
                cur.execute("UPDATE timesheet_employees SET full_name = full_name WHERE id = %s", (resource_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Укажите type=employee и id'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
