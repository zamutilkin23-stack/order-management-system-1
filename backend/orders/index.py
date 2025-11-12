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
            order_id = params.get('id')
            status_filter = params.get('status')
            get_shipped = params.get('get_shipped')
            get_free_shipments = params.get('get_free_shipments')
            
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
            
            if body_data.get('free_shipment'):
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
            items = body_data.get('items', [])
            
            if not all([order_number, items]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO orders (order_number, section_id, comment, created_by, status) 
                   VALUES (%s, %s, %s, %s, 'new') RETURNING *""",
                (order_number, section_id, comment, created_by)
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
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            order_id = params.get('id')
            shipment_id = params.get('shipment_id')
            shipment_type = params.get('type')
            
            if shipment_id and shipment_type:
                if shipment_type == 'free':
                    cur.execute("DELETE FROM free_shipments WHERE id = %s", (shipment_id,))
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Свободная отправка удалена'}),
                        'isBase64Encoded': False
                    }
                elif shipment_type == 'order':
                    cur.execute("SELECT order_id FROM shipped_orders WHERE order_id = %s LIMIT 1", (shipment_id,))
                    shipped_order = cur.fetchone()
                    
                    if shipped_order:
                        shipped_order_id = shipped_order['order_id']
                        cur.execute("DELETE FROM shipped_orders WHERE order_id = %s", (shipped_order_id,))
                        cur.execute("UPDATE orders SET status = 'completed', shipped_at = NULL WHERE id = %s", (shipped_order_id,))
                        conn.commit()
                        cur.close()
                        conn.close()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': True, 'message': 'Отправка удалена, заявка возвращена в статус исполнена'}),
                            'isBase64Encoded': False
                        }
                
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный тип отправки'}),
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