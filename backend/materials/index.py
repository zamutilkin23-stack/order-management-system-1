"""
Business: Manage materials, sections, and colors inventory
Args: event with httpMethod, query params, body
Returns: Materials list or operation result
"""

import json
import os
from typing import Dict, Any
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
        
        params = event.get('queryStringParameters') or {}
        resource_type = params.get('type', 'material')
        
        if method == 'GET':
            resource_id = params.get('id')
            section_id = params.get('section_id')
            user_id = event.get('headers', {}).get('x-user-id')
            
            if resource_type == 'section':
                # Проверяем права доступа
                if user_id:
                    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                    user_row = cur.fetchone()
                    if not user_row or user_row['role'] not in ['admin', 'supervisor']:
                        cur.close()
                        conn.close()
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Доступ запрещен'}),
                            'isBase64Encoded': False
                        }
                
                if resource_id:
                    cur.execute("SELECT * FROM sections WHERE id = %s", (resource_id,))
                    result = dict(cur.fetchone()) if cur.rowcount > 0 else None
                else:
                    cur.execute("SELECT * FROM sections ORDER BY id")
                    result = [dict(row) for row in cur.fetchall()]
            
            elif resource_type == 'color':
                if resource_id:
                    cur.execute("SELECT * FROM colors WHERE id = %s", (resource_id,))
                    result = dict(cur.fetchone()) if cur.rowcount > 0 else None
                else:
                    cur.execute("SELECT * FROM colors ORDER BY id")
                    result = [dict(row) for row in cur.fetchall()]
            
            else:
                if resource_id:
                    cur.execute("SELECT * FROM materials WHERE id = %s", (resource_id,))
                    material = cur.fetchone()
                    if material:
                        mat_dict = dict(material)
                        cur.execute(
                            "SELECT c.* FROM colors c JOIN material_colors mc ON c.id = mc.color_id WHERE mc.material_id = %s",
                            (resource_id,)
                        )
                        mat_dict['colors'] = [dict(row) for row in cur.fetchall()]
                        result = mat_dict
                    else:
                        result = None
                else:
                    query = "SELECT * FROM materials"
                    if section_id:
                        cur.execute(f"{query} WHERE section_id = %s ORDER BY id", (section_id,))
                    else:
                        cur.execute(f"{query} ORDER BY id")
                    
                    materials = cur.fetchall()
                    result = []
                    for mat in materials:
                        mat_dict = dict(mat)
                        cur.execute(
                            "SELECT c.* FROM colors c JOIN material_colors mc ON c.id = mc.color_id WHERE mc.material_id = %s",
                            (mat['id'],)
                        )
                        mat_dict['colors'] = [dict(row) for row in cur.fetchall()]
                        
                        cur.execute(
                            """SELECT mci.color_id, mci.quantity, c.name as color_name, c.hex_code
                               FROM material_color_inventory mci
                               JOIN colors c ON c.id = mci.color_id
                               WHERE mci.material_id = %s AND mci.quantity > 0
                               ORDER BY c.name""",
                            (mat['id'],)
                        )
                        mat_dict['color_inventory'] = [dict(row) for row in cur.fetchall()]
                        result.append(mat_dict)
            
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
            user_id = event.get('headers', {}).get('x-user-id')
            
            # Проверяем права для создания разделов и цветов
            if resource_type in ['section', 'color']:
                if user_id:
                    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                    user_row = cur.fetchone()
                    if not user_row or user_row['role'] not in ['admin', 'supervisor']:
                        cur.close()
                        conn.close()
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Доступ запрещен'}),
                            'isBase64Encoded': False
                        }
            
            if resource_type == 'section':
                name = body_data.get('name')
                parent_id = body_data.get('parent_id')
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Название обязательно'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("INSERT INTO sections (name, parent_id) VALUES (%s, %s) RETURNING *", (name, parent_id))
                result = dict(cur.fetchone())
                conn.commit()
            
            elif resource_type == 'color':
                name = body_data.get('name')
                hex_code = body_data.get('hex_code', '')
                
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Название обязательно'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("INSERT INTO colors (name, hex_code) VALUES (%s, %s) RETURNING *", (name, hex_code))
                result = dict(cur.fetchone())
                conn.commit()
            
            else:
                name = body_data.get('name')
                section_id = body_data.get('section_id')
                quantity = body_data.get('quantity', 0)
                auto_deduct = body_data.get('auto_deduct', False)
                manual_deduct = body_data.get('manual_deduct', True)
                defect_tracking = body_data.get('defect_tracking', False)
                image_url = body_data.get('image_url', '')
                color_ids = body_data.get('color_ids', [])
                
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Название обязательно'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO materials (name, section_id, quantity, auto_deduct, manual_deduct, defect_tracking, image_url) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                    (name, section_id, quantity, auto_deduct, manual_deduct, defect_tracking, image_url)
                )
                material = cur.fetchone()
                material_id = material['id']
                
                for color_id in color_ids:
                    cur.execute(
                        "INSERT INTO material_colors (material_id, color_id) VALUES (%s, %s)",
                        (material_id, color_id)
                    )
                
                conn.commit()
                result = dict(material)
            
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
            resource_id = body_data.get('id')
            user_id = event.get('headers', {}).get('x-user-id')
            
            if not resource_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем права для редактирования разделов и цветов
            if resource_type in ['section', 'color']:
                if user_id:
                    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                    user_row = cur.fetchone()
                    if not user_row or user_row['role'] not in ['admin', 'supervisor']:
                        cur.close()
                        conn.close()
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Доступ запрещен'}),
                            'isBase64Encoded': False
                        }
            
            if resource_type == 'section':
                name = body_data.get('name')
                parent_id = body_data.get('parent_id')
                
                updates = []
                values = []
                
                if name:
                    updates.append("name = %s")
                    values.append(name)
                
                if 'parent_id' in body_data:
                    updates.append("parent_id = %s")
                    values.append(parent_id)
                
                if updates:
                    values.append(resource_id)
                    cur.execute(f"UPDATE sections SET {', '.join(updates)} WHERE id = %s RETURNING *", values)
                    result = dict(cur.fetchone()) if cur.rowcount > 0 else None
                    conn.commit()
                else:
                    result = {'error': 'Нет данных для обновления'}
            
            elif resource_type == 'color':
                updates = []
                values = []
                if 'name' in body_data:
                    updates.append("name = %s")
                    values.append(body_data['name'])
                if 'hex_code' in body_data:
                    updates.append("hex_code = %s")
                    values.append(body_data['hex_code'])
                
                if updates:
                    values.append(resource_id)
                    cur.execute(f"UPDATE colors SET {', '.join(updates)} WHERE id = %s RETURNING *", values)
                    result = dict(cur.fetchone()) if cur.rowcount > 0 else None
                    conn.commit()
                else:
                    result = {'error': 'Нет данных для обновления'}
            
            else:
                updates = []
                values = []
                
                for field in ['name', 'section_id', 'quantity', 'auto_deduct', 'manual_deduct', 'defect_tracking', 'image_url']:
                    if field in body_data:
                        updates.append(f"{field} = %s")
                        values.append(body_data[field])
                
                if 'quantity_change' in body_data:
                    updates.append("quantity = quantity + %s")
                    values.append(body_data['quantity_change'])
                    
                    user_id = body_data.get('updated_by')
                    comment = body_data.get('comment', '')
                    action_type = 'add' if body_data['quantity_change'] > 0 else 'deduct'
                    
                    cur.execute(
                        "INSERT INTO material_history (material_id, user_id, quantity_change, action_type, comment) VALUES (%s, %s, %s, %s, %s)",
                        (resource_id, user_id, body_data['quantity_change'], action_type, comment)
                    )
                    
                    if body_data.get('ship_material'):
                        color_id = body_data.get('color_id')
                        recipient = body_data.get('recipient', '')
                        quantity = abs(body_data['quantity_change'])
                        
                        cur.execute(
                            "INSERT INTO shipments (material_id, color_id, quantity, recipient, comment) VALUES (%s, %s, %s, %s, %s)",
                            (resource_id, color_id, quantity, recipient, comment)
                        )
                        
                        cur.execute(
                            """INSERT INTO material_color_inventory (material_id, color_id, quantity)
                               VALUES (%s, %s, -%s)
                               ON CONFLICT (material_id, color_id)
                               DO UPDATE SET quantity = material_color_inventory.quantity - EXCLUDED.quantity""",
                            (resource_id, color_id, quantity)
                        )
                    
                    if body_data.get('color_id'):
                        color_id = body_data.get('color_id')
                        quantity_change = body_data['quantity_change']
                        
                        cur.execute(
                            """INSERT INTO material_color_inventory (material_id, color_id, quantity)
                               VALUES (%s, %s, %s)
                               ON CONFLICT (material_id, color_id)
                               DO UPDATE SET 
                                   quantity = material_color_inventory.quantity + EXCLUDED.quantity,
                                   updated_at = NOW()""",
                            (resource_id, color_id, quantity_change)
                        )
                
                if updates:
                    updates.append("updated_at = CURRENT_TIMESTAMP")
                    values.append(resource_id)
                    cur.execute(f"UPDATE materials SET {', '.join(updates)} WHERE id = %s RETURNING *", values)
                    result = dict(cur.fetchone()) if cur.rowcount > 0 else None
                    conn.commit()
                    
                    if 'color_ids' in body_data:
                        cur.execute("DELETE FROM material_colors WHERE material_id = %s", (resource_id,))
                        for color_id in body_data['color_ids']:
                            cur.execute("INSERT INTO material_colors (material_id, color_id) VALUES (%s, %s)", (resource_id, color_id))
                        conn.commit()
                else:
                    result = {'error': 'Нет данных для обновления'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            resource_id = params.get('id')
            user_id = event.get('headers', {}).get('x-user-id')
            
            if not resource_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем права для удаления разделов и цветов
            if resource_type in ['section', 'color']:
                if user_id:
                    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                    user_row = cur.fetchone()
                    if not user_row or user_row['role'] not in ['admin', 'supervisor']:
                        cur.close()
                        conn.close()
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Доступ запрещен'}),
                            'isBase64Encoded': False
                        }
            
            if resource_type == 'section':
                cur.execute("DELETE FROM sections WHERE id = %s", (resource_id,))
            elif resource_type == 'color':
                cur.execute("DELETE FROM colors WHERE id = %s", (resource_id,))
            else:
                cur.execute("DELETE FROM material_colors WHERE material_id = %s", (resource_id,))
                cur.execute("DELETE FROM materials WHERE id = %s", (resource_id,))
            
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