import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
  shipped_at?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  material_id: number;
  color_id: number;
  quantity_required: number;
  quantity_completed: number;
}

interface ShippedOrdersHistoryCardProps {
  shippedOrders: Order[];
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  getSectionName: (id: number) => string;
  getMaterialName: (id: number) => string;
}

export default function ShippedOrdersHistoryCard({
  shippedOrders,
  dateFilter,
  setDateFilter,
  getSectionName,
  getMaterialName
}: ShippedOrdersHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="PackageCheck" size={20} className="text-blue-600" />
              Отправленные
            </CardTitle>
            <CardDescription>
              История отправленных заявок
            </CardDescription>
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">За всё время</SelectItem>
              <SelectItem value="today">За сегодня</SelectItem>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shippedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Archive" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет отправленных заявок</p>
              {dateFilter !== 'all' && (
                <p className="text-xs mt-2">за выбранный период</p>
              )}
            </div>
          ) : (
            shippedOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">№ {order.order_number}</h3>
                    <p className="text-xs text-gray-600">{getSectionName(order.section_id)}</p>
                    {order.shipped_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.shipped_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Отправлено
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-gray-700">
                      <span>{getMaterialName(item.material_id)}</span>
                      <span>{item.quantity_completed} шт</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
