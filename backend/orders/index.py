"""
Business: Manage production orders with multiple items
Args: event with httpMethod, body for order data
Returns: Orders list or operation result
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
            request_type = params.get('type')
            order_id = params.get('id')
            status_filter = params.get('status')
            get_shipped = params.get('get_shipped')
            get_free_shipments = params.get('get_free_shipments')
            
            # Handle requests (new заявки system)
            if request_type == 'requests':
                cur.execute('''
                    SELECT 
                        r.id, r.request_number, r.section_id, r.status, r.comment,
                        r.created_by, r.created_at, r.updated_at,
                        s.name as section_name,
                        u.full_name as created_by_name
                    FROM requests r
                    LEFT JOIN sections s ON r.section_id = s.id
                    LEFT JOIN users u ON r.created_by = u.id
                    ORDER BY r.created_at DESC
                ''')
                requests = cur.fetchall()
                
                for req in requests:
                    cur.execute('''
                        SELECT id, request_id, material_name, quantity_required, 
                               quantity_completed, color, size, comment
                        FROM request_items
                        WHERE request_id = %s
                        ORDER BY id
                    ''', (req['id'],))
                    req['items'] = cur.fetchall()
                
                result = [dict(r) for r in requests]
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result, default=str, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            if get_free_shipments:
                cur.execute("""
                    SELECT 
                        id,
                        material_id,
                        color_id,
                        quantity,
                        is_defective,
                        shipped_by,
                        comment,
                        shipped_at
                    FROM free_shipments
                    ORDER BY shipped_at DESC
                """)
                free_shipments = cur.fetchall()
                result = [dict(item) for item in free_shipments]
            elif get_shipped:
                cur.execute("""
                    SELECT 
                        so.id,
                        so.order_id,
                        so.material_id,
                        so.color_id,
                        so.quantity,
                        so.is_defective,
                        so.shipped_at,
                        o.order_number,
                        o.section_id
                    FROM shipped_orders so
                    JOIN orders o ON o.id = so.order_id
                    ORDER BY so.shipped_at DESC
                """)
                shipped_items = cur.fetchall()
                result = [dict(item) for item in shipped_items]
            elif order_id:
                cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
                order = cur.fetchone()
                
                if order:
                    cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
                    items = cur.fetchall()
                    order_dict = dict(order)
                    order_dict['items'] = [dict(item) for item in items]
                    result = order_dict
                else:
                    result = None
            else:
                query = "SELECT * FROM orders"
                if status_filter:
                    cur.execute(f"{query} WHERE status = %s ORDER BY created_at DESC", (status_filter,))
                else:
                    cur.execute(f"{query} ORDER BY created_at DESC")
                
                orders = cur.fetchall()
                result = []
                
                for order in orders:
                    order_dict = dict(order)
                    cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order['id'],))
                    items = cur.fetchall()
                    order_dict['items'] = [dict(item) for item in items]
                    result.append(order_dict)
            
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
            params = event.get('queryStringParameters') or {}
            request_type = params.get('type')
            
            # Handle request creation
            if request_type == 'requests':
                request_number = body_data.get('request_number')
                section_id = body_data.get('section_id')
                comment = body_data.get('comment', '')
                created_by = body_data.get('created_by')
                items = body_data.get('items', [])
                
                if not request_number or not section_id or not created_by:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указаны обязательные поля'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    INSERT INTO requests (request_number, section_id, comment, created_by, status)
                    VALUES (%s, %s, %s, %s, 'new')
                    RETURNING id
                ''', (request_number, section_id, comment, created_by))
                
                request_id = cur.fetchone()['id']
                
                for item in items:
                    cur.execute('''
                        INSERT INTO request_items 
                        (request_id, material_name, quantity_required, color, size, comment)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    ''', (
                        request_id,
                        item.get('material_name'),
                        item.get('quantity_required'),
                        item.get('color'),
                        item.get('size'),
                        item.get('comment', '')
                    ))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': request_id, 'message': 'Заявка создана'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif body_data.get('free_shipment'):
                shipped_items = body_data.get('items', [])
                shipped_by = body_data.get('shipped_by')
                comment = body_data.get('comment', '')
                
                for item in shipped_items:
                    material_id = item.get('material_id')
                    color_id = item.get('color_id')
                    quantity = item.get('quantity')
                    is_defective = item.get('is_defective', False)
                    
                    cur.execute(
                        """INSERT INTO free_shipments (material_id, color_id, quantity, is_defective, shipped_by, comment)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (material_id, color_id, quantity, is_defective, shipped_by, comment)
                    )
                    
                    if not is_defective:
                        cur.execute(
                            "SELECT quantity, auto_deduct FROM materials WHERE id = %s",
                            (material_id,)
                        )
                        material_row = cur.fetchone()
                        
                        if material_row and material_row['auto_deduct']:
                            new_quantity = material_row['quantity'] - quantity
                            cur.execute(
                                "UPDATE materials SET quantity = %s WHERE id = %s",
                                (new_quantity, material_id)
                            )
                            
                            cur.execute(
                                """INSERT INTO material_color_inventory (material_id, color_id, quantity)
                                   VALUES (%s, %s, -%s)
                                   ON CONFLICT (material_id, color_id)
                                   DO UPDATE SET quantity = material_color_inventory.quantity - EXCLUDED.quantity""",
                                (material_id, color_id, quantity)
                            )
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Materials shipped successfully'}),
                    'isBase64Encoded': False
                }
            
            order_number = body_data.get('order_number')
            section_id = body_data.get('section_id')
            comment = body_data.get('comment', '')
            created_by = body_data.get('created_by')
            auto_deduct = body_data.get('auto_deduct', True)
            items = body_data.get('items', [])
            
            if not all([order_number, items]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO orders (order_number, section_id, comment, created_by, status, auto_deduct) 
                   VALUES (%s, %s, %s, %s, 'new', %s) RETURNING *""",
                (order_number, section_id, comment, created_by, auto_deduct)
            )
            order = cur.fetchone()
            order_id = order['id']
            
            for item in items:
                cur.execute(
                    """INSERT INTO order_items (order_id, material_id, color_id, quantity_required) 
                       VALUES (%s, %s, %s, %s)""",
                    (order_id, item.get('material_id'), item.get('color_id'), item.get('quantity_required'))
                )
            
            conn.commit()
            
            cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
            items_result = cur.fetchall()
            
            order_dict = dict(order)
            order_dict['items'] = [dict(item) for item in items_result]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(order_dict, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            params = event.get('queryStringParameters') or {}
            request_type = params.get('type')
            
            # Handle request item update
            if request_type == 'requests':
                item_id = body_data.get('item_id')
                quantity_completed = body_data.get('quantity_completed')
                
                if item_id is None or quantity_completed is None:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указаны item_id или quantity_completed'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    UPDATE request_items
                    SET quantity_completed = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING request_id
                ''', (quantity_completed, item_id))
                
                result = cur.fetchone()
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Позиция не найдена'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                request_id = result['request_id']
                
                # Update request status automatically
                cur.execute('''
                    SELECT COUNT(*) as total,
                           SUM(CASE WHEN quantity_required IS NULL OR quantity_completed >= quantity_required THEN 1 ELSE 0 END) as completed,
                           SUM(CASE WHEN quantity_completed > 0 THEN 1 ELSE 0 END) as has_progress
                    FROM request_items
                    WHERE request_id = %s
                ''', (request_id,))
                
                stats = cur.fetchone()
                
                if stats['completed'] == stats['total'] and stats['total'] > 0:
                    new_status = 'completed'
                elif stats['has_progress'] > 0:
                    new_status = 'in_progress'
                else:
                    new_status = 'new'
                
                cur.execute('''
                    UPDATE requests
                    SET status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (new_status, request_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Количество обновлено', 'new_status': new_status}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            order_id = body_data.get('id')
            item_id = body_data.get('item_id')
            
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            if item_id and 'quantity_completed' in body_data:
                cur.execute(
                    "UPDATE order_items SET quantity_completed = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (body_data['quantity_completed'], item_id)
                )
                conn.commit()
                
                cur.execute("""
                    SELECT 
                        CASE 
                            WHEN COUNT(*) = COUNT(CASE WHEN quantity_completed >= quantity_required THEN 1 END) 
                            THEN 'completed'
                            WHEN COUNT(CASE WHEN quantity_completed > 0 THEN 1 END) > 0 
                            THEN 'in_progress'
                            ELSE 'new'
                        END as new_status
                    FROM order_items WHERE order_id = %s
                """, (order_id,))
                
                status_row = cur.fetchone()
                new_status = status_row['new_status'] if status_row else 'new'
                
                completed_at = datetime.now() if new_status == 'completed' else None
                cur.execute(
                    "UPDATE orders SET status = %s, completed_at = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (new_status, completed_at, order_id)
                )
                conn.commit()
            
            if 'status' in body_data:
                new_status = body_data['status']
                
                if new_status == 'shipped':
                    shipped_items = body_data.get('shipped_items', [])
                    shipped_by = body_data.get('shipped_by')
                    
                    cur.execute("SELECT auto_deduct FROM orders WHERE id = %s", (order_id,))
                    order_row = cur.fetchone()
                    order_auto_deduct = order_row['auto_deduct'] if order_row else True
                    
                    for item in shipped_items:
                        material_id = item.get('material_id')
                        color_id = item.get('color_id')
                        quantity = item.get('quantity')
                        is_defective = item.get('is_defective', False)
                        
                        cur.execute(
                            """INSERT INTO shipped_orders (order_id, material_id, color_id, quantity, is_defective, shipped_by)
                               VALUES (%s, %s, %s, %s, %s, %s)""",
                            (order_id, material_id, color_id, quantity, is_defective, shipped_by)
                        )
                        
                        if not is_defective and order_auto_deduct:
                            cur.execute(
                                "SELECT quantity, auto_deduct FROM materials WHERE id = %s",
                                (material_id,)
                            )
                            material_row = cur.fetchone()
                            
                            if material_row and material_row['auto_deduct']:
                                new_quantity = material_row['quantity'] - quantity
                                cur.execute(
                                    "UPDATE materials SET quantity = %s WHERE id = %s",
                                    (new_quantity, material_id)
                                )
                                
                                cur.execute(
                                    """INSERT INTO material_color_inventory (material_id, color_id, quantity)
                                       VALUES (%s, %s, -%s)
                                       ON CONFLICT (material_id, color_id)
                                       DO UPDATE SET quantity = material_color_inventory.quantity - EXCLUDED.quantity""",
                                    (material_id, color_id, quantity)
                                )
                    
                    cur.execute(
                        "UPDATE orders SET status = %s, shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (new_status, order_id)
                    )
                else:
                    cur.execute(
                        "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (new_status, order_id)
                    )
                
                conn.commit()
            
            cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
            order = cur.fetchone()
            
            if order:
                cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
                items = cur.fetchall()
                order_dict = dict(order)
                order_dict['items'] = [dict(item) for item in items]
                result = order_dict
            else:
                result = None
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PATCH':
            params = event.get('queryStringParameters') or {}
            request_type = params.get('type')
            request_id = params.get('id')
            action = params.get('action')
            
            if request_type == 'requests' and action == 'send' and request_id:
                body_data = json.loads(event.get('body', '{}'))
                new_status = body_data.get('status', 'sent')
                
                cur.execute('''
                    UPDATE requests
                    SET status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id
                ''', (new_status, request_id))
                
                result = cur.fetchone()
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Статус обновлен'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверные параметры'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            request_type = params.get('type')
            order_id = params.get('id')
            shipment_id = params.get('shipment_id')
            
            # Handle request deletion
            if request_type == 'requests':
                if not order_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID заявки не передан'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                cur.execute('DELETE FROM request_items WHERE request_id = %s', (order_id,))
                cur.execute('DELETE FROM requests WHERE id = %s RETURNING id', (order_id,))
                deleted = cur.fetchone()
                
                if not deleted:
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Заявка удалена'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            shipment_type = params.get('shipment_type')
            
            # Handle shipment deletion (defects/брак)
            if shipment_id and shipment_type:
                if shipment_type == 'free':
                    cur.execute(
                        "SELECT material_id, color_id, quantity, is_defective FROM free_shipments WHERE id = %s",
                        (shipment_id,)
                    )
                    shipment = cur.fetchone()
                    
                    if shipment and not shipment['is_defective']:
                        material_id = shipment['material_id']
                        color_id = shipment['color_id']
                        quantity = shipment['quantity']
                        
                        cur.execute(
                            "SELECT auto_deduct FROM materials WHERE id = %s",
                            (material_id,)
                        )
                        material = cur.fetchone()
                        
                        if material and material['auto_deduct']:
                            cur.execute(
                                "UPDATE materials SET quantity = quantity + %s WHERE id = %s",
                                (quantity, material_id)
                            )
                            
                            cur.execute(
                                """INSERT INTO material_color_inventory (material_id, color_id, quantity)
                                   VALUES (%s, %s, %s)
                                   ON CONFLICT (material_id, color_id)
                                   DO UPDATE SET quantity = material_color_inventory.quantity + EXCLUDED.quantity""",
                                (material_id, color_id, quantity)
                            )
                    
                    cur.execute("DELETE FROM free_shipments WHERE id = %s", (shipment_id,))
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Свободная отправка удалена, материалы возвращены на склад'}),
                        'isBase64Encoded': False
                    }
                elif shipment_type == 'order':
                    cur.execute("SELECT id FROM shipped_orders WHERE id = %s", (shipment_id,))
                    shipped_item = cur.fetchone()
                    
                    if not shipped_item:
                        conn.close()
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Запись не найдена'}, ensure_ascii=False),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute("DELETE FROM shipped_orders WHERE id = %s", (shipment_id,))
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Брак утилизирован'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный тип отправки'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT completed_at FROM orders WHERE id = %s", (order_id,))
            order = cur.fetchone()
            
            if order and order['completed_at']:
                completed_date = order['completed_at']
                six_months_ago = datetime.now() - timedelta(days=180)
                
                if completed_date > six_months_ago:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявку можно удалить только через 6 месяцев после выполнения'}),
                        'isBase64Encoded': False
                    }
            
            cur.execute("DELETE FROM order_items WHERE order_id = %s", (order_id,))
            cur.execute("DELETE FROM orders WHERE id = %s", (order_id,))
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